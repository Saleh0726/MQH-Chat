import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ user: null });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, email: true, isSuspended: true, suspensionReason: true } });
  if (user?.isSuspended) return NextResponse.json({ user: null, suspended: true, reason: user.suspensionReason });
  return NextResponse.json({ user });
}