import { useState } from "react";
import AuthBrandHeader from "../components/auth/AuthBrandHeader";
import AuthLayout from "../components/auth/AuthLayout";
import EmailAuthForm from "../components/auth/EmailAuthForm";
import PhoneAuthForm from "../components/auth/PhoneAuthForm";
import SocialLoginButtons from "../components/auth/SocialLoginButtons";

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 rounded-full py-4 text-base font-black transition sm:text-lg ${active ? "bg-white text-brand-blue shadow-lg ring-4 ring-brand-yellow/60" : "text-white/85 hover:bg-white/10"}`}
    >
      {children}
    </button>
  );
}

export default function LoginPage() {
  const [tab, setTab] = useState("phone");
  const [banner, setBanner] = useState("");

  const handleForgot = (emailDraft) => {
    const trimmed = emailDraft?.trim?.() || "";
    setBanner(trimmed ? `В демо: письмо на «${trimmed}» было бы отправлено — скоро с реальной почтой 🐼` : "Сначала введи email ✉️");
  };

  return (
    <AuthLayout footerPrefix="Нет аккаунта?" footerLinkTo="/register" footerLinkLabel="Регистрация" footerHint="">
      <AuthBrandHeader mode="login" />

      {banner ? <p className="mb-4 rounded-2xl border-2 border-sky-200 bg-sky-50 px-4 py-3 text-center text-xs font-black text-sky-900">{banner}</p> : null}

      <div className="mb-8 rounded-full bg-white/70 p-1.5 shadow-inner ring-4 ring-brand-blue/20 backdrop-blur sm:p-2">
        <div className="flex gap-2 rounded-full bg-gradient-to-r from-brand-red via-orange-400 to-brand-blue p-1.5 sm:p-2">
          <TabButton active={tab === "phone"} onClick={() => { setTab("phone"); setBanner(""); }}>
            📱 Телефон
          </TabButton>
          <TabButton active={tab === "email"} onClick={() => { setTab("email"); setBanner(""); }}>
            ✉️ Email
          </TabButton>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_80px_-20px_rgba(59,130,246,.45)] ring-8 ring-brand-yellow/20 sm:p-10">
        <div className="mb-8 flex items-center justify-center gap-6 text-xl font-black text-slate-500">
          <span className="bounce-soft rounded-full bg-brand-yellow px-5 py-2 text-amber-950 shadow-md">⭐</span>
          <span className="text-sm font-semibold uppercase tracking-widest text-slate-400">Ты здесь главный игрок 💪</span>
          <span className="bounce-soft rounded-full bg-brand-red/90 px-4 py-2 text-white shadow-md" style={{ animationDelay: "0.4s" }}>
            ❤️
          </span>
        </div>

        {tab === "phone" ? <PhoneAuthForm /> : <EmailAuthForm onForgotPassword={handleForgot} />}
      </div>

      <div className="mx-auto mt-8 max-w-md rounded-[2rem] bg-white/90 p-6 shadow-xl ring-4 ring-brand-blue/10 backdrop-blur">
        <SocialLoginButtons rememberMe />
      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Авторизация в демо-режиме (без Supabase): пароль любой от 4 символов • SMS код 123456
      </p>
    </AuthLayout>
  );
}
