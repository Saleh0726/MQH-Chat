import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin-session";

const schema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(10).max(128),
});
export async function POST(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "سجّل دخول الإدارة أولًا." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون 10 أحرف على الأقل." }, { status: 400 });
  try {
    const credential = await prisma.adminCredential.findUnique({ where: { id: "main" } });
    if (!credential || !(await bcrypt.compare(parsed.data.currentPassword, credential.passwordHash))) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة." }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.adminCredential.update({ where: { id: "main" }, data: { passwordHash } });
    return NextResponse.json({ ok: true, message: "تم تغيير كلمة مرور الإدارة بنجاح." });
  } catch (error) {
    console.error("admin password change error", error);
    return NextResponse.json({ error: "تعذر تغيير كلمة المرور. حاول مرة أخرى." }, { status: 500 });
  }
}
