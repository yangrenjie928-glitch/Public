import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import campaignCover from "../assets/events/anime-spring.svg";

const features = [
  { icon: "🎮", text: "Игровое обучение" },
  { icon: "⚡", text: "Быстрый результат" },
  { icon: "📱", text: "Учись везде" },
  { icon: "👥", text: "Мини-группы" },
];

const campaign = {
  title: "Месяц китайского языка 🇨🇳",
  subtitle: "Напиши свой первый китайский и выиграй приз 🎁",
  badge: "🔥 Популярно",
  urgency: "⏳ Только в этом месяце",
};

function HomePage() {
  const navigate = useNavigate();
  const [played, setPlayed] = useState(false);

  return (
    <div className="space-y-10">
      <Card className="relative overflow-hidden bg-gradient-to-r from-brand-blue to-brand-red text-white">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20" />
        <div className="absolute bottom-4 right-20 h-12 w-12 animate-float rounded-full bg-brand-yellow/50" />
        <div className="relative max-w-3xl space-y-4">
          <span className="xp-chip">+25 XP за вход сегодня</span>
          <h1 className="text-3xl font-black sm:text-5xl">Заведите себе интерес, например, посетить Китай.</h1>
          <p className="text-white/90">1 короткий урок = очки, стрик и новые награды. Начни прямо сейчас.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="warning" type="button" onClick={() => navigate("/learning/trial")}>
              Забрать бесплатный урок
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate("/test")}>
              Проверить свой уровень
            </Button>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="mb-4 fun-title">Новый вирусный челлендж</h2>
        <Card className="overflow-hidden p-0">
          <div className="grid gap-0 md:grid-cols-2">
            <img src={campaignCover} alt={campaign.title} className="h-64 w-full object-cover md:h-full" />
            <div className="space-y-4 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 p-6 text-white">
              <span className="inline-flex rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-amber-900">
                {campaign.badge}
              </span>
              <h3 className="text-2xl font-black sm:text-4xl">{campaign.title}</h3>
              <p className="max-w-2xl text-white/95">{campaign.subtitle}</p>
              <p className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold">{campaign.urgency}</p>
              <div className="space-y-1 text-sm font-semibold text-white/95">
                <p>✍️ Напиши китайский иероглиф</p>
                <p>🧠 Объясни значение</p>
                <p>📱 Опубликуй с тегом #КитайскоеОблако</p>
              </div>
              <Button variant="ghost" className="mt-2" type="button" onClick={() => navigate("/campaign/chinese-month")}>
                🚀 Участвовать
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((item) => (
          <Card
            key={item.text}
            className={`text-center ${
              item.text === "Игровое обучение"
                ? "cursor-pointer ring-2 ring-fuchsia-400/70"
                : item.text === "Быстрый результат"
                  ? "cursor-pointer ring-2 ring-amber-400/80"
                  : item.text === "Мини-группы"
                    ? "cursor-pointer ring-2 ring-sky-400/80"
                    : ""
            }`}
          >
            {item.text === "Игровое обучение" ? (
              <button
                type="button"
                className="w-full rounded-2xl p-1 transition hover:scale-[1.03] active:scale-[0.97]"
                onClick={() => navigate("/ai-practice")}
              >
                <p className="mb-2 text-3xl">{item.icon}</p>
                <p className="font-bold">{item.text}</p>
                <p className="mt-1 text-xs font-black text-fuchsia-600">AI-чат практика →</p>
              </button>
            ) : item.text === "Быстрый результат" ? (
              <button
                type="button"
                className="w-full rounded-2xl p-1 transition hover:scale-[1.03] active:scale-[0.97]"
                onClick={() => navigate("/test")}
              >
                <p className="mb-2 text-3xl">{item.icon}</p>
                <p className="font-bold">{item.text}</p>
                <p className="mt-1 text-xs font-black text-amber-700">Тест уровня →</p>
              </button>
            ) : item.text === "Мини-группы" ? (
              <button
                type="button"
                className="w-full rounded-2xl p-1 transition hover:scale-[1.03] active:scale-[0.97]"
                onClick={() => navigate("/funnel/group-success")}
              >
                <p className="mb-2 text-3xl">{item.icon}</p>
                <p className="font-bold">{item.text}</p>
                <p className="mt-1 text-xs font-black text-sky-800">Группа → пробный урок →</p>
              </button>
            ) : (
              <>
                <p className="mb-2 text-3xl">{item.icon}</p>
                <p className="font-bold">{item.text}</p>
              </>
            )}
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        <Card className="space-y-4">
          <h3 className="text-xl font-extrabold">Слово дня 🎯</h3>
          <div className="calligraphy-grid">
            <span className="calligraphy-grid__diagonal calligraphy-grid__diagonal--left" />
            <span className="calligraphy-grid__diagonal calligraphy-grid__diagonal--right" />
            <p className="text-8xl font-black text-black">马</p>
          </div>
          <p className="text-lg font-semibold text-slate-600">mǎ</p>
          <p className="text-slate-700">Значение: лошадь</p>
          <Button
            variant="secondary"
            className="w-fit bounce-soft"
            onClick={() => {
              setPlayed(true);
              setTimeout(() => setPlayed(false), 900);
            }}
          >
            ▶ Слушать
          </Button>
          {played ? <p className="animate-pop text-sm font-extrabold text-green-600">Круто! +5 XP за повторение 🔥</p> : null}
        </Card>

        <Card className="bg-gradient-to-r from-brand-yellow/25 to-brand-red/15">
          <h3 className="text-xl font-extrabold">Тренд месяца 📱</h3>
          <Link
            to="/campaign/chinese-month"
            className="mt-4 block rounded-2xl bg-white p-4 font-semibold transition hover:scale-[1.01]"
          >
            Месяц китайского языка 🇨🇳 - Напиши свой первый китайский и выиграй приз 🎁
          </Link>
        </Card>
      </section>
    </div>
  );
}

export default HomePage;
