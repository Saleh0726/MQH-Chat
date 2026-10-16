import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

function authorized(request: Request) {
  const expected = process.env.CHAT_ADMIN_PASSWORD;
  return Boolean(expected && expected.length >= 12 && request.headers.get("x-admin-password") === expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "كلمة مرور الإدارة غير صحيحة." }, { status: 401 });
  try {
    const requests = await prisma.passwordResetRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "قاعدة البيانات غير مهيأة لطلبات الاستعادة بعد." }, { status: 500 });
  }
}

const schema = z.object({ id: z.string().min(1), action: z.enum(["issue", "close"]), code: z.string().trim().min(6).max(32).optional() });
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "كلمة مرور الإدارة غير صحيحة." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "بيانات الطلب غير صحيحة." }, { status: 400 });
  try {
    const item = await prisma.passwordResetRequest.findUnique({ where: { id: parsed.data.id } });
    if (!item) return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
    if (parsed.data.action === "close") {
      await prisma.passwordResetRequest.update({ where: { id: item.id }, data: { status: "closed", resetCode: null } });
      return NextResponse.json({ ok: true });
    }
    const code = parsed.data.code || randomBytes(5).toString("hex").toUpperCase();
    await prisma.passwordResetRequest.update({ where: { id: item.id }, data: { resetCode: code, status: "code_issued" } });
    return NextResponse.json({ ok: true, code });
  } catch {
    return NextResponse.json({ error: "تعذر تحديث الطلب. قد يكون الرمز مستخدمًا من قبل." }, { status: 500 });
  }
}
