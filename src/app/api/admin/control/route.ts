import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin-session";

export async function GET(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const [users, rooms] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 300, select: {
        id: true, username: true, email: true, createdAt: true, isSuspended: true, suspensionReason: true,
        _count: { select: { memberships: true, messages: true } }
      }}),
      prisma.room.findMany({ orderBy: { createdAt: "desc" }, take: 300, select: {
        id: true, name: true, createdAt: true, _count: { select: { memberships: true, messages: true } }
      }})
    ]);
    const messages = roomId ? await prisma.message.findMany({
      where: { roomId }, orderBy: { createdAt: "asc" }, take: 500,
      include: { user: { select: { id: true, username: true, email: true } } }
    }) : [];
    return NextResponse.json({
      users: users.map(({_count, ...u}) => ({...u, rooms: _count.memberships, messages: _count.messages})),
      rooms: rooms.map(({_count, ...r}) => ({...r, members: _count.memberships, messages: _count.messages})),
      messages
    });
  } catch (error) {
    console.error("admin control GET", error);
    return NextResponse.json({ error: "تعذر تحميل بيانات الإدارة." }, { status: 500 });
  }
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("notify"), userId: z.string().optional(), title: z.string().trim().min(2).max(160), body: z.string().trim().min(2).max(1500) }),
  z.object({ action: z.literal("updateUser"), userId: z.string().min(1), username: z.string().trim().min(3).max(24).regex(/^[\p{L}\p{N}_-]+$/u), email: z.string().trim().email().max(254) }),
  z.object({ action: z.literal("suspend"), userId: z.string().min(1), suspended: z.boolean(), reason: z.string().trim().max(500).optional() }),
  z.object({ action: z.literal("resetPassword"), userId: z.string().min(1) }),
]);
export async function POST(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "تحقق من البيانات المدخلة." }, { status: 400 });
  try {
    const input = parsed.data;
    if (input.action === "notify") {
      if (input.userId && !(await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } })))
        return NextResponse.json({ error: "المستخدم غير موجود." }, { status: 404 });
      const notification = await prisma.notification.create({ data: { title: input.title, body: input.body, userId: input.userId || null } });
      return NextResponse.json({ ok: true, notificationId: notification.id });
    }
    if (input.action === "updateUser") {
      const collision = await prisma.user.findFirst({ where: { id: { not: input.userId }, OR: [
        { username: { equals: input.username, mode: "insensitive" } },
        { email: { equals: input.email, mode: "insensitive" } }
      ] }, select: { id: true } });
      if (collision) return NextResponse.json({ error: "اسم المستخدم أو البريد مستخدم من حساب آخر." }, { status: 409 });
      const user = await prisma.user.update({ where: { id: input.userId }, data: { username: input.username, email: input.email.toLowerCase() }, select: { id: true, username: true, email: true } });
      return NextResponse.json({ ok: true, user });
    }
    if (input.action === "suspend") {
      const user = await prisma.user.update({ where: { id: input.userId }, data: {
        isSuspended: input.suspended,
        suspensionReason: input.suspended ? (input.reason || "تم تقييد الحساب من الإدارة.") : null
      }, select: { id: true, username: true, isSuspended: true } });
      if (input.suspended) await prisma.notification.create({ data: { userId: user.id, title: "تنبيه بخصوص حسابك", body: input.reason || "تم تقييد حسابك مؤقتًا من الإدارة. يرجى التواصل مع الإدارة." } });
      return NextResponse.json({ ok: true, user });
    }
    const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود." }, { status: 404 });
    const temporaryPassword = randomBytes(12).toString("base64url");
    await prisma.user.update({ where: { id: input.userId }, data: { passwordHash: await bcrypt.hash(temporaryPassword, 12) } });
    return NextResponse.json({ ok: true, temporaryPassword, message: "تم تعيين كلمة مرور مؤقتة. انسخها وأرسلها للمستخدم بشكل آمن؛ لن تظهر مرة أخرى." });
  } catch (error) {
    console.error("admin control POST", error);
    return NextResponse.json({ error: "تعذر تنفيذ العملية. تحقق من البيانات." }, { status: 500 });
  }
}
