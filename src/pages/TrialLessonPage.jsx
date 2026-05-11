import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import Button from "../components/Button";
import Card from "../components/Card";

const words = [
  { hanzi: "马", pinyin: "mǎ", ru: "лошадь" },
  { hanzi: "你", pinyin: "nǐ", ru: "ты" },
  { hanzi: "好", pinyin: "hǎo", ru: "хорошо" },
  { hanzi: "学", pinyin: "xué", ru: "учиться" },
];

const rewards = ["+10 слов 🎉", "+100 💰", "+20 XP ⚡", "+1 бонус 📘"];

function TrialLessonPage() {
  const navigate = useNavigate();
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [floatReward, setFloatReward] = useState(null);

  useEffect(() => {
    const popupShownKey = "trial-popup-shown-once";
    if (sessionStorage.getItem(popupShownKey) === "1") return;

    const timer = window.setTimeout(() => {
      setShowExitPopup(true);
      sessionStorage.setItem(popupShownKey, "1");
    }, 20000);

    return () => window.clearTimeout(timer);
  }, []);

  const triggerReward = () => {
    const picked = rewards[Math.floor(Math.random() * rewards.length)];
    setFloatReward(picked);
    window.setTimeout(() => setFloatReward(null), 1200);
  };

  const joinButtons = [
    { id: "tg", label: "💬 Telegram", href: "https://t.me", style: "from-sky-500 to-blue-500" },
    { id: "vk", label: "📱 VK", href: "https://vk.com", style: "from-blue-600 to-indigo-600" },
    { id: "wa", label: "💬 WhatsApp", href: "https://wa.me", style: "from-emerald-500 to-green-500" },
  ];

  const exitPopup =
    showExitPopup && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4">
            <div className="animate-pop w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
              <p className="text-3xl font-black text-rose-500">Подожди! 😱</p>
              <p className="mb-5 mt-3 font-bold text-slate-700">Забери бесплатный урок и бонус 🎁</p>
              <a
                href="#join-group"
                className="block rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-lg font-black text-white transition hover:scale-105 active:scale-[0.97]"
                onClick={() => {
                  setShowExitPopup(false);
                  triggerReward();
                }}
              >
                👉 Войти в группу
              </a>
              <button
                type="button"
                className="mt-3 text-sm font-bold text-slate-500 underline"
                onClick={() => setShowExitPopup(false)}
              >
                Не сейчас
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative space-y-8 pb-28">
      {floatReward ? (
        <div className="pointer-events-none fixed right-6 top-24 z-50 animate-pop rounded-2xl bg-pink-500 px-4 py-2 text-lg font-black text-white shadow-2xl">
          {floatReward}
        </div>
      ) : null}

      <section className="card relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 p-6 text-white sm:p-8">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/25" />
        <div className="absolute -bottom-7 left-10 h-20 w-20 rounded-full bg-yellow-200/35" />
        <div className="relative space-y-4">
          <p className="inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-black">🎮 Челлендж для новичков</p>
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">Выучите 10 китайских слов за 30 минут 🇨🇳</h1>
          <p className="max-w-2xl text-white/95">Даже если вы никогда не учили китайский. Это проще, чем ты думаешь 😄</p>
          <p className="text-lg font-black text-yellow-100">⏳ Осталось всего 23 места</p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#join-group"
              className="inline-block rounded-2xl bg-white px-7 py-3 text-lg font-black text-rose-600 shadow-lg transition hover:scale-105 active:scale-95"
              onClick={triggerReward}
            >
              🚀 Войти в группу и начать
            </a>
          </div>
          <p className="text-sm font-bold text-white/90">1000+ учеников уже начали</p>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 shadow">
        <p className="text-lg font-black text-amber-700">🔥 Набор закрывается сегодня</p>
        <p className="font-bold text-amber-700">⏳ Осталось ограниченное количество мест</p>
        <p className="font-bold text-amber-700">🎁 Бонус только для новых участников</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "⏱ 30 минут → результат",
          "📚 10 слов → сразу применимо",
          "🗣 Начнёте говорить",
          "🎯 Без сложной грамматики",
        ].map((item) => (
          <Card key={item} className="bg-white/95 text-center">
            <p className="text-lg font-black">{item}</p>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-black">Слова, которые вы скажете уже сегодня 👇</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {words.map((word) => (
            <Card key={word.hanzi} className="group bg-white">
              <div className="flex items-center justify-between">
                <p className="text-4xl font-black text-black">{word.hanzi}</p>
                <button
                  type="button"
                  className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black transition group-hover:scale-110"
                  onClick={triggerReward}
                >
                  🔊
                </button>
              </div>
              <p className="text-lg font-black text-pink-600">{word.pinyin}</p>
              <p className="text-slate-600">— {word.ru}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-black">Как это работает 🎯</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {["1️⃣ Нажми кнопку", "2️⃣ Вступи в группу", "3️⃣ Получи урок 🎉"].map((step) => (
            <Card key={step} className="text-center">
              <p className="text-xl font-black">{step}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-r from-rose-50 to-orange-50">
          <h2 className="mb-2 text-2xl font-black">Люди уже в теме 🚀</h2>
          <p className="font-bold">"Я не верил, но это реально работает! 😍"</p>
          <p className="font-bold">"Очень просто и интересно 🚀"</p>
        </Card>
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <h2 className="mb-2 text-2xl font-black">Цифры говорят сами</h2>
          <p className="text-lg font-black">👥 1200+ участников</p>
          <p className="text-lg font-black">⭐ 4.9 рейтинг</p>
        </Card>
      </section>

      <section id="join-group" className="card space-y-4 bg-gradient-to-r from-fuchsia-500 to-pink-500 p-6 text-white">
        <h2 className="text-3xl font-black">👇 Забери доступ прямо сейчас</h2>
        <p className="font-bold">В группе ты получишь урок, задания и поддержку. Ты сможешь! 💪</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {joinButtons.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className={`rounded-2xl bg-gradient-to-r ${item.style} px-5 py-4 text-center text-lg font-black shadow-lg transition hover:scale-105 active:scale-[0.97]`}
              onClick={triggerReward}
            >
              {item.label}
            </a>
          ))}
        </div>
        <p className="text-sm font-black text-yellow-100">⚡ Ссылка может быть закрыта в любой момент</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {["🎁 PDF со словами", "🎁 Мини-гайд", "🎁 Дополнительные задания"].map((bonus) => (
          <Card key={bonus} className="bg-yellow-50 text-center">
            <p className="text-lg font-black">{bonus}</p>
          </Card>
        ))}
      </section>

      <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
        <div className="container-main">
          <button
            type="button"
            className="bounce-soft w-full rounded-2xl bg-gradient-to-r from-orange-400 to-rose-500 px-6 py-4 text-xl font-black text-white shadow-2xl transition hover:scale-105 active:scale-[0.97]"
            onClick={() => {
              triggerReward();
              navigate("/funnel/group-success");
            }}
          >
            🚀 Начать бесплатно
          </button>
        </div>
      </div>

      {exitPopup}

      <div className="pt-4 text-center text-sm font-bold text-slate-500">
        <Link to="/learning" className="hover:underline">
          ← Вернуться в Каталог курсов
        </Link>
      </div>
    </div>
  );
}

export default TrialLessonPage;
