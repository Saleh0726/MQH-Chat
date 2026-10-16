import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin-session";
export async function GET(){if(!await isAdminSession())return NextResponse.json({error:"سجّل دخول الإدارة أولًا."},{status:401});try{const [userCount,roomCount,messageCount,pendingResets,users,rooms,resets]=await Promise.all([
prisma.user.count(),prisma.room.count(),prisma.message.count(),prisma.passwordResetRequest.count({where:{status:"pending"}}),
prisma.user.findMany({select:{id:true,username:true,email:true,createdAt:true,_count:{select:{memberships:true,messages:true}}},orderBy:{createdAt:"desc"},take:100}),
prisma.room.findMany({select:{id:true,name:true,inviteCode:true,createdAt:true,_count:{select:{memberships:true,messages:true}}},orderBy:{createdAt:"desc"},take:100}),
prisma.passwordResetRequest.findMany({select:{id:true,email:true,username:true,message:true,status:true,createdAt:true},orderBy:{createdAt:"desc"},take:100})
]);return NextResponse.json({stats:{userCount,roomCount,messageCount,pendingResets},users:users.map(u=>({...u,memberships:u._count.memberships,messages:u._count.messages,_count:undefined})),rooms:rooms.map(r=>({...r,members:r._count.memberships,messages:r._count.messages,_count:undefined})),resets});}catch(error){console.error("admin overview error",error);return NextResponse.json({error:"تعذر تحميل بيانات لوحة الإدارة."},{status:500});}}
