"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";

export default function AdminSecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور الجديدتان غير متطابقتين.");
      return;
    }
    if (newPassword.length < 10) {
      setError("استخدم كلمة مرور من 10 أحرف على الأقل.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تغيير كلمة المرور.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice(data.message || "تم تغيير كلمة المرور.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="admin-login-wrap" dir="rtl">
    <form className="admin-login-card" onSubmit={submit}>
      <div className="admin-logo"><KeyRound size={22}/><b>MQH-Chat</b><span>SECURITY</span></div>
      <div className="admin-lock"><ShieldCheck size={25}/></div>
      <h1>إعدادات أمان الإدارة</h1>
      <p>غيّر كلمة مرور المدير. يجب أن تكون 10 أحرف على الأقل.</p>
      <label>كلمة المرور الحالية<input type="password" autoComplete="current-password" required value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} /></label>
      <label>كلمة المرور الجديدة<input type="password" autoComplete="new-password" minLength={10} required value={newPassword} onChange={e=>setNewPassword(e.target.value)} /></label>
      <label>تأكيد كلمة المرور الجديدة<input type="password" autoComplete="new-password" minLength={10} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} /></label>
      {error && <div className="admin-error">{error}</div>}
      {notice && <div className="admin-notice">{notice}</div>}
      <button className="admin-primary" disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ كلمة المرور الجديدة"}</button>
      <Link href="/admin" className="admin-back"><ArrowRight size={15} style={{display:"inline",verticalAlign:"middle"}}/> العودة إلى لوحة الإدارة</Link>
    </form>
  </main>;
}
