import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().trim().min(6).max(32),
  password: z.string().min(8).max(128)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "تحقق من البريد والرمز، وكلمة المرور يجب أن تكون 8 أحرف على الأقل." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  try {
    const reset = await prisma.passwordResetRequest.findFirst({
      where: { email, resetCode: parsed.data.code, status: "code_issued" }
    });
    if (!reset) return NextResponse.json({ error: "رمز الاستعادة غير صحيح أو تم استخدامه." }, { status: 400 });
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (!user) return NextResponse.json({ error: "تعذر العثور على الحساب." }, { status: 404 });
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) } }),
      prisma.passwordResetRequest.update({ where: { id: reset.id }, data: { status: "completed", resetCode: null } })
    ]);
    return NextResponse.json({ ok: true, message: "تم تغيير كلمة المرور. تقدر تسجل الدخول الآن." });
  } catch (error) {
    console.error("password reset completion error", error);
    return NextResponse.json({ error: "تعذر تغيير كلمة المرور حاليًا." }, { status: 500 });
  }
}
