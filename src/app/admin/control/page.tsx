"use client";
import { useEffect, useMemo, useState, FormEvent } from "react";
import { ArrowRight, Bell, Eye, KeyRound, ShieldAlert, Users, RefreshCw } from "lucide-react";

type User = { id:string; username:string; email:string; createdAt:string; isSuspended:boolean; suspensionReason:string|null; rooms:number; messages:number };
type Room = { id:string; name:string; createdAt:string; members:number; messages:number };
type ChatMessage = { id:string; body:string; createdAt:string; user:{id:string;username:string;email:string} };
type Payload = { users:User[]; rooms:Room[]; messages:ChatMessage[] };
export default function AdminControlPage() {
  const [data,setData]=useState<Payload>({users:[],rooms:[],messages:[]});
  const [selectedUser,setSelectedUser]=useState("");
  const [selectedRoom,setSelectedRoom]=useState("");
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [reason,setReason]=useState("");
  const [title,setTitle]=useState("تنبيه من إدارة MQH-Chat");
  const [body,setBody]=useState("");
  const [target,setTarget]=useState("all");
  const [temporaryPassword,setTemporaryPassword]=useState("");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const currentUser=useMemo(()=>data.users.find(u=>u.id===selectedUser),[data.users,selectedUser]);

  async function load(roomId=selectedRoom) {
    setError("");
    try {
      const r=await fetch("/api/admin/control"+(roomId?"?roomId="+encodeURIComponent(roomId):""),{cache:"no-store"});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"تعذر تحميل البيانات. سجّل الدخول إلى لوحة الإدارة أولًا.");
      setData(d);
      if(!selectedUser && d.users[0]) setSelectedUser(d.users[0].id);
      if(!roomId && d.rooms[0]) { setSelectedRoom(d.rooms[0].id); }
      return d;
    } catch(e) { setError(e instanceof Error?e.message:"حدث خطأ."); }
  }
  useEffect(()=>{ void load(""); },[]);
  useEffect(()=>{ if(currentUser){setUsername(currentUser.username);setEmail(currentUser.email);setReason(currentUser.suspensionReason||"");} },[currentUser?.id]);
  async function action(payload:Record<string,unknown>) {
    setBusy(true);setError("");setNotice("");setTemporaryPassword("");
    try {
      const r=await fetch("/api/admin/control",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"تعذر تنفيذ العملية.");
      if(d.temporaryPassword) setTemporaryPassword(d.temporaryPassword);
      setNotice(d.message||"تم تنفيذ العملية بنجاح.");
      await load(selectedRoom);
    } catch(e) {setError(e instanceof Error?e.message:"حدث خطأ.");}
    finally {setBusy(false);}
  }
  function saveUser(e:FormEvent){e.preventDefault();if(selectedUser)void action({action:"updateUser",userId:selectedUser,username,email});}
  function sendNotification(e:FormEvent){e.preventDefault();void action({action:"notify",...(target==="all"?{}:{userId:target}),title,body});setBody("");}
  return <main className="admin-shell" dir="rtl">
    <aside className="admin-sidebar">
      <div className="admin-logo"><ShieldAlert size={22}/><b>MQH-Chat</b><span>ADMIN</span></div>
      <div className="admin-side-label">أدوات الإدارة</div>
      <a href="/admin" className="admin-nav"><ArrowRight size={18}/> العودة للوحة الرئيسية</a>
      <a href="/admin/security" className="admin-nav"><KeyRound size={18}/> إعدادات كلمة المرور</a>
      <div className="admin-side-bottom"><div className="admin-online"><span/> أدوات إدارية محمية</div><a href="/" className="admin-back">العودة للموقع ↗</a></div>
    </aside>
    <section className="admin-main">
      <header className="admin-header"><div><div className="admin-overline">إدارة متقدمة</div><h1>المستخدمون والإشعارات والمحادثات</h1><p>تعديل الحسابات، إرسال تنبيهات، وتصفح المحادثات للقراءة فقط.</p></div><button className="admin-refresh" onClick={()=>void load(selectedRoom)} disabled={busy}><RefreshCw size={16}/> تحديث</button></header>
      {error&&<div className="admin-error">{error}</div>}{notice&&<div className="admin-notice">{notice}</div>}
      {temporaryPassword&&<section className="admin-panel"><h2>كلمة المرور المؤقتة — تظهر مرة واحدة</h2><p>أرسلها للمستخدم عبر قناة آمنة واطلب منه تغييرها فورًا.</p><code dir="ltr">{temporaryPassword}</code><button className="admin-secondary" onClick={()=>navigator.clipboard.writeText(temporaryPassword)}>نسخ كلمة المرور</button></section>}
      <div className="admin-panels">
        <section className="admin-panel">
          <div className="admin-panel-head"><h2><Bell size={18}/> إرسال إشعار</h2></div>
          <form onSubmit={sendNotification}>
            <label>المستلم<select value={target} onChange={e=>setTarget(e.target.value)}><option value="all">جميع المستخدمين</option>{data.users.map(u=><option key={u.id} value={u.id}>{u.username} — {u.email}</option>)}</select></label>
            <label>عنوان الإشعار<input required minLength={2} maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label>
            <label>نص الإشعار<textarea required minLength={2} maxLength={1500} rows={4} value={body} onChange={e=>setBody(e.target.value)} placeholder="اكتب التنبيه أو تعليمات التواصل مع الإدارة..."/></label>
            <button className="admin-primary" disabled={busy}>إرسال الإشعار</button>
          </form>
        </section>
        <section className="admin-panel">
          <div className="admin-panel-head"><h2><Users size={18}/> تعديل حساب المستخدم</h2></div>
          <label>اختر المستخدم<select value={selectedUser} onChange={e=>setSelectedUser(e.target.value)}><option value="">اختر حسابًا</option>{data.users.map(u=><option key={u.id} value={u.id}>{u.username} — {u.email}{u.isSuspended?" (مقيّد)":""}</option>)}</select></label>
          {currentUser&&<form onSubmit={saveUser}>
            <label>اسم المستخدم<input required minLength={3} maxLength={24} value={username} onChange={e=>setUsername(e.target.value)}/></label>
            <label>البريد الإلكتروني<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
            <button className="admin-primary" disabled={busy}>حفظ البيانات</button>
            <div className="admin-reset-actions">
              <button type="button" className="admin-secondary" disabled={busy} onClick={()=>void action({action:"suspend",userId:currentUser.id,suspended:!currentUser.isSuspended,reason:reason||"تم تقييد الحساب من الإدارة."})}>{currentUser.isSuspended?"إعادة تفعيل الحساب":"تقييد الحساب"}</button>
              <button type="button" className="admin-secondary" disabled={busy} onClick={()=>{if(confirm("سيتم تغيير كلمة مرور المستخدم وإنشاء كلمة مؤقتة جديدة. متابعة؟"))void action({action:"resetPassword",userId:currentUser.id});}}>إعادة تعيين كلمة المرور</button>
            </div>
            <label>سبب التقييد / رسالة للمستخدم<textarea rows={2} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="اكتب السبب الذي سيظهر للمستخدم"/></label>
            <p>الحالة: <b>{currentUser.isSuspended?"مقيّد":"نشط"}</b> · الغرف: {currentUser.rooms} · الرسائل: {currentUser.messages}</p>
          </form>}
        </section>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-head"><h2><Eye size={18}/> مشاهدة المحادثات (للقراءة فقط)</h2><span>لا يمكن إرسال رسائل باسم المستخدمين</span></div>
        <label>اختر غرفة الدردشة<select value={selectedRoom} onChange={async e=>{setSelectedRoom(e.target.value);await load(e.target.value);}}><option value="">اختر غرفة</option>{data.rooms.map(r=><option key={r.id} value={r.id}>{r.name} · {r.messages} رسالة</option>)}</select></label>
        {!selectedRoom?<p className="admin-empty">لا توجد غرفة محددة.</p>:data.messages.length===0?<p className="admin-empty">لا توجد رسائل في هذه الغرفة.</p>:<div className="admin-reset-list">{data.messages.map(m=><article className="admin-reset-card" key={m.id}><div className="admin-reset-title"><div><b>{m.user.username} · {m.user.email}</b><small>{new Date(m.createdAt).toLocaleString("ar")}</small></div><span className="admin-status">رسالة</span></div><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{m.body}</p></article>)}</div>}
      </section>
      <section className="admin-panel"><div className="admin-panel-head"><h2>قائمة الحسابات</h2><span>{data.users.length} حساب ظاهر</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>المستخدم</th><th>البريد</th><th>الحالة</th><th>الغرف</th><th>الرسائل</th><th>تاريخ التسجيل</th></tr></thead><tbody>{data.users.map(u=><tr key={u.id}><td>{u.username}</td><td>{u.email}</td><td>{u.isSuspended?"مقيّد":"نشط"}</td><td>{u.rooms}</td><td>{u.messages}</td><td>{new Date(u.createdAt).toLocaleDateString("ar")}</td></tr>)}</tbody></table></div></section>
      <footer className="admin-footer"><ShieldAlert size={16}/> احترم خصوصية المستخدمين؛ استخدم الاطلاع على الرسائل وفق سياسة الموقع وموافقات المستخدمين.</footer>
    </section>
  </main>;
}
