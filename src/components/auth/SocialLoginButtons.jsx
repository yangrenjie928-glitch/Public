import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockSocialLogin } from "../../services/mockAuth";

export default function SocialLoginButtons({ rememberMe = true, successNavigateTo = "/profile" }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const run = async (provider) => {
    setError("");
    setBusy(provider);
    try {
      await mockSocialLogin({ provider, rememberMe });
      navigate(successNavigateTo);
    } catch (e) {
      setError(e.message || "Ошибка входа");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-center text-xs font-black uppercase tracking-wider text-slate-400">Или соцсети</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => run("vk")}
        className="flex w-full items-center justify-center gap-3 rounded-3xl bg-[#0077FF] py-4 text-lg font-black text-white shadow-xl transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
      >
        {busy === "vk" ? "⏳" : "🌊"} Войти через VK
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => run("telegram")}
        className="flex w-full items-center justify-center gap-3 rounded-3xl bg-[#229ED9] py-4 text-lg font-black text-white shadow-xl transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
      >
        {busy === "telegram" ? "⏳" : "✈️"} Telegram (демо)
      </button>
      {error ? <p className="rounded-2xl bg-rose-50 px-3 py-2 text-center text-xs font-black text-rose-700">{error}</p> : null}
    </div>
  );
}
