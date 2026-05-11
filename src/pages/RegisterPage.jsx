import { useState } from "react";
import AuthBrandHeader from "../components/auth/AuthBrandHeader";
import AuthLayout from "../components/auth/AuthLayout";
import RegisterEmailForm from "../components/auth/RegisterEmailForm";
import RegisterPhoneForm from "../components/auth/RegisterPhoneForm";
import SocialLoginButtons from "../components/auth/SocialLoginButtons";

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 rounded-full py-4 text-base font-black transition sm:text-lg ${active ? "bg-white text-brand-red shadow-lg ring-4 ring-brand-yellow/60" : "text-white/85 hover:bg-white/10"}`}
    >
      {children}
    </button>
  );
}

export default function RegisterPage() {
  const [tab, setTab] = useState("phone");

  return (
    <AuthLayout footerPrefix="Уже есть аккаунт?" footerLinkTo="/login" footerLinkLabel="Войти" footerHint="">
      <AuthBrandHeader mode="register" />

      <div className="mb-8 rounded-full bg-white/70 p-1.5 shadow-inner ring-4 ring-brand-red/25 backdrop-blur sm:p-2">
        <div className="flex gap-2 rounded-full bg-gradient-to-r from-brand-blue via-brand-yellow to-brand-red p-1.5 sm:p-2">
          <TabButton active={tab === "phone"} onClick={() => setTab("phone")}>
            📱 По телефону
          </TabButton>
          <TabButton active={tab === "email"} onClick={() => setTab("email")}>
            ✉️ По почте
          </TabButton>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_80px_-20px_rgba(239,68,68,.42)] ring-8 ring-brand-yellow/30 sm:p-10">
        <p className="mb-6 text-center text-sm font-bold text-slate-500">Придумай никнейм • выбери адрес • забери свой набор эмодзи 🐼🐉</p>
        {tab === "phone" ? <RegisterPhoneForm /> : <RegisterEmailForm />}
      </div>

      <div className="mx-auto mt-8 max-w-md rounded-[2rem] bg-white/90 p-6 shadow-xl ring-4 ring-brand-yellow/40 backdrop-blur">
        <p className="mb-3 text-center text-xs font-black uppercase tracking-wider text-slate-400">Мгновенный вход после соцсети</p>
        <SocialLoginButtons rememberMe />
      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Это интерфейсные макеты: аккаунт хранится в браузере до выхода. Позже подключим живой бэкенд.
      </p>
    </AuthLayout>
  );
}
