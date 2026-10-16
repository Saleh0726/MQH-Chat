import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/admin-session";

const schema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});
function same(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "أدخل البريد وكلمة المرور." }, { status: 400 });
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !same(parsed.data.email.toLowerCase(), adminEmail.toLowerCase())) {
    return NextResponse.json({ error: "بيانات دخول الإدارة غير صحيحة." }, { status: 401 });
  }
  try {
    // The first admin password is the admin email. Once changed, the database hash is authoritative.
    const initialHash = await bcrypt.hash(adminEmail, 12);
    const credential = await prisma.adminCredential.upsert({
      where: { id: "main" },
      create: { id: "main", passwordHash: initialHash },
      update: {},
    });
    if (!(await bcrypt.compare(parsed.data.password, credential.passwordHash))) {
      return NextResponse.json({ error: "بيانات دخول الإدارة غير صحيحة." }, { status: 401 });
    }
    await createAdminSession();
    return NextResponse.json({ ok: true, email: adminEmail });
  } catch (error) {
    console.error("admin login error", error);
    return NextResponse.json({ error: "تعذر تسجيل الدخول. تحقق من إعدادات قاعدة البيانات." }, { status: 500 });
  }
}
