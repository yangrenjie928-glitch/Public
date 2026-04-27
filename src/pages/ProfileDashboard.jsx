import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import DailyCheckIn from "../components/DailyCheckIn";
import ProgressBar from "../components/ProgressBar";
import TaskCard from "../components/TaskCard";
import { leaderboard, tasks } from "../data/mockData";

const levels = [
  { id: 1, title: "Beginner 🌱", targetXp: 120 },
  { id: 2, title: "Starter 🚀", targetXp: 260 },
  { id: 3, title: "Learner 📚", targetXp: 500 },
  { id: 4, title: "Speaker 🗣", targetXp: 820 },
  { id: 5, title: "Master 🏆", targetXp: 1200 },
];

const xpWays = [
  { label: "Пройти урок", xp: 50 },
  { label: "Ответить на вопросы", xp: 30 },
  { label: "Ежедневный вход", xp: 20 },
  { label: "Участвовать в активности", xp: 100 },
];

const readSessionUser = () => {
  try {
    const raw = localStorage.getItem("authSession");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function ProfileDashboard() {
  const [currentUser, setCurrentUser] = useState(() => readSessionUser());

  const [rewardPopup, setRewardPopup] = useState("");
  const [avatar, setAvatar] = useState(currentUser?.avatar || "😎");
  const [xp, setXp] = useState(320);
  const [dailyXp, setDailyXp] = useState(120);
  const [streak] = useState(12);
  const [levelUpPopup, setLevelUpPopup] = useState("");
  const [welcomePopup, setWelcomePopup] = useState(false);
  const username = currentUser?.username || "Гость";

  useEffect(() => {
    if (sessionStorage.getItem("welcomeAfterAuth") === "1") {
      setWelcomePopup(true);
      sessionStorage.removeItem("welcomeAfterAuth");
      window.setTimeout(() => setWelcomePopup(false), 1800);
      setCurrentUser(readSessionUser());
    }
  }, []);

  useEffect(() => {
    if (currentUser?.avatar) setAvatar(currentUser.avatar);
  }, [currentUser]);

  const currentLevelIndex = useMemo(() => {
    for (let i = 0; i < levels.length; i += 1) {
      if (xp < levels[i].targetXp) return i;
    }
    return levels.length - 1;
  }, [xp]);

  const currentLevel = levels[Math.max(0, currentLevelIndex)];
  const previousTarget = currentLevelIndex === 0 ? 0 : levels[currentLevelIndex - 1].targetXp;
  const nextTarget = currentLevel.targetXp;
  const progressValue = Math.min(100, Math.round(((xp - previousTarget) / (nextTarget - previousTarget)) * 100));
  const nextRewardText = currentLevelIndex < levels.length - 1 ? "Новый аватар + бонусный урок 🎁" : "Максимальный ранг открыт";

  const claimReward = (points) => {
    const beforeXp = xp;
    const newXp = beforeXp + points;
    setXp(newXp);
    setDailyXp((prev) => prev + points);
    setRewardPopup(`+${points} XP ⚡`);
    setTimeout(() => setRewardPopup(""), 900);

    const beforeLevel = levels.findIndex((level) => beforeXp < level.targetXp);
    const afterLevel = levels.findIndex((level) => newXp < level.targetXp);
    if (afterLevel > beforeLevel && afterLevel >= 0) {
      setLevelUpPopup(`Ты достиг Lv.${afterLevel + 1}!`);
      setTimeout(() => setLevelUpPopup(""), 1800);
    }
  };

  return (
    <div className="space-y-6">
      {rewardPopup ? (
        <div className="fixed right-6 top-24 z-50 animate-pop rounded-2xl bg-green-500 px-5 py-3 font-bold text-white shadow-lg">
          {rewardPopup}
        </div>
      ) : null}
      {levelUpPopup ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="animate-pop rounded-3xl bg-white p-7 text-center shadow-2xl">
            <p className="text-4xl">🎉🎊🎉</p>
            <h2 className="mt-2 text-3xl font-black text-fuchsia-600">Level Up!</h2>
            <p className="mt-1 font-black text-slate-700">{levelUpPopup}</p>
            <p className="mt-2 text-sm font-bold text-slate-500">Ты прокачался как в игре 🎮</p>
          </div>
        </div>
      ) : null}
      {welcomePopup ? (
        <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 animate-pop rounded-2xl bg-emerald-500 px-5 py-3 text-center font-black text-white shadow-xl">
          🎉 Добро пожаловать!
        </div>
      ) : null}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="group grid h-20 w-20 place-items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 text-4xl shadow-lg">
              <span className="transition group-hover:scale-110">{avatar}</span>
            </div>
            <div>
              <p className="text-2xl font-black">{username}</p>
              <p className="font-bold text-slate-600">Lv.{currentLevel.id} {currentLevel.title}</p>
              <p className="text-sm font-semibold text-slate-500">Сегодня: +{dailyXp} XP 💰</p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
            <span>XP: {xp} / {nextTarget}</span>
            <span>До следующего уровня: {Math.max(nextTarget - xp, 0)} XP</span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 transition-all duration-500"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>

      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Серия</p>
          <p className="text-3xl font-black text-brand-red">{streak} дней 🔥</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Общий XP</p>
          <p className="text-3xl font-black text-brand-blue">{xp}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Следующая награда</p>
          <p className="text-lg font-black text-brand-yellow">{nextRewardText}</p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        <Card>
          <DailyCheckIn />
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-extrabold">Задачи дня (комбо-миссии)</h2>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClaim={claimReward} />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-xl font-extrabold">Как получить опыт 👇</h2>
          <div className="space-y-3">
            {xpWays.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3">
                <p className="font-bold">✔ {item.label}</p>
                <p className="font-black text-fuchsia-600">+{item.xp} XP</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-extrabold">Прогресс курса</h2>
          <ProgressBar value={68} />
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-extrabold">Лидерборд недели 🏆</h2>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((player, index) => (
              <div key={player.id} className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-2">
                <p className="font-semibold">
                  {index + 1}. {player.name}
                </p>
                <p className="font-bold">{player.points}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <h2 className="mb-3 text-xl font-extrabold">Твои бейджи 🏅</h2>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-black text-amber-700">🏆 Top 10 player</span>
          <span className="rounded-full bg-rose-100 px-4 py-2 text-sm font-black text-rose-700">🔥 7-day streak</span>
          <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">🎯 First lesson completed</span>
        </div>
      </Card>
    </div>
  );
}

export default ProfileDashboard;
