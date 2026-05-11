export default function AuthBrandHeader({ mode = "login" }) {
  return (
    <div className="mb-8 text-center">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red">🇨🇳 Китайский квест</p>
      <h1 className="mt-3 text-balance bg-gradient-to-r from-brand-blue via-purple-600 to-brand-red bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
        Китайское Облако ☁️
      </h1>
      <p className="mt-2 text-lg font-bold text-slate-600">{mode === "login" ? "Добро пожаловать! 🎉" : "Создай героя и начни игру 💫"}</p>
      <p className="mt-2 text-base font-semibold text-slate-500">Начни говорить по-китайски уже сегодня 🚀</p>
    </div>
  );
}
