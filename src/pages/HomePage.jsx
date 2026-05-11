import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import campaignCover from "../assets/events/anime-spring.svg";
import { useAuth } from "../context/AuthContext";
import { joinRandomMotivationGroup } from "../services/groupMembership";

const features = [
  { icon: "🎮", text: "Игровое обучение" },
  { icon: "⚡", text: "Быстрый результат" },
  { icon: "⚔️", text: "PK-баттл" },
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
  const { user, profile } = useAuth();
  const viewerId = user?.id ?? profile?.id ?? null;
  const [miniJoining, setMiniJoining] = useState(false);
  const [miniGroupError, setMiniGroupError] = useState("");
  const [played, setPlayed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleListenWord = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance === "undefined") {
      setPlayed(true);
      setTimeout(() => setPlayed(false), 900);
      return;
    }

    const synth = window.speechSynthesis;
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new window.SpeechSynthesisUtterance("马");
    utterance.lang = "zh-CN";
    utterance.rate = 0.6;
    utterance.pitch = 1;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setPlayed(true);
      setTimeout(() => setPlayed(false), 900);
    };
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    synth.cancel();
    synth.speak(utterance);
  };

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
              <Button
                variant="ghost"
                className="mt-2"
                type="button"
                onClick={() => {
                  if (!viewerId) {
                    navigate("/login");
                    return;
                  }
                  navigate("/campaign/chinese-month");
                }}
              >
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
                  : item.text === "PK-баттл"
                    ? "cursor-pointer ring-2 ring-emerald-400/80"
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
            ) : item.text === "PK-баттл" ? (
              <button
                type="button"
                className="w-full rounded-2xl p-1 transition hover:scale-[1.03] active:scale-[0.97]"
                onClick={() => navigate("/pk-arena")}
              >
                <p className="mb-2 text-3xl">{item.icon}</p>
                <p className="font-bold">{item.text}</p>
                <p className="mt-1 text-xs font-black text-emerald-700">Игра + ставки депозита между участниками →</p>
              </button>
            ) : item.text === "Мини-группы" ? (
              <button
                type="button"
                disabled={miniJoining}
                className="w-full rounded-2xl p-1 transition hover:scale-[1.03] active:scale-[0.97] disabled:cursor-wait disabled:opacity-65"
                onClick={async () => {
                  setMiniGroupError("");
                  if (!viewerId) {
                    navigate("/login");
                    return;
                  }
                  setMiniJoining(true);
                  const res = await joinRandomMotivationGroup(viewerId);
                  setMiniJoining(false);
                  if (!res.ok) {
                    if (res.error === "supabase_disabled") {
                      navigate("/funnel/group-success");
                      return;
                    }
                    setMiniGroupError(
                      res.error === "login_required" ? "Сначала войди в аккаунт." : "Не удалось подобрать группу. Попробуй ещё раз.",
                    );
                    return;
                  }
                  navigate("/learning/group-dashboard");
                }}
              >
                <p className="mb-2 text-3xl">{item.icon}</p>
                <p className="font-bold">{item.text}</p>
                <p className="mt-1 text-xs font-black text-sky-800">Случайный матч соучеников 🤝</p>
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
      {miniGroupError ? (
        <p className="-mt-2 rounded-xl bg-rose-50 px-3 py-2 text-center text-sm font-bold text-rose-700">{miniGroupError}</p>
      ) : null}

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
            onClick={handleListenWord}
          >
            {isSpeaking ? "⏹ Остановить" : "▶ Слушать"}
          </Button>
          {played ? <p className="animate-pop text-sm font-extrabold text-green-600">Круто! +5 XP за повторение 🔥</p> : null}
        </Card>

        <Card className="bg-gradient-to-r from-brand-yellow/25 to-brand-red/15">
          <h3 className="text-xl font-extrabold">Тренд месяца 📱</h3>
          <Link
            to="/campaign/chinese-month"
            className="mt-4 block rounded-2xl bg-white p-4 font-semibold transition hover:scale-[1.01]"
            onClick={(e) => {
              if (!viewerId) {
                e.preventDefault();
                navigate("/login");
              }
            }}
          >
            Месяц китайского языка 🇨🇳 - Напиши свой первый китайский и выиграй приз 🎁
          </Link>
        </Card>
      </section>

      <section aria-label="Раздел в разработке">
        <h2 className="mb-4 fun-title">Новые возможности</h2>
        <Card className="relative overflow-hidden border-2 border-dashed border-slate-300/90 bg-gradient-to-br from-slate-50 via-white to-brand-yellow/15 p-8 text-center shadow-inner">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-brand-blue/15" />
          <div className="pointer-events-none absolute -bottom-10 left-6 h-28 w-28 rounded-full bg-brand-red/10" />
          <p className="relative text-xs font-black uppercase tracking-[0.22em] text-slate-500">Функционал в работе</p>
          <p className="relative mt-4 text-balance text-3xl font-black tracking-tight text-slate-800 sm:text-4xl lg:text-5xl">
            Следите за обновлениями
          </p>
          <p className="relative mx-auto mt-3 max-w-lg text-base font-bold text-slate-600">
            Здесь скоро появится новый режим обучения и мотивации. Мы анонсируем его на главной и в разделе «Обучение» ☁️
          </p>
          <span className="relative mt-6 inline-flex rounded-full border border-slate-200 bg-white/90 px-5 py-2 text-xs font-black text-slate-500 shadow-sm">
            🛠 Скоро откроем доступ
          </span>
        </Card>
      </section>
    </div>
  );
}

export default HomePage;
