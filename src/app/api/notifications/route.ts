import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isSuspended: true, suspensionReason: true } });
  if (!user || user.isSuspended) return NextResponse.json({ error: "حسابك مقيّد من الإدارة.", suspended: true, reason: user?.suspensionReason || null }, { status: 403 });
  const notifications = await prisma.notification.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, title: true, body: true, readAt: true, createdAt: true }
  });
  return NextResponse.json({ notifications });
}
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });
  const data = await request.json().catch(() => ({}));
  if (typeof data.id !== "string") return NextResponse.json({ error: "معرّف الإشعار مطلوب." }, { status: 400 });
  const result = await prisma.notification.updateMany({
    where: { id: data.id, OR: [{ userId }, { userId: null }] },
    data: { readAt: new Date() }
  });
  return NextResponse.json({ ok: result.count > 0 });
}
