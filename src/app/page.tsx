"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, Plus, Sun, Moon, PanelRightClose, PanelRightOpen, Send, Users, ShieldCheck, Sparkles, LogOut, Copy, Check, KeyRound, ArrowUpLeft, LockKeyhole, Menu, X, Hash, Settings2, Bell } from "lucide-react";

type User = { id: string; username: string; email: string };
type Room = { id: string; name: string; inviteCode: string; members: number; lastMessage: { body: string; username: string; createdAt: string } | null };
type Message = { id: string; body: string; createdAt: string; user: { id: string; username: string } };
type NotificationItem = { id:string; title:string; body:string; readAt:string|null; createdAt:string };

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [sidebar, setSidebar] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authError, setAuthError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<"create" | "join" | null>(null);
  const [roomName, setRoomName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => { const saved = window.localStorage.getItem("mqh-theme"); if (saved === "light" || saved === "dark") setTheme(saved); void loadUser(); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; window.localStorage.setItem("mqh-theme", theme); }, [theme]);
  useEffect(() => { if (user) { void loadRooms(); void loadNotifications(); } else setNotifications([]); }, [user]);
  useEffect(() => { if (!user) return; const timer = window.setInterval(() => { void loadNotifications(); }, 15000); return () => window.clearInterval(timer); }, [user?.id]);
  useEffect(() => { if (activeRoom && user) void loadMessages(activeRoom.id); }, [activeRoom, user]);
  // Refresh messages while a room is open so participants see each other's messages
  // without having to reload the page. The API checks room membership on every request.
  useEffect(() => {
    if (!activeRoom || !user) return;
    const roomId = activeRoom.id;
    const timer = window.setInterval(() => { void loadMessages(roomId); }, 2500);
    return () => window.clearInterval(timer);
  }, [activeRoom?.id, user?.id]);
  // Keep room previews and member counts up to date in other open tabs.
  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => { void loadRooms(); }, 10000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  async function loadUser() {
    try { const r = await fetch("/api/auth/me"); const d = await r.json(); if (d.user) setUser(d.user); } catch {}
  }
  async function loadNotifications() {
    try { const r = await fetch("/api/notifications", { cache: "no-store" }); const d = await r.json(); if (r.ok) setNotifications(d.notifications || []); else if (d.suspended) setNotice(d.error + (d.reason ? " السبب: " + d.reason : "")); } catch {}
  }
  async function markNotificationRead(item: NotificationItem) {
    if (!item.readAt) { try { await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) }); setNotifications(old => old.map(n => n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)); } catch {} }
  }
  async function loadRooms() {
    try { const r = await fetch("/api/rooms"); const d = await r.json(); if (r.ok) { setRooms(d.rooms); setActiveRoom(old => old ? (d.rooms.find((x: Room) => x.id === old.id) || old) : (d.rooms[0] || null)); } } catch {}
  }
  async function loadMessages(roomId: string) {
    try { const r = await fetch(`/api/rooms/${roomId}/messages`, { cache: "no-store" }); const d = await r.json(); if (r.ok) setMessages(d.messages); } catch {}
  }
  async function submitAuth(e: FormEvent) {
    e.preventDefault(); setBusy(true); setAuthError("");
    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(authMode === "login" ? { email, password } : { username, email, password }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "تعذر إتمام العملية");
      setUser(d.user); setPassword(""); setNotice(authMode === "register" ? "أهلًا فيك! تم إنشاء حسابك." : "أهلًا بعودتك!"); 
    } catch (e) { setAuthError(e instanceof Error ? e.message : "حدث خطأ غير متوقع."); } finally { setBusy(false); }
  }
  async function createRoom(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try { const r = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: roomName }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setModal(null); setRoomName(""); setNotice("تم إنشاء مساحة الدردشة."); await loadRooms(); setActiveRoom({ ...d.room, members: 1, lastMessage: null }); }
    catch(e) { setNotice(e instanceof Error ? e.message : "تعذر إنشاء الغرفة."); } finally { setBusy(false); }
  }
  async function joinRoom(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try { const r = await fetch("/api/rooms/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: inviteCode }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setModal(null); setInviteCode(""); setNotice("انضممت للمحادثة بنجاح."); await loadRooms(); }
    catch(e) { setNotice(e instanceof Error ? e.message : "تعذر الانضمام."); } finally { setBusy(false); }
  }
  async function sendMessage(e: FormEvent) {
    e.preventDefault(); if (!message.trim() || !activeRoom) return;
    const body = message.trim(); setMessage("");
    try { const r = await fetch(`/api/rooms/${activeRoom.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setMessages(old => [...old, d.message]); }
    catch(e) { setMessage(body); setNotice(e instanceof Error ? e.message : "تعذر إرسال الرسالة."); }
  }
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); setRooms([]); setActiveRoom(null); setMessages([]); setNotice(""); }
  async function copyInvite() { if (!activeRoom) return; try { await navigator.clipboard.writeText(activeRoom.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setNotice("كود الدعوة: " + activeRoom.inviteCode); } }
  const filteredRooms = useMemo(() => rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase())), [rooms, search]);

  if (!user) return <main className="auth-shell">
    <div className="auth-decoration"><div className="orb orb-one"/><div className="orb orb-two"/><div className="auth-brand"><div className="brand-mark"><MessageCircle size={25}/></div><span>MQH<span className="brand-dash">-</span>Chat</span></div><div className="auth-promo"><div className="eyebrow"><Sparkles size={14}/> مساحة تجمعكم</div><h1>الحكي أحلى<br/>لما يكون <span>بقربك.</span></h1><p>مساحتك الخاصة للمحادثات، بدون تعقيد. أنشئ غرفة، شارك الدعوة، وابدأ الحكي.</p><div className="promo-points"><div><ShieldCheck size={18}/><span>خصوصية من البداية</span></div><div><KeyRound size={18}/><span>دعوات وأكواد انضمام</span></div><div><Users size={18}/><span>مساحاتك في مكان واحد</span></div></div></div><div className="auth-footer">دردشتك، مساحتك، اختيارك.</div></div>
    <section className="auth-panel"><button className="theme-switch auth-theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="تغيير المظهر">{theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</button><div className="auth-card"><div className="mobile-brand"><div className="brand-mark"><MessageCircle size={22}/></div><strong>MQH-Chat</strong></div><div className="auth-kicker">أهلًا في مساحتك</div><h2>{authMode === "login" ? "نورت من جديد" : "خلّينا نتعرّف عليك"}</h2><p className="auth-subtitle">{authMode === "login" ? "سجّل دخولك وكمل محادثاتك." : "أنشئ حسابك وابدأ أول محادثة."}</p>
    <form onSubmit={submitAuth} className="auth-form">{authMode === "register" && <label>اسم المستخدم<div className="input-wrap"><Users size={17}/><input required minLength={3} maxLength={24} value={username} onChange={e=>setUsername(e.target.value)} placeholder="مثال: saleh_26" autoComplete="username"/></div></label>}<label>البريد الإلكتروني<div className="input-wrap"><span className="input-at">@</span><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" dir="ltr"/></div></label><label>كلمة المرور<div className="input-wrap"><LockKeyhole size={17}/><input required minLength={authMode === "register" ? 8 : 1} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={authMode === "register" ? "8 أحرف على الأقل" : "أدخل كلمة المرور"} autoComplete={authMode === "login" ? "current-password" : "new-password"}/></div></label>{authError && <div className="form-error">{authError}</div>}<button className="primary-btn auth-submit" disabled={busy}>{busy ? "لحظة بس..." : authMode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}<ArrowUpLeft size={17}/></button></form>
    {authMode === "login" && <p className="switch-auth" style={{marginTop:12}}><a href="/forgot-password" style={{color:"var(--accent)",textDecoration:"none"}}>نسيت كلمة المرور؟ اطلب رمز من الإدارة</a></p>}
    <div className="auth-divider"><span/>أو<span/></div><p className="switch-auth">{authMode === "login" ? "لسّه ما عندك حساب؟" : "عندك حساب بالفعل؟"} <button onClick={() => {setAuthMode(authMode === "login" ? "register" : "login");setAuthError("");}}>{authMode === "login" ? "افتح حساب" : "سجّل دخولك"}</button></p><p className="auth-legal"><ShieldCheck size={14}/> بياناتك محمية بكلمة مرور مشفّرة وجلسة آمنة.</p></div></section>
  </main>;

  return <main className={`app-shell ${sidebar ? "" : "sidebar-collapsed"}`}>
    <aside className="sidebar"><div className="sidebar-top"><div className="brand-lockup"><div className="brand-mark"><MessageCircle size={21}/></div><span>MQH<span className="brand-dash">-</span>Chat</span></div><button className="icon-btn collapse-btn" onClick={()=>setSidebar(false)} aria-label="إخفاء القائمة"><PanelRightClose size={18}/></button></div>
      <button className="new-chat-btn" onClick={()=>setModal("create")}><Plus size={18}/><span>محادثة جديدة</span><span className="shortcut">+</span></button>
      <div className="sidebar-label">المحادثات <span>{rooms.length.toString().padStart(2,"0")}</span></div><div className="search-box"><Search size={16}/><input placeholder="ابحث عن محادثة..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="room-list">{filteredRooms.map(room=><button key={room.id} className={`room-item ${activeRoom?.id===room.id?"active":""}`} onClick={()=>setActiveRoom(room)}><div className="room-avatar"><Hash size={17}/></div><div className="room-meta"><strong>{room.name}</strong><span>{room.lastMessage?.body || "ابدأ أول رسالة..."}</span></div><span className="room-count">{room.members}</span></button>)}{!filteredRooms.length && <div className="empty-rooms"><div className="empty-icon"><MessageCircle size={20}/></div><p>{rooms.length ? "ما لقينا محادثة بهالاسم" : "لسّه ما عندك محادثات"}</p><span>أنشئ غرفة أو انضم بكود دعوة.</span><button onClick={()=>setModal("join")}>انضم بكود</button></div>}</div>
      <div className="sidebar-bottom"><div className="security-note"><div className="security-icon"><ShieldCheck size={18}/></div><div><strong>مساحتك الخاصة</strong><span>الوصول للمحادثات للأعضاء فقط</span></div></div><div className="profile-row"><div className="profile-avatar">{user.username.slice(0,1).toUpperCase()}</div><div className="profile-info"><strong>{user.username}</strong><span>{user.email}</span></div><button className="icon-btn" onClick={logout} aria-label="تسجيل الخروج" title="تسجيل الخروج"><LogOut size={17}/></button></div></div>
    </aside>
    <section className="chat-area"><header className="topbar"><div className="topbar-left">{!sidebar && <button className="icon-btn" onClick={()=>setSidebar(true)} aria-label="إظهار القائمة"><PanelRightOpen size={19}/></button>}<div className="mobile-brand"><div className="brand-mark"><MessageCircle size={19}/></div><strong>MQH-Chat</strong></div><div className="breadcrumb"><span>المحادثات</span><span className="crumb-slash">/</span><strong>{activeRoom?.name || "الرئيسية"}</strong></div></div><div className="topbar-actions"><button className="icon-btn" onClick={()=>setShowNotifications(v=>!v)} aria-label="الإشعارات" title="الإشعارات" style={{position:"relative"}}><Bell size={18}/>{notifications.some(n=>!n.readAt)&&<span style={{position:"absolute",top:2,left:2,width:8,height:8,borderRadius:99,background:"#ef4444"}}/>}</button><button className="outline-btn join-top-btn" onClick={()=>setModal("join")}><KeyRound size={16}/> <span>انضم بكود</span></button><button className="theme-switch" onClick={()=>setTheme(theme==="dark"?"light":"dark")} aria-label="تغيير المظهر">{theme==="dark"?<Sun size={18}/>:<Moon size={18}/>}</button><div className="top-avatar">{user.username.slice(0,1).toUpperCase()}</div></div></header>
    {showNotifications && <section style={{margin:"12px 22px 0",padding:16,border:"1px solid var(--border)",borderRadius:16,background:"var(--panel)",maxHeight:320,overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><strong>إشعاراتك</strong><button className="icon-btn" onClick={()=>setShowNotifications(false)} aria-label="إغلاق الإشعارات"><X size={16}/></button></div>{notifications.length===0?<p style={{color:"var(--muted)"}}>ما عندك إشعارات حاليًا.</p>:notifications.map(n=><button key={n.id} onClick={()=>void markNotificationRead(n)} style={{display:"block",textAlign:"right",width:"100%",padding:12,marginBottom:8,borderRadius:12,border:"1px solid var(--border)",background:n.readAt?"transparent":"var(--panel-2)",color:"var(--text)",cursor:"pointer"}}><span style={{display:"flex",justifyContent:"space-between",gap:12}}><strong>{n.title}</strong>{!n.readAt&&<small style={{color:"var(--accent)"}}>جديد</small>}</span><p style={{whiteSpace:"pre-wrap",margin:"6px 0"}}>{n.body}</p><small style={{color:"var(--muted)"}}>{new Date(n.createdAt).toLocaleString("ar")}</small></button>)}</section>}
    {activeRoom ? <><div className="room-heading"><div className="room-heading-icon"><Hash size={23}/></div><div className="room-heading-text"><div className="room-title-line"><h1>{activeRoom.name}</h1><span className="live-dot"/> <span className="live-label">مساحتك الخاصة</span></div><p>محادثاتك الخاصة في مكان واحد. شارك رابط الدعوة للانضمام.</p></div><div className="room-heading-actions"><div className="members-pill"><Users size={16}/><span>{activeRoom.members} أعضاء</span></div><button className="outline-btn invite-btn" onClick={copyInvite}>{copied?<Check size={16}/>:<Copy size={16}/>}<span>{copied?"تم النسخ":"نسخ كود الدعوة"}</span></button></div></div>
    <div className="messages-wrap"><div className="date-divider"><span>بداية المحادثة</span></div>{messages.length===0 ? <div className="welcome-state"><div className="welcome-orb"><MessageCircle size={30}/><Sparkles size={15}/></div><div className="welcome-tag">أول خطوة للحكي</div><h2>أهلًا في <span>{activeRoom.name}</span></h2><p>ما في رسائل لسه. ابعت أول رسالة أو شارك كود الدعوة حتى ينضم أصحابك.</p><button className="invite-code-card" onClick={copyInvite}><div className="code-icon"><KeyRound size={19}/></div><div><span>كود الدعوة</span><strong>{activeRoom.inviteCode}</strong></div>{copied?<Check size={18}/>:<Copy size={17}/>}</button></div> : <div className="messages-list">{messages.map((m,i)=><div className={`message-row ${m.user.id===user.id?"mine":""}`} key={m.id}><div className="message-avatar">{m.user.username.slice(0,1).toUpperCase()}</div><div className="message-content"><div className="message-byline"><strong>{m.user.id===user.id?"أنت":m.user.username}</strong><time>{new Date(m.createdAt).toLocaleTimeString("ar",{hour:"2-digit",minute:"2-digit"})}</time></div><div className="message-bubble">{m.body}</div></div></div>)}</div>}</div>
    <div className="composer-area"><form className="composer" onSubmit={sendMessage}><button className="composer-extra" type="button" onClick={copyInvite} aria-label="نسخ كود الدعوة"><Plus size={20}/></button><input value={message} onChange={e=>setMessage(e.target.value)} placeholder={`اكتب رسالة في ${activeRoom.name}...`} aria-label="رسالتك"/><button className="send-btn" disabled={!message.trim()} aria-label="إرسال الرسالة"><Send size={18}/></button></form><div className="composer-foot"><span><LockKeyhole size={12}/> رسائلك تظهر لأعضاء المحادثة</span><span>Enter للإرسال <span className="keycap">↵</span></span></div></div></> : <div className="no-room"><div className="welcome-orb"><MessageCircle size={30}/></div><h2>مساحتك جاهزة للحكي</h2><p>أنشئ محادثة جديدة أو انضم إلى أصحابك باستخدام كود الدعوة.</p><div><button className="primary-btn" onClick={()=>setModal("create")}><Plus size={17}/> إنشاء محادثة</button><button className="outline-btn" onClick={()=>setModal("join")}><KeyRound size={17}/> انضم بكود</button></div><div className="feature-row"><div><ShieldCheck size={18}/><span>خصوصية للأعضاء</span></div><div><KeyRound size={18}/><span>دعوات سهلة</span></div><div><Sparkles size={18}/><span>واجهة بسيطة</span></div></div></div>}
    <footer className="app-footer"><span>MQH-Chat <span className="footer-dot">·</span> الحكي أقرب</span><span><span className="footer-status"/> كل شي تمام</span></footer></section>
    {notice && <div className="toast"><span>{notice}</span><button onClick={()=>setNotice("")} aria-label="إغلاق"><X size={15}/></button></div>}
    {modal && <div className="modal-backdrop" onClick={()=>setModal(null)}><section className="modal-card" onClick={e=>e.stopPropagation()}><button className="modal-close icon-btn" onClick={()=>setModal(null)} aria-label="إغلاق"><X size={18}/></button><div className="modal-icon">{modal==="create"?<MessageCircle size={22}/>:<KeyRound size={22}/>}</div><h2>{modal==="create"?"أنشئ مساحة جديدة":"انضم إلى مساحة"}</h2><p>{modal==="create"?"اختَر اسمًا واضحًا لمساحتك وابدأ جمع أصحابك.":"أدخل كود الدعوة الذي وصلك من صاحب المساحة."}</p><form onSubmit={modal==="create"?createRoom:joinRoom}><label>{modal==="create"?"اسم المحادثة":"كود الدعوة"}<input autoFocus required value={modal==="create"?roomName:inviteCode} onChange={e=>modal==="create"?setRoomName(e.target.value):setInviteCode(e.target.value)} placeholder={modal==="create"?"مثال: قعدة الشباب":"مثال: A8F2D91C"} maxLength={modal==="create"?60:100}/></label><button className="primary-btn modal-submit" disabled={busy}>{busy?"لحظة بس...":modal==="create"?"إنشاء المحادثة":"انضم للمحادثة"}<ArrowUpLeft size={17}/></button></form></section></div>}
  </main>;
}