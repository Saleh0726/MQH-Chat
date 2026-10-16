import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().trim().email().max(254),
  username: z.string().trim().max(24).optional(),
  message: z.string().trim().max(500).optional()
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "أدخل بريدًا إلكترونيًا صحيحًا." }, { status: 400 });
    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { username: true } });
    if (!user) return NextResponse.json({ error: "إذا كان البريد مرتبطًا بحساب، فسيظهر الطلب للإدارة بعد التحقق." }, { status: 200 });
    const existing = await prisma.passwordResetRequest.findFirst({ where: { email, status: "pending" } });
    if (existing) return NextResponse.json({ ok: true, message: "عندك طلب استعادة قيد المراجعة بالفعل." });
    await prisma.passwordResetRequest.create({ data: { email, username: parsed.data.username || user.username, message: parsed.data.message, status: "pending" } });
    return NextResponse.json({ ok: true, message: "وصل طلبك للإدارة. ارجع لهذه الصفحة بعد ما تستلم رمز الاستعادة." }, { status: 201 });
  } catch (error) {
    console.error("password reset request error", error);
    return NextResponse.json({ error: "تعذر إرسال الطلب حاليًا. حاول مرة ثانية لاحقًا." }, { status: 500 });
  }
}
