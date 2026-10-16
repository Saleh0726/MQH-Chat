import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "أدخل بريدًا إلكترونيًا وكلمة مرور صحيحة." }, { status: 400 });
    const { email, password } = parsed.data;
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json({ error: "تعذر تسجيل الدخول. تأكد من إعداد قاعدة البيانات وإعدادات الجلسة." }, { status: 500 });
  }
}