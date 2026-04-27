import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

function LoginPage() {
  const navigate = useNavigate();
  const { isSupabaseEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (signInError) throw signInError;
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Не удалось выполнить вход");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black text-slate-900">Вход</h1>
        <p className="mt-1 text-sm text-slate-500">Продолжай обучение с сохраненным прогрессом.</p>
        {!isSupabaseEnabled ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
            Supabase не настроен. Добавь переменные окружения, чтобы включить вход.
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-600">Электронная почта</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-600">Пароль</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="Твой пароль"
            />
          </label>

          {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting || !isSupabaseEnabled}
            className="w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-red px-4 py-3 font-black text-white disabled:opacity-60"
          >
            {submitting ? "Входим..." : "Войти"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Нет аккаунта?{" "}
          <Link className="font-black text-brand-blue hover:underline" to="/register">
            Создать аккаунт
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
