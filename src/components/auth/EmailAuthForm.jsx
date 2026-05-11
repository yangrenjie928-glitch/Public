import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mockEmailLogin } from "../../services/mockAuth";

const INPUT =
  "w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-800 shadow-inner outline-none transition focus:border-brand-blue focus:shadow-[0_0_0_4px_rgba(59,130,246,.25)]";

export default function EmailAuthForm({ onForgotPassword, successNavigateTo = "/profile" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 460);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await mockEmailLogin({ email: email.trim(), password, rememberMe: remember });
      setSuccess("✅ Успешный вход");
      setTimeout(() => navigate(successNavigateTo), 450);
    } catch (err) {
      setError(err.message || "❌ Неверный пароль");
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${shake ? "animate-auth-shake" : ""}`}>
      <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-600">✉️ Email</span>
        <input className={INPUT} type="email" autoComplete="email" value={email} onChange={(ev) => setEmail(ev.target.value)} placeholder="you@china-cloud.ru" required />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-black text-slate-600">🔒 Пароль</span>
        <input className={INPUT} type="password" autoComplete="current-password" value={password} onChange={(ev) => setPassword(ev.target.value)} placeholder="••••••••" required minLength={4} />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-slate-600">
          <input type="checkbox" checked={remember} onChange={(ev) => setRemember(ev.target.checked)} className="h-5 w-5 rounded accent-brand-yellow" />
          Запомнить меня
        </label>
        <button
          type="button"
          className="text-sm font-black text-brand-blue underline decoration-wavy underline-offset-4 hover:text-brand-red"
          onClick={() => onForgotPassword?.(email)}
        >
          Забыли пароль?
        </button>
      </div>

      {error ? <p className="rounded-2xl bg-rose-100 px-4 py-3 text-center text-sm font-black text-rose-700">{error}</p> : null}
      {success ? (
        <p className="animate-pop rounded-2xl bg-emerald-100 px-4 py-3 text-center text-sm font-black text-emerald-800">{success}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-3xl bg-gradient-to-r from-brand-blue via-purple-600 to-brand-red py-5 text-lg font-black text-white shadow-2xl transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? "👾 Грузим аккаунт..." : "🚀 Войти"}
      </button>

      <Link
        to="/register"
        className="flex w-full items-center justify-center rounded-3xl border-4 border-dashed border-brand-yellow/80 bg-white py-4 text-base font-black text-slate-800 shadow-md transition hover:scale-[1.02] hover:bg-brand-yellow/10"
      >
        ✨ Создать аккаунт
      </Link>
    </form>
  );
}
