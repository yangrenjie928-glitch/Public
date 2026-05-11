import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarPicker from "./AvatarPicker";
import { mockRegisterPhone, mockSendPhoneCode } from "../../services/mockAuth";

const INPUT =
  "w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-800 shadow-inner outline-none transition focus:border-brand-blue focus:shadow-[0_0_0_4px_rgba(59,130,246,.25)]";

export default function RegisterPhoneForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState("🐼");
  const [remember, setRemember] = useState(true);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 460);
  };

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = window.setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const digits = () => phone.replace(/\D/g, "");

  const handleSendCode = async () => {
    setError("");
    setNotice("");
    setSending(true);
    try {
      await mockSendPhoneCode(`+7${digits()}`);
      setCooldown(60);
      setNotice("✅ Код отправлен");
    } catch (err) {
      setError(err.message || "Не удалось отправить");
      triggerShake();
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await mockRegisterPhone({
        username,
        phone: `+7${digits()}`,
        code: code.trim(),
        password,
        confirmPassword,
        avatar,
        rememberMe: remember,
      });
      setNotice("🎉 Профиль создан!");
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
        <input className={INPUT} value={username} onChange={(ev) => setUsername(ev.target.value)} placeholder="Царь_ханзи" required minLength={2} maxLength={32} />
      </label>

      <div className="flex gap-2">
        <div className="flex shrink-0 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-3 font-black text-slate-700 shadow-sm">
          🇷🇺 <span className="text-brand-blue">+7</span>
        </div>
        <input className={INPUT} type="tel" inputMode="numeric" placeholder="XXX XXX XX XX" value={phone} onChange={(ev) => setPhone(ev.target.value)} />
      </div>

      <div className="flex gap-2">
        <input className={INPUT} type="text" inputMode="numeric" placeholder="Код из SMS" value={code} onChange={(ev) => setCode(ev.target.value)} />
        <button
          type="button"
          disabled={sending || cooldown > 0}
          onClick={handleSendCode}
          className="shrink-0 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-blue px-4 py-4 text-sm font-black text-white shadow-lg disabled:opacity-50"
        >
          {cooldown ? `${cooldown}s` : "📩 Код"}
        </button>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-600">🔒 Пароль</span>
        <input className={INPUT} type="password" value={password} onChange={(ev) => setPassword(ev.target.value)} minLength={4} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-600">🔒 Ещё раз пароль</span>
        <input className={INPUT} type="password" value={confirmPassword} onChange={(ev) => setConfirmPassword(ev.target.value)} minLength={4} />
      </label>

      <AvatarPicker value={avatar} onChange={setAvatar} />

      <p className="text-center text-xs font-semibold text-slate-400">Демо-код SMS: <strong className="text-brand-red">123456</strong></p>

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
        className="w-full rounded-3xl bg-gradient-to-r from-brand-red via-orange-400 to-brand-yellow py-5 text-lg font-black text-white shadow-2xl transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? "🏆 Регистрируем..." : "🏆 Стать студентом"}
      </button>
    </form>
  );
}
