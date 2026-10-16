import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createAdminSession } from "@/lib/admin-session";
const schema=z.object({email:z.string().trim().email().max(254),password:z.string().min(1).max(128)});
function same(a:string,b:string){const aa=Buffer.from(a);const bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}
export async function POST(request:Request){const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"أدخل البريد وكلمة المرور."},{status:400});const email=process.env.ADMIN_EMAIL;const password=process.env.ADMIN_PASSWORD || process.env.CHAT_ADMIN_PASSWORD;if(!email||!password||!same(parsed.data.email.toLowerCase(),email.toLowerCase())||!same(parsed.data.password,password))return NextResponse.json({error:"بيانات دخول الإدارة غير صحيحة."},{status:401});try{await createAdminSession();return NextResponse.json({ok:true,email});}catch{return NextResponse.json({error:"إعداد جلسة الإدارة غير مكتمل."},{status:500});}}
