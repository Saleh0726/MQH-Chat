import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isSuspended: true, suspensionReason: true } });
  if (!user || user.isSuspended) return NextResponse.json({ error: "حسابك مقيّد من الإدارة.", suspended: true, reason: user?.suspensionReason || null }, { status: 403 });
  const rows = await prisma.notification.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: { createdAt: "desc" }, take: 50,
    include: { reads: { where: { userId }, select: { readAt: true } } }
  });
  return NextResponse.json({ notifications: rows.map(({ reads, ...n }) => ({ ...n, readAt: reads[0]?.readAt ?? null })) });
}
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });
  const data = await request.json().catch(() => ({}));
  if (typeof data.id !== "string") return NextResponse.json({ error: "معرّف الإشعار مطلوب." }, { status: 400 });
  const notification = await prisma.notification.findFirst({ where: { id: data.id, OR: [{ userId }, { userId: null }] }, select: { id: true } });
  if (!notification) return NextResponse.json({ error: "الإشعار غير موجود." }, { status: 404 });
  await prisma.notificationRead.upsert({
    where: { userId_notificationId: { userId, notificationId: data.id } },
    create: { userId, notificationId: data.id }, update: { readAt: new Date() }
  });
  return NextResponse.json({ ok: true });
}
