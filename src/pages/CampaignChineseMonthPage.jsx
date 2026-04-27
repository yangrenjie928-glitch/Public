import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";

const postTemplate = `Я学会了第一个中文词：爱 ❤️
它的意思是“爱”
#КитайскоеОблако`;

const ugcPosts = [
  { user: "@anna", word: "爱", meaning: "любовь", emoji: "❤️" },
  { user: "@misha", word: "家", meaning: "дом", emoji: "🏠" },
  { user: "@sveta", word: "友", meaning: "друг", emoji: "🤝" },
  { user: "@oleg", word: "梦", meaning: "мечта", emoji: "✨" },
];

function CampaignChineseMonthPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState("");
  const [rewardPop, setRewardPop] = useState("");

  const leaderboard = useMemo(
    () => [
      { name: "Кира", score: 980 },
      { name: "Макс", score: 940 },
      { name: "Алина", score: 910 },
      { name: "Тимур", score: 880 },
      { name: "Ева", score: 860 },
    ],
    [],
  );

  const pulseReward = () => {
    const rewards = ["+10 слов 🎉", "+30 XP ⚡", "Бонус открыт 🎁"];
    const pick = rewards[Math.floor(Math.random() * rewards.length)];
    setRewardPop(pick);
    window.setTimeout(() => setRewardPop(""), 1100);
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(postTemplate);
      setCopied(true);
      setShareSuccess("Шаблон скопирован ✅");
      pulseReward();
      window.setTimeout(() => {
        setCopied(false);
        setShareSuccess("");
      }, 1600);
    } catch {
      setShareSuccess("Не удалось скопировать 😢");
      window.setTimeout(() => setShareSuccess(""), 1600);
    }
  };

  const onShare = (platform) => {
    setShareSuccess(`Пост для ${platform} готов 🚀`);
    pulseReward();
    window.setTimeout(() => setShareSuccess(""), 1600);
  };

  return (
    <div className="relative space-y-8 pb-28">
      {rewardPop ? (
        <div className="pointer-events-none fixed right-6 top-24 z-50 animate-pop rounded-2xl bg-fuchsia-500 px-4 py-2 text-lg font-black text-white shadow-2xl">
          {rewardPop}
        </div>
      ) : null}

      <section className="card overflow-hidden bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 p-6 text-white sm:p-8">
        <p className="inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-black">🔥 Популярный тренд месяца</p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Напиши свой первый китайский и выиграй 🎁</h1>
        <p className="mt-2 text-white/95">Прими участие в челлендже и получи награду</p>
        <p className="mt-3 text-lg font-black text-yellow-100">⏳ Только в этом месяце</p>
        <Button
          className="mt-5"
          variant="ghost"
          type="button"
          onClick={() => {
            const section = document.getElementById("join-group");
            if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          🚀 Присоединиться сейчас
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xl font-black">✍️ Напиши китайский иероглиф или слово</p>
        </Card>
        <Card>
          <p className="text-xl font-black">🧠 Объясни его значение</p>
        </Card>
        <Card>
          <p className="text-xl font-black">📱 Опубликуй в соцсетях с нашим тегом</p>
        </Card>
      </section>

      <Card className="space-y-3 bg-rose-50">
        <h2 className="text-2xl font-black">Пример (очень просто) 👇</h2>
        <p className="text-4xl font-black text-slate-900">爱 (ài) — любовь ❤️</p>
        <p className="font-semibold text-slate-700">Это означает любовь</p>
      </Card>

      <section className="space-y-3">
        <h2 className="text-2xl font-black">Как участвовать (4 шага)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {["1️⃣ Вступи в группу", "2️⃣ Пройди пробный урок", "3️⃣ Опубликуй пост", "4️⃣ Получи приз 🎉"].map((step) => (
            <Card key={step}>
              <p className="text-lg font-black">{step}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-2 border-amber-300 bg-amber-50">
        <h2 className="text-2xl font-black">Условия участия</h2>
        <p className="mt-2 font-bold">👥 Вступить в группу</p>
        <p className="font-bold">🎓 Пройти пробный урок</p>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white">
        <h2 className="text-2xl font-black">🎁 Таинственный приз</h2>
        <p className="mt-2 font-bold">🎁 Секретный подарок</p>
        <p className="font-bold">💰 Возможные бонусы</p>
        <p className="font-bold">🎓 Бесплатные уроки</p>
        <p className="mt-3 text-yellow-100">Ты узнаешь после участия 😏</p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-2xl font-black">📱 Опубликуй и отметь нас</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            className="rounded-2xl bg-blue-600 px-4 py-3 text-lg font-black text-white transition hover:scale-105 active:scale-[0.97]"
            onClick={() => onShare("VK")}
          >
            VK
          </button>
          <button
            type="button"
            className="rounded-2xl bg-sky-500 px-4 py-3 text-lg font-black text-white transition hover:scale-105 active:scale-[0.97]"
            onClick={() => onShare("Telegram")}
          >
            Telegram
          </button>
          <button
            type="button"
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-lg font-black text-white transition hover:scale-105 active:scale-[0.97]"
            onClick={copyTemplate}
          >
            Copy hashtag
          </button>
        </div>
        <p className="font-bold text-fuchsia-600">#КитайскоеОблако</p>
        <pre className="overflow-x-auto rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-700">{postTemplate}</pre>
        <button
          type="button"
          className={`rounded-xl px-4 py-2 font-black transition hover:scale-105 active:scale-[0.97] ${
            copied ? "bg-emerald-500 text-white" : "bg-slate-800 text-white"
          }`}
          onClick={copyTemplate}
        >
          Copy post template
        </button>
        {shareSuccess ? <p className="animate-pop text-sm font-black text-emerald-600">{shareSuccess}</p> : null}
      </Card>

      <section className="card space-y-4 bg-gradient-to-r from-rose-500 to-orange-500 p-6 text-white" id="join-group">
        <h2 className="text-3xl font-black">👇 Вступай в группу, чтобы участвовать</h2>
        <p className="font-bold">В группе ты получишь инструкции и помощь</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="#"
            className="rounded-2xl bg-sky-500 px-5 py-4 text-center text-xl font-black transition hover:scale-105 active:scale-[0.97]"
            onClick={(event) => {
              event.preventDefault();
              pulseReward();
              navigate("/funnel/group-success");
            }}
          >
            💬 Telegram
          </a>
          <a
            href="#"
            className="rounded-2xl bg-blue-700 px-5 py-4 text-center text-xl font-black transition hover:scale-105 active:scale-[0.97]"
            onClick={(event) => {
              event.preventDefault();
              pulseReward();
              navigate("/funnel/group-success");
            }}
          >
            📱 VK
          </a>
        </div>
        <p className="font-black text-yellow-100">⚡ Без группы участие невозможно</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-black">🏆 Лучшие участники</h2>
        <div className="grid gap-3 md:grid-cols-5">
          {leaderboard.map((user, idx) => (
            <Card key={user.name} className="text-center">
              <p className="text-sm font-black text-slate-500">#{idx + 1}</p>
              <p className="text-lg font-black">{user.name}</p>
              <p className="font-bold text-fuchsia-600">{user.score} очков</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-black">UGC галерея участников 📸</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ugcPosts.map((post) => (
            <Card key={post.user + post.word} className="bg-white">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-pink-100 to-fuchsia-100 p-4">
                <p className="text-sm font-black text-slate-500">{post.user}</p>
                <p className="mt-2 text-5xl font-black">{post.word}</p>
                <p className="mt-1 font-bold text-fuchsia-600">{post.emoji}</p>
                <p className="mt-3 text-sm font-semibold text-slate-600">Значение: {post.meaning}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
        <div className="container-main">
          <button
            type="button"
            className="bounce-soft block w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-6 py-4 text-center text-xl font-black text-white shadow-2xl transition hover:scale-105 active:scale-[0.97]"
            onClick={() => {
              pulseReward();
              navigate("/funnel/group-success");
            }}
          >
            🚀 Хочу участвовать
          </button>
        </div>
      </div>

      <div className="pt-2 text-center text-sm font-bold text-slate-500">
        <Link to="/" className="hover:underline">
          ← Назад на главную
        </Link>
      </div>
    </div>
  );
}

export default CampaignChineseMonthPage;
