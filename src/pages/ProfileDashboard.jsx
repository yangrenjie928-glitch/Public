import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import DailyCheckIn from "../components/DailyCheckIn";
import ProgressBar from "../components/ProgressBar";
import TaskCard from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";
import { authLogout } from "../services/authLogout";
import { PAYMENTS_ENABLED } from "../config/payments";
import { isGroupJoined } from "../services/groupMembership";
import { getAvatarForLevel, getChengyuForLevel, getLevelFromXp, getNextLevelRewardText, getRewardForLevel } from "../services/levelSystem";
import {
  claimTaskReward,
  fetchActiveTasks,
  fetchLeaderboard,
  fetchTaskClaimsForDate,
  getMoscowDateKey,
} from "../services/appDataService";
import { hasActiveSubscription } from "../services/subscriptionAccess";
import { resolveSubscriptionPlan } from "../services/subscriptionPlans";

const GUEST_PROFILE_STORAGE_KEY = "mandarinPlayGuestProfile";
const DEFAULT_GUEST_PROFILE = {
  username: "Гость",
  exp: 0,
  level: 1,
  dailyXp: 120,
};

function readGuestProfile() {
  try {
    const raw = window.localStorage.getItem(GUEST_PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_GUEST_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      username: typeof parsed.username === "string" && parsed.username.trim() ? parsed.username.trim() : DEFAULT_GUEST_PROFILE.username,
      exp: Number.isFinite(parsed.exp) ? Math.max(0, parsed.exp) : DEFAULT_GUEST_PROFILE.exp,
      level: Number.isFinite(parsed.level) ? Math.max(1, parsed.level) : DEFAULT_GUEST_PROFILE.level,
      dailyXp: Number.isFinite(parsed.dailyXp) ? Math.max(0, parsed.dailyXp) : DEFAULT_GUEST_PROFILE.dailyXp,
    };
  } catch (_error) {
    return DEFAULT_GUEST_PROFILE;
  }
}

const xpWays = [
  { label: "Пройти урок", xp: 50 },
  { label: "Ответить на вопросы", xp: 30 },
  { label: "Ежедневный вход", xp: 20 },
  { label: "Участвовать в активности", xp: 100 },
];

function ProfileDashboard() {
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAuth();
  const [rewardPopup, setRewardPopup] = useState("");
  const [guestProfile, setGuestProfile] = useState(() => readGuestProfile());
  const [xp, setXp] = useState(profile?.exp ?? guestProfile.exp);
  const [dailyXp, setDailyXp] = useState(guestProfile.dailyXp);
  const [levelUpPopup, setLevelUpPopup] = useState("");
  const [savingXp, setSavingXp] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [hasJoinedGroup, setHasJoinedGroup] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const username = profile?.username || user?.email || guestProfile.username;
  const isLoggedIn = Boolean(user?.id);
  const totalLoginDays = isLoggedIn ? Number(profile?.login_days ?? 0) : 0;
  const guestXpBlockedMessage = "XP доступен только после входа в аккаунт.";

  useEffect(() => {
    if (isLoggedIn) {
      setXp(profile?.exp ?? 0);
      setDailyXp(DEFAULT_GUEST_PROFILE.dailyXp);
      return;
    }

    const guestState = readGuestProfile();
    setGuestProfile(guestState);
    setXp(guestState.exp);
    setDailyXp(guestState.dailyXp);
  }, [isLoggedIn, profile?.exp]);

  useEffect(() => {
    const syncJoinedState = () => {
      if (!user?.id) {
        setHasJoinedGroup(false);
        return;
      }
      isGroupJoined(user.id).then((joined) => setHasJoinedGroup(Boolean(joined)));
    };
    syncJoinedState();
    window.addEventListener("focus", syncJoinedState);
    return () => {
      window.removeEventListener("focus", syncJoinedState);
    };
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;
    const loadProfileData = async () => {
      const [tasksResult, leaderboardResult, claimsResult] = await Promise.all([
        fetchActiveTasks(),
        fetchLeaderboard(10),
        user?.id ? fetchTaskClaimsForDate(user.id, getMoscowDateKey()) : Promise.resolve({ data: [], error: null }),
      ]);
      if (!isMounted) return;

      if (!tasksResult.error) {
        const claimedSet = new Set((claimsResult.data || []).map((item) => item.task_id));
        const normalizedTasks = (tasksResult.data || []).map((task) => ({
          id: task.id,
          title: task.title,
          points: Number(task.points || 0),
          done: claimedSet.has(task.id),
        }));
        setTasks(normalizedTasks);
      }

      if (!leaderboardResult.error) {
        setLeaderboard(
          (leaderboardResult.data || []).map((entry, index) => ({
            id: entry.user_id || `${index + 1}`,
            name: entry.username || `Игрок ${index + 1}`,
            points: Number(entry.points || 0),
          })),
        );
      }
    };
    loadProfileData();
    return () => {
      isMounted = false;
    };
  }, [user?.id, xp]);

  const levelState = useMemo(() => getLevelFromXp(xp), [xp]);
  const currentLevel = levelState.level;
  const nextTarget = levelState.nextLevelXpTarget;
  const progressValue = levelState.progress;
  const nextRewardText = getNextLevelRewardText(currentLevel);
  const currentAvatar = getAvatarForLevel(currentLevel);
  const levelChengyu = getChengyuForLevel(currentLevel);

  const claimReward = async (task) => {
    if (savingXp) return;
    setSyncError("");
    if (!user?.id) {
      setSyncError(guestXpBlockedMessage);
      return;
    }
    if (task?.done) {
      setSyncError("Эта награда уже получена сегодня.");
      return;
    }

    const points = Number(task?.points || 0);
    const beforeXp = xp;
    const newXp = beforeXp + points;
    const beforeLevel = getLevelFromXp(beforeXp).level;
    const afterState = getLevelFromXp(newXp);
    const computedLevel = afterState.level;

    try {
      setSavingXp(true);
      const { data: updatedProfile, error } = await claimTaskReward({
        userId: user.id,
        taskId: task.id,
        points,
        currentExp: beforeXp,
        currentLevel: computedLevel,
      });
      if (error) throw error;
      if (!updatedProfile) throw new Error("Профиль пользователя не найден или недоступен.");

      setXp(updatedProfile.exp ?? newXp);
      setProfile(updatedProfile);
      setDailyXp((prev) => prev + points);
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, done: true } : item)));
      setRewardPopup(`+${points} XP ⚡`);
      setTimeout(() => setRewardPopup(""), 900);

      const appliedLevel = getLevelFromXp(updatedProfile.exp ?? newXp).level;
      if (appliedLevel > beforeLevel) {
        const unlockedReward = getRewardForLevel(appliedLevel);
        setLevelUpPopup(`Ты достиг Lv.${appliedLevel}! Награда: ${unlockedReward}`);
        setTimeout(() => setLevelUpPopup(""), 1800);
      }
    } catch (error) {
      setSyncError(error.message || "Не удалось сохранить XP");
    } finally {
      setSavingXp(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    navigate("/login");
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
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 text-4xl shadow-lg">
              <span>{currentAvatar}</span>
            </div>
            <div>
              <p className="text-2xl font-black">{username}</p>
              <p className="font-bold text-slate-600">Lv.{currentLevel} | {levelChengyu}</p>
              <p className="text-sm font-semibold text-slate-500">Сегодня: +{dailyXp} XP 💰</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {hasJoinedGroup ? (
              <button
                type="button"
                onClick={() => navigate("/learning/group-dashboard")}
                className="rounded-xl bg-brand-blue/15 px-4 py-2 text-sm font-black text-brand-blue transition hover:scale-105 active:scale-[0.97]"
              >
                👥 Войти в группу
              </button>
            ) : null}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-rose-100 px-4 py-2 text-sm font-black text-rose-700 transition hover:scale-105 active:scale-[0.97]"
              >
                Выйти
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700 transition hover:scale-105 active:scale-[0.97]"
              >
                Войти
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
            <span>XP: {xp} / {nextTarget}</span>
            <span>До следующего уровня: {Math.max(levelState.xpToNextLevel - levelState.xpIntoLevel, 0)} XP</span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 transition-all duration-500"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
        {syncError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{syncError}</p> : null}
        {!isLoggedIn ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">{guestXpBlockedMessage}</p>
        ) : null}
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Всего дней входа</p>
          <p className="text-3xl font-black text-brand-red">{totalLoginDays} 🔥</p>
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

      {PAYMENTS_ENABLED ? (
        <Card>
          <h2 className="mb-2 text-xl font-extrabold">Подписка</h2>
          <p className="font-semibold text-slate-700">
            Статус: {hasActiveSubscription(profile) ? "active" : profile?.subscription_status || "inactive"}
          </p>
          <p className="text-sm font-semibold text-slate-600">
            Текущий план: {profile?.subscription_plan ? resolveSubscriptionPlan(profile.subscription_plan).title : "не выбран"}
          </p>
          <p className="text-sm font-semibold text-slate-600">
            Действует до:{" "}
            {profile?.subscription_current_period_end
              ? new Date(profile.subscription_current_period_end).toLocaleString()
              : "нет даты"}
          </p>
        </Card>
      ) : (
        <Card>
          <h2 className="mb-2 text-xl font-extrabold">Оплата</h2>
          <p className="font-semibold text-slate-600">
            Онлайн-оплата временно отключена — после получения ИНН и подключения эквайринга снова включим приём платежей.
          </p>
        </Card>
      )}

      <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        <Card>
          <DailyCheckIn allowRewards={isLoggedIn} checkInScopeKey={user?.id || "guest"} />
        </Card>

        <Card>
          <h2 className="mb-4 text-xl font-extrabold">Задачи дня (комбо-миссии)</h2>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClaim={claimReward}
                disabled={!isLoggedIn || task.done}
                disabledHint={!isLoggedIn ? "Войди, чтобы забирать XP-награды." : ""}
              />
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
