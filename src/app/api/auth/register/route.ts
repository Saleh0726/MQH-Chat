import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const schema = z.object({
  username: z.string().trim().min(3).max(24).regex(/^[\p{L}\p{N}_-]+$/u),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128)
});
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "تحقق من البيانات: اسم المستخدم 3 أحرف على الأقل وكلمة المرور 8 أحرف على الأقل." }, { status: 400 });
    const { username, email, password } = parsed.data;
    const existing = await prisma.user.findFirst({ where: { OR: [{ username: { equals: username, mode: "insensitive" } }, { email: { equals: email, mode: "insensitive" } }] } });
    if (existing) return NextResponse.json({ error: "البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل." }, { status: 409 });
    const user = await prisma.user.create({ data: { username, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12) }, select: { id: true, username: true, email: true } });
    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("register error", error);
    return NextResponse.json({ error: "تعذر إنشاء الحساب. تأكد من إعداد قاعدة البيانات وإعدادات الجلسة." }, { status: 500 });
  }
}