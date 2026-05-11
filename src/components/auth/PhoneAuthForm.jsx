import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockPhoneLogin, mockSendPhoneCode } from "../../services/mockAuth";

const INPUT =
  "w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-800 shadow-inner outline-none transition focus:border-brand-blue focus:shadow-[0_0_0_4px_rgba(59,130,246,.25)]";

export default function PhoneAuthForm({ onSuccess, successNavigateTo = "/profile" }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 460);
  };

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = window.setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  const formatPhoneDigits = () => phone.replace(/\D/g, "");

  const handleSendCode = async () => {
    setError("");
    setSuccess("");
    setSending(true);
    try {
      const digits = formatPhoneDigits();
      await mockSendPhoneCode(`+7${digits}`);
      setCooldown(60);
      setSuccess("✅ Код отправлен");
      onSuccess?.("code-sent");
    } catch (err) {
      setError(err.message || "Не удалось отправить код.");
      triggerShake();
    } finally {
      setSending(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const digits = formatPhoneDigits();
      await mockPhoneLogin({ phone: `+7${digits}`, code: code.trim(), rememberMe: remember });
      setSuccess("✅ Успешный вход");
      setTimeout(() => navigate(successNavigateTo), 450);
    } catch (err) {
      setError(err.message || "Не удалось войти");
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className={`space-y-4 ${shake ? "animate-auth-shake" : ""}`}>
      <div className="flex gap-2">
        <div className="flex shrink-0 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-3 font-black text-slate-700 shadow-sm">
          🇷🇺 <span className="text-brand-blue">+7</span>
        </div>
        <label className="flex-1">
          <span className="sr-only">Телефон</span>
          <input
            className={INPUT}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="+7 XXX XXX XX XX"
            value={phone}
            onChange={(ev) => setPhone(ev.target.value)}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-600">Код из SMS</span>
        <input className={INPUT} type="text" inputMode="numeric" placeholder="123456" value={code} onChange={(ev) => setCode(ev.target.value)} />
      </label>

      <p className="text-center text-xs font-semibold text-slate-400">Подсказка для демо: код <strong className="text-brand-red">123456</strong></p>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={sending || cooldown > 0}
          onClick={handleSendCode}
          className="flex-1 rounded-2xl border-4 border-transparent bg-gradient-to-r from-brand-blue to-brand-blue py-4 text-base font-black text-white shadow-xl transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "📩 Отправляем..." : cooldown > 0 ? `📩 Повтор через ${cooldown}с` : "📩 Получить код"}
        </button>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border-2 border-amber-200/70 bg-brand-yellow/10 px-4 py-3 font-bold text-slate-700">
        <input type="checkbox" checked={remember} onChange={(ev) => setRemember(ev.target.checked)} className="h-5 w-5 shrink-0 rounded accent-brand-blue" />
        Запомнить вход на этом устройстве 📱
      </label>

      {error ? <p className="rounded-2xl bg-rose-100 px-4 py-3 text-center text-sm font-black text-rose-700">{error}</p> : null}
      {success ? (
        <p className="animate-pop rounded-2xl bg-emerald-100 px-4 py-3 text-center text-sm font-black text-emerald-800">{success}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-3xl bg-gradient-to-r from-brand-red via-orange-400 to-brand-yellow py-5 text-lg font-black text-white shadow-2xl transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? "✨ Заходим..." : "🚀 Войти"}
      </button>
    </form>
  );
}
