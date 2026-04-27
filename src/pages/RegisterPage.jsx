import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

function RegisterPage() {
  const navigate = useNavigate();
  const { isSupabaseEnabled, setProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password
      });
      if (signUpError) throw signUpError;

      const userId = data.user?.id;
      if (!userId) {
        throw new Error("Регистрация выполнена, но идентификатор пользователя отсутствует.");
      }

      const { data: insertedProfile, error: insertError } = await supabase
        .from("users")
        .upsert(
          {
            id: userId,
            username: username.trim(),
            email: normalizedEmail
          },
          { onConflict: "id" }
        )
        .select("id, username, email, level, exp, role, status, created_at")
        .single();

      if (insertError) throw insertError;
      setProfile(insertedProfile);
      setNotice("Регистрация успешна. Добро пожаловать!");
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Не удалось зарегистрироваться");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black text-slate-900">Создать аккаунт</h1>
        {!isSupabaseEnabled ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
            Supabase не настроен. Добавь переменные окружения, чтобы включить регистрацию.
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-600">Имя пользователя</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-fuchsia-500"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={2}
              maxLength={30}
              placeholder="ivan_ivanov"
            />
          </label>

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
              placeholder="Минимум 6 символов"
            />
          </label>

          {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}
          {notice ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{notice}</p> : null}

          <button
            type="submit"
            disabled={submitting || !isSupabaseEnabled}
            className="w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-red px-4 py-3 font-black text-white disabled:opacity-60"
          >
            {submitting ? "Создаем..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Уже есть аккаунт?{" "}
          <Link className="font-black text-brand-blue hover:underline" to="/login">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
