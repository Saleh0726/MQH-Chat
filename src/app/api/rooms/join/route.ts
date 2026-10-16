import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
const schema = z.object({ code: z.string().trim().min(4).max(100) });
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });
  const account = await prisma.user.findUnique({ where: { id: userId }, select: { isSuspended: true } });
  if (!account || account.isSuspended) return NextResponse.json({ error: "حسابك مقيّد من الإدارة." }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "أدخل كود دعوة صحيحًا." }, { status: 400 });
  const code = parsed.data.code.toUpperCase();
  const invite = await prisma.invite.findUnique({ where: { code } });
  let roomId = invite?.roomId;
  if (!roomId) roomId = (await prisma.room.findUnique({ where: { inviteCode: code }, select: { id: true } }))?.id;
  if (!roomId || (invite?.expiresAt && invite.expiresAt < new Date())) return NextResponse.json({ error: "كود الدعوة غير صحيح أو انتهت صلاحيته." }, { status: 404 });
  await prisma.membership.upsert({ where: { userId_roomId: { userId, roomId } }, update: {}, create: { userId, roomId } });
  return NextResponse.json({ ok: true, roomId });
}