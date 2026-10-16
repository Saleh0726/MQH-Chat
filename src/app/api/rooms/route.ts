import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });
  const memberships = await prisma.membership.findMany({
    where: { userId }, include: { room: { include: { messages: { orderBy: { createdAt: "desc" }, take: 1, include: { user: { select: { username: true } } } }, _count: { select: { memberships: true } } } } },
    orderBy: { joinedAt: "desc" }
  });
  return NextResponse.json({ rooms: memberships.map(m => ({ id: m.room.id, name: m.room.name, inviteCode: m.room.inviteCode, members: m.room._count.memberships, lastMessage: m.room.messages[0] ? { body: m.room.messages[0].body, username: m.room.messages[0].user.username, createdAt: m.room.messages[0].createdAt } : null })) });
}
const schema = z.object({ name: z.string().trim().min(2).max(60) });
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "سجّل الدخول أولًا." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "اسم الغرفة يجب أن يكون بين حرفين و60 حرفًا." }, { status: 400 });
  try {
    const room = await prisma.room.create({ data: { name: parsed.data.name, inviteCode: randomBytes(5).toString("hex").toUpperCase(), memberships: { create: { userId } } }, select: { id: true, name: true, inviteCode: true } });
    return NextResponse.json({ room }, { status: 201 });
  } catch { return NextResponse.json({ error: "تعذر إنشاء الغرفة." }, { status: 500 }); }
}