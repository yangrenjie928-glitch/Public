import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarPicker from "./AvatarPicker";
import { mockRegisterEmail } from "../../services/mockAuth";

const INPUT =
  "w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-800 shadow-inner outline-none transition focus:border-brand-blue focus:shadow-[0_0_0_4px_rgba(59,130,246,.25)]";

export default function RegisterEmailForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState("🐉");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 460);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await mockRegisterEmail({
        username,
        email,
        password,
        confirmPassword,
        avatar,
        rememberMe: remember,
      });
      setNotice("🎉 Welcome pack открыт!");
      setTimeout(() => navigate("/profile"), 500);
    } catch (err) {
      setError(err.message || "Ошибка регистрации");
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${shake ? "animate-auth-shake" : ""}`}>
      <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-600">Имя в игре</span>
        <input className={INPUT} value={username} onChange={(ev) => setUsername(ev.target.value)} placeholder="Дракончик_ХSK1" required minLength={2} maxLength={32} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-600">✉️ Email</span>
        <input className={INPUT} type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} required />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-600">🔒 Пароль</span>
        <input className={INPUT} type="password" value={password} onChange={(ev) => setPassword(ev.target.value)} minLength={4} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-600">🔒 Повтор пароля</span>
        <input className={INPUT} type="password" value={confirmPassword} onChange={(ev) => setConfirmPassword(ev.target.value)} minLength={4} />
      </label>

      <AvatarPicker value={avatar} onChange={setAvatar} />

      <label className="flex items-center gap-3 rounded-2xl border-2 border-amber-200/70 bg-brand-yellow/10 px-4 py-3 font-bold text-slate-700">
        <input type="checkbox" checked={remember} onChange={(ev) => setRemember(ev.target.checked)} className="h-5 w-5 shrink-0 rounded accent-brand-blue" />
        Авто-вход после регистрации
      </label>

      {error ? <p className="rounded-2xl bg-rose-100 px-4 py-3 text-center text-sm font-black text-rose-700">{error}</p> : null}
      {notice ? (
        <p className="animate-pop rounded-2xl bg-emerald-100 px-4 py-3 text-center text-sm font-black text-emerald-800">{notice}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-3xl bg-gradient-to-r from-brand-blue via-purple-600 to-brand-red py-5 text-lg font-black text-white shadow-2xl transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? "⚡ Ждём тебя в игре..." : "⚡ Создать аккаунт"}
      </button>
    </form>
  );
}
