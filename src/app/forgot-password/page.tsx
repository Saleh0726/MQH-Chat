"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, MessageCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email,setEmail]=useState(""); const [username,setUsername]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");setMessage("");try{const r=await fetch("/api/password-reset/requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,username:username||undefined})});const d=await r.json();if(!r.ok)throw new Error(d.error||"تعذر إرسال الطلب");setMessage(d.message||"تم إرسال الطلب للإدارة.");}catch(e){setError(e instanceof Error?e.message:"حدث خطأ.");}finally{setBusy(false);}}
  return <main style={wrap}><section style={card}><Link href="/" style={link}><ArrowRight size={16}/> العودة لتسجيل الدخول</Link><div style={brand}><MessageCircle size={22}/> MQH-Chat</div><div style={badge}><KeyRound size={22}/></div><h1 style={h1}>استعادة كلمة المرور</h1><p style={muted}>أرسل طلبًا للإدارة. بعد التحقق، سيعطيك المسؤول رمزًا تستخدمه لتعيين كلمة مرور جديدة.</p><form onSubmit={submit} style={{display:"grid",gap:14,marginTop:24}}><label style={label}>البريد الإلكتروني المرتبط بالحساب<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={input} dir="ltr"/></label><label style={label}>اسم المستخدم (اختياري)<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="اسم المستخدم" style={input}/></label>{error&&<p style={errorStyle}>{error}</p>}{message&&<p style={successStyle}>{message}</p>}<button disabled={busy} style={button}>{busy?"جارٍ الإرسال...":"إرسال طلب الاستعادة"}</button></form><p style={muted}>بعد استلام الرمز، <Link href="/reset-password" style={{color:"var(--accent)"}}>غيّر كلمة المرور من هنا</Link>.</p></section></main>;
}
const wrap:React.CSSProperties={minHeight:"100vh",display:"grid",placeItems:"center",padding:20,background:"var(--bg)"};
const card:React.CSSProperties={width:"min(100%,440px)",padding:28,border:"1px solid var(--border)",borderRadius:20,background:"var(--panel)",boxShadow:"var(--shadow)"};
const brand:React.CSSProperties={display:"flex",alignItems:"center",gap:8,fontWeight:800,fontSize:18,margin:"26px 0"};
const badge:React.CSSProperties={width:48,height:48,borderRadius:14,display:"grid",placeItems:"center",background:"var(--accent-soft)",color:"var(--accent)"};
const h1:React.CSSProperties={fontSize:25,margin:"16px 0 8px"};
const muted:React.CSSProperties={color:"var(--muted)",lineHeight:1.8,fontSize:14};
const label:React.CSSProperties={display:"grid",gap:8,fontWeight:600};
const input:React.CSSProperties={width:"100%",padding:"12px 14px",border:"1px solid var(--border)",borderRadius:10,background:"var(--panel-2)",color:"var(--text)",outline:"none"};
const button:React.CSSProperties={padding:13,border:0,borderRadius:10,background:"var(--accent)",color:"white",fontWeight:700};
const link:React.CSSProperties={display:"inline-flex",alignItems:"center",gap:6,color:"var(--muted)",textDecoration:"none",fontSize:13};
const errorStyle:React.CSSProperties={color:"var(--danger)",margin:0};
const successStyle:React.CSSProperties={color:"var(--green)",margin:0,lineHeight:1.7};
