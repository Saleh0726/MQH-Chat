"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";

export default function ResetPasswordPage(){
 const [email,setEmail]=useState("");const [code,setCode]=useState("");const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [error,setError]=useState("");const [success,setSuccess]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setError("");setSuccess("");if(password!==confirm){setError("كلمتا المرور غير متطابقتين.");return;}setBusy(true);try{const r=await fetch("/api/password-reset/complete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,code,password})});const d=await r.json();if(!r.ok)throw new Error(d.error||"تعذر تغيير كلمة المرور");setSuccess(d.message||"تم تغيير كلمة المرور.");setCode("");setPassword("");setConfirm("");}catch(e){setError(e instanceof Error?e.message:"حدث خطأ.");}finally{setBusy(false);}}
 return <main style={wrap}><section style={card}><Link href="/forgot-password" style={link}><ArrowRight size={16}/> طلب رمز استعادة</Link><div style={badge}><KeyRound size={22}/></div><h1 style={h1}>تعيين كلمة مرور جديدة</h1><p style={muted}>أدخل بريد حسابك والرمز الذي أعطاك إياه مسؤول الموقع.</p><form onSubmit={submit} style={{display:"grid",gap:14,marginTop:22}}><label style={label}>البريد الإلكتروني<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} style={input} dir="ltr"/></label><label style={label}>رمز الاستعادة<input required minLength={6} maxLength={32} value={code} onChange={e=>setCode(e.target.value)} style={input} dir="ltr"/></label><label style={label}>كلمة المرور الجديدة<input required minLength={8} maxLength={128} type="password" value={password} onChange={e=>setPassword(e.target.value)} style={input} autoComplete="new-password"/></label><label style={label}>تأكيد كلمة المرور<input required minLength={8} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} style={input} autoComplete="new-password"/></label>{error&&<p style={{color:"var(--danger)"}}>{error}</p>}{success&&<p style={{color:"var(--green)"}}>{success} <Link href="/" style={{color:"var(--accent)"}}>تسجيل الدخول</Link></p>}<button disabled={busy} style={button}>{busy?"جارٍ التحديث...":"تغيير كلمة المرور"}</button></form></section></main>;
}
const wrap:React.CSSProperties={minHeight:"100vh",display:"grid",placeItems:"center",padding:20,background:"var(--bg)"};
const card:React.CSSProperties={width:"min(100%,440px)",padding:28,border:"1px solid var(--border)",borderRadius:20,background:"var(--panel)",boxShadow:"var(--shadow)"};
const badge:React.CSSProperties={width:48,height:48,borderRadius:14,display:"grid",placeItems:"center",background:"var(--accent-soft)",color:"var(--accent)",marginTop:26};
const h1:React.CSSProperties={fontSize:25,margin:"16px 0 8px"};
const muted:React.CSSProperties={color:"var(--muted)",lineHeight:1.8,fontSize:14};
const label:React.CSSProperties={display:"grid",gap:8,fontWeight:600};
const input:React.CSSProperties={width:"100%",padding:"12px 14px",border:"1px solid var(--border)",borderRadius:10,background:"var(--panel-2)",color:"var(--text)",outline:"none"};
const button:React.CSSProperties={padding:13,border:0,borderRadius:10,background:"var(--accent)",color:"white",fontWeight:700};
const link:React.CSSProperties={display:"inline-flex",alignItems:"center",gap:6,color:"var(--muted)",textDecoration:"none",fontSize:13};
