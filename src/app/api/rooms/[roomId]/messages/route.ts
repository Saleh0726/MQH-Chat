import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
type Context = { params: Promise<{ roomId: string }> };
export async function GET(_request: Request, context: Context) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });
  const account = await prisma.user.findUnique({ where: { id: userId }, select: { isSuspended: true } });
  if (!account || account.isSuspended) return NextResponse.json({ error: "حسابك مقيّد من الإدارة." }, { status: 403 });
  const { roomId } = await context.params;
  const member = await prisma.membership.findUnique({ where: { userId_roomId: { userId, roomId } } });
  if (!member) return NextResponse.json({ error: "لا تملك صلاحية الوصول لهذه الغرفة." }, { status: 403 });
  const messages = await prisma.message.findMany({ where: { roomId }, orderBy: { createdAt: "asc" }, take: 100, include: { user: { select: { id: true, username: true } } } });
  return NextResponse.json({ messages });
}
const schema = z.object({ body: z.string().trim().min(1).max(4000) });
export async function POST(request: Request, context: Context) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });
  const account = await prisma.user.findUnique({ where: { id: userId }, select: { isSuspended: true } });
  if (!account || account.isSuspended) return NextResponse.json({ error: "حسابك مقيّد من الإدارة." }, { status: 403 });
  const { roomId } = await context.params;
  const member = await prisma.membership.findUnique({ where: { userId_roomId: { userId, roomId } } });
  if (!member) return NextResponse.json({ error: "لا تملك صلاحية إرسال رسائل في هذه الغرفة." }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "الرسالة فارغة أو طويلة جدًا." }, { status: 400 });
  const message = await prisma.message.create({ data: { body: parsed.data.body, roomId, userId }, include: { user: { select: { id: true, username: true } } } });
  return NextResponse.json({ message }, { status: 201 });
}