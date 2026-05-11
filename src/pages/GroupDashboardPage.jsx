import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import ChatPanel from "../components/group/ChatPanel";
import { useAuth } from "../context/AuthContext";
import { getAvatarForLevel, getLevelFromXp, getRewardForLevel } from "../services/levelSystem";
import { getDepositState, increaseDepositLimit } from "../services/depositSystem";
import {
  fetchGroupActivities,
  fetchGroupMembers,
  fetchGroupMessages,
  getOrCreateActiveGroup,
  sendGroupMessage,
  upsertGroupActivities,
} from "../services/appDataService";

const fallbackActivities = [
  "Онлайн встреча (Zoom) — Пятница 19:00",
  "Оффлайн встреча — Суббота 16:00",
];
const weeklyChallenges = ["Ответить на 5 вопросов", "Пройти урок", "Написать слово"];

function formatTime(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function GroupDashboardPage() {
  const { profile, user } = useAuth();
  const [groupId, setGroupId] = useState(null);
  const [members, setMembers] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState(fallbackActivities);
  const [pinnedActivity, setPinnedActivity] = useState(fallbackActivities[0]);
  const [isEditingActivities, setIsEditingActivities] = useState(false);
  const [draftActivities, setDraftActivities] = useState(fallbackActivities);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSending, setChatSending] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [depositState, setDepositState] = useState(() => getDepositState(user?.id));
  const [rewardNotice, setRewardNotice] = useState("");
  const [error, setError] = useState("");

  const currentUserName = profile?.username || user?.email?.split("@")[0] || "Ivan";
  const currentUserXp = Number(profile?.exp ?? 120);
  const currentLevelState = getLevelFromXp(currentUserXp);
  const currentUserLevel = currentLevelState.level;
  const currentUserAvatar = getAvatarForLevel(currentUserLevel);
  const currentUserLoginDays = Number(profile?.login_days ?? 0);

  useEffect(() => {
    setDepositState(getDepositState(user?.id));
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;
    const loadGroupData = async () => {
      if (!user?.id) {
        setError("Войди в аккаунт, чтобы открыть группу.");
        return;
      }
      setError("");
      const { data: membership, error: membershipError } = await getOrCreateActiveGroup(user.id);
      if (!isMounted) return;
      if (membershipError || !membership?.group_id) {
        setError(membershipError?.message || "Не удалось подключиться к группе.");
        return;
      }
      const resolvedGroupId = membership.group_id;
      setGroupId(resolvedGroupId);

      const [membersResult, activitiesResult, messagesResult] = await Promise.all([
        fetchGroupMembers(resolvedGroupId),
        fetchGroupActivities(resolvedGroupId),
        fetchGroupMessages(resolvedGroupId),
      ]);
      if (!isMounted) return;

      if (membersResult.error) {
        setError(membersResult.error.message || "Не удалось загрузить участников.");
        return;
      }

      const mappedMembers = (membersResult.data || []).map((memberRow) => {
        const userRow = memberRow.users || {};
        const xp = Number(userRow.exp ?? 0);
        const level = Number(userRow.level ?? 1);
        const name = userRow.username || userRow.email?.split("@")[0] || "Участник";
        return {
          id: memberRow.user_id,
          name,
          lesson: "Урок 2",
          progress: Math.max(10, getLevelFromXp(xp).progress),
          xp,
          avatar: getAvatarForLevel(level),
          role: memberRow.role || "member",
          isCurrent: memberRow.user_id === user.id,
          loginDays: Number(userRow.login_days ?? 0),
        };
      });
      setMembers(mappedMembers);

      if (!activitiesResult.error) {
        const titles = (activitiesResult.data || []).map((item) => item.title).filter(Boolean);
        if (titles.length) {
          setUpcomingActivities(titles);
          setDraftActivities(titles);
        }
        const pinned = (activitiesResult.data || []).find((item) => item.is_pinned)?.title;
        if (pinned) setPinnedActivity(pinned);
      }

      if (!messagesResult.error) {
        const normalizedMessages = (messagesResult.data || []).map((message) => ({
          id: message.id,
          type: "text",
          userId: message.user_id,
          text: message.message_text,
          time: formatTime(message.created_at),
          createdAt: message.created_at,
        }));
        setChatMessages(
          normalizedMessages.length
            ? normalizedMessages
            : [{ id: "sys-1", type: "system", text: "Группа создана. Цель: совместная миссия на 30 дней 🚀", time: formatTime() }],
        );
      }
    };

    loadGroupData();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const sortedRanking = useMemo(() => [...members].sort((a, b) => b.xp - a.xp), [members]);
  const currentUser = useMemo(
    () =>
      members.find((member) => member.isCurrent) || {
        id: user?.id || "self",
        name: currentUserName,
        lesson: "Урок 2",
        progress: Math.max(10, currentLevelState.progress),
        xp: currentUserXp,
        avatar: currentUserAvatar,
        role: "member",
        isCurrent: true,
        loginDays: currentUserLoginDays,
      },
    [members, user?.id, currentUserName, currentLevelState.progress, currentUserXp, currentUserAvatar, currentUserLoginDays],
  );
  const groupLeader = useMemo(
    () => sortedRanking.find((member) => member.role === "leader") || sortedRanking[0] || currentUser,
    [sortedRanking, currentUser],
  );
  const isCurrentUserLeader = groupLeader.id === currentUser.id;
  const groupStatus = members.length >= 6 ? "Группа сформирована" : "Идёт набор";
  const weeklyCompetitionTop = sortedRanking.slice(0, 3);
  const maxProgress = Math.max(...members.map((member) => member.progress), 1);

  const saveActivities = async () => {
    if (!groupId || !user?.id) return;
    const normalized = draftActivities.map((item) => item.trim()).filter(Boolean);
    if (!normalized.length) return;
    const nextPinned = normalized.includes(pinnedActivity) ? pinnedActivity : normalized[0];

    const { error: saveError } = await upsertGroupActivities(groupId, user.id, normalized, nextPinned);
    if (saveError) {
      setRewardNotice(saveError.message || "Не удалось сохранить активности.");
      return;
    }
    setUpcomingActivities(normalized);
    setPinnedActivity(nextPinned);
    setIsEditingActivities(false);
    setRewardNotice("Активности сохранены в группе.");
  };

  const sendMessage = async (text) => {
    if (!groupId || !user?.id) return;
    const optimisticId = `tmp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      type: "text",
      userId: user.id,
      text,
      time: formatTime(),
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setChatMessages((prev) => [...prev, optimisticMessage]);
    setChatSending(true);
    const { data, error: sendError } = await sendGroupMessage(groupId, user.id, text);
    if (sendError) {
      setRewardNotice(sendError.message || "Не удалось отправить сообщение.");
      setChatMessages((prev) => prev.filter((message) => message.id !== optimisticId));
      setChatSending(false);
      return;
    }
    const inserted = Array.isArray(data) ? (data[0] ?? null) : data;
    if (inserted) {
      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === optimisticId
            ? {
                id: inserted.id,
                type: "text",
                userId: inserted.user_id,
                text: inserted.message_text,
                time: formatTime(inserted.created_at),
                createdAt: inserted.created_at,
                skipAppear: true,
              }
            : message,
        ),
      );
    }
    setChatSending(false);
  };

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}
      <section className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <Card>
          <h1 className="text-2xl font-black">👥 Твоя группа</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-brand-blue/15 px-4 py-2 text-sm font-black text-brand-blue">Участники: {members.length}/6</span>
            <span className="rounded-full bg-brand-yellow/20 px-4 py-2 text-sm font-black text-amber-800">{groupStatus}</span>
            <span className="rounded-full bg-fuchsia-100 px-4 py-2 text-sm font-black text-fuchsia-700">👑 Лидер: {groupLeader.name}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-r from-brand-blue to-brand-red text-sm font-black text-white shadow"
                title={member.name}
              >
                {member.avatar ?? member.name.slice(0, 1)}
              </div>
            ))}
          </div>
        </Card>
        <ChatPanel members={members} currentUser={currentUser} messages={chatMessages} onSendMessage={sendMessage} sendingMessage={chatSending} />
      </section>

      <Card>
        <h2 className="text-xl font-extrabold">📊 Прогресс группы</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">Имя</th>
                <th className="py-2">Урок</th>
                <th className="py-2">Прогресс (%)</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b transition hover:bg-slate-50">
                  <td className="py-3 font-bold">{member.name}</td>
                  <td className="py-3">{member.lesson}</td>
                  <td className="py-3">
                    <div className="w-44">
                      <ProgressBar value={member.progress} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-extrabold">🏆 Рейтинг участников</h2>
          <div className="mt-4 space-y-2">
            {sortedRanking.map((member, idx) => (
              <div
                key={member.id}
                className={`flex items-center justify-between rounded-xl px-4 py-3 transition hover:-translate-y-0.5 ${
                  member.isCurrent ? "animate-pulse bg-brand-yellow/25 ring-2 ring-brand-yellow/60" : "bg-slate-100"
                }`}
              >
                <p className="font-black">
                  #{idx + 1} {member.name} {member.role === "leader" ? "👑" : ""}
                </p>
                <p className="font-black text-fuchsia-600">{member.xp} XP</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold">📅 Активности группы</h2>
            {isCurrentUserLeader ? (
              <button
                type="button"
                onClick={() => {
                  setDraftActivities(upcomingActivities);
                  setIsEditingActivities((prev) => !prev);
                }}
                className="rounded-xl bg-brand-blue px-3 py-2 text-xs font-black text-white transition hover:scale-[1.02] active:scale-95"
              >
                {isEditingActivities ? "Отменить" : "✏️ Изменить активности"}
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {isCurrentUserLeader ? "Ты лидер группы и можешь изменять список активностей." : `Изменять активности может только лидер: ${groupLeader.name}.`}
          </p>

          <div className="mt-4 rounded-xl bg-brand-yellow/20 px-4 py-3">
            <p className="text-xs font-black text-amber-700">📌 Закреплённое сообщение</p>
            <p className="mt-1 text-sm font-black text-amber-900">{pinnedActivity}</p>
          </div>

          {isEditingActivities && isCurrentUserLeader ? (
            <div className="mt-4 space-y-2">
              {draftActivities.map((activity, idx) => (
                <input
                  key={`draft-${idx}`}
                  value={activity}
                  onChange={(event) => {
                    const next = [...draftActivities];
                    next[idx] = event.target.value;
                    setDraftActivities(next);
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-brand-blue"
                />
              ))}
              <button
                type="button"
                onClick={saveActivities}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-white transition hover:scale-[1.02] active:scale-95"
              >
                💾 Сохранить
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {upcomingActivities.map((activity) => (
                <div key={activity} className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 font-bold text-emerald-700">
                  <span>{activity}</span>
                  {isCurrentUserLeader ? (
                    <button
                      type="button"
                      onClick={() => setPinnedActivity(activity)}
                      className={`rounded-lg px-3 py-1 text-[11px] font-black transition ${
                        pinnedActivity === activity ? "bg-amber-200 text-amber-900" : "bg-white/80 text-emerald-800 hover:bg-white"
                      }`}
                    >
                      {pinnedActivity === activity ? "Закреплено" : "📌 Закрепить"}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold">🏆 Соревнование недели</h2>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">🎉 Активная фаза</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {weeklyCompetitionTop.map((member, idx) => (
            <div
              key={`weekly-${member.id}`}
              className={`rounded-2xl px-4 py-3 transition hover:-translate-y-0.5 ${
                idx === 0
                  ? "bg-gradient-to-r from-yellow-200 to-amber-300 text-amber-900 shadow-[0_0_24px_rgba(251,191,36,0.45)]"
                  : member.isCurrent
                    ? "bg-brand-yellow/25 ring-2 ring-brand-yellow/60"
                    : "bg-slate-100"
              }`}
            >
              <p className="font-black">
                #{idx + 1} {member.name} {idx === 0 ? "🔥" : ""}
              </p>
              <p className="mt-1 text-sm font-black">{member.xp} XP</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-black">📊 Сравнение прогресса</h3>
          {members.map((member) => (
            <div key={`progress-compare-${member.id}`} className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-600">
                <span>{member.isCurrent ? "You" : member.name}</span>
                <span>{member.progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-200">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    member.isCurrent ? "bg-gradient-to-r from-brand-blue to-brand-red" : "bg-gradient-to-r from-emerald-400 to-cyan-400"
                  }`}
                  style={{ width: `${Math.round((member.progress / maxProgress) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">🎁 Победитель получает бонус</div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-black">✅ Мини-челленджи</h3>
            <p className="mt-1 text-xs font-black text-slate-500">Лимит депозита: {depositState.depositLimit}₽</p>
            {rewardNotice ? <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">{rewardNotice}</p> : null}
            <div className="mt-2 space-y-2">
              {weeklyChallenges.map((challenge) => (
                <div key={challenge} className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
                  <span className="text-sm font-bold">{challenge}</span>
                  <button
                    type="button"
                    disabled={completedChallenges.includes(challenge)}
                    onClick={() => {
                      if (completedChallenges.includes(challenge)) return;
                      const boosted = increaseDepositLimit(user?.id, 200, `challenge:${challenge}`);
                      if (!boosted.ok) {
                        setRewardNotice(boosted.error || "Не удалось начислить бонус.");
                        return;
                      }
                      setDepositState(boosted.state);
                      setCompletedChallenges((prev) => [...prev, challenge]);
                      setRewardNotice(`+200₽ к лимиту депозита за челлендж: ${challenge}`);
                    }}
                    className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                  >
                    {completedChallenges.includes(challenge) ? "✅ Готово" : "Выполнить"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="font-black">Твой прогресс</h3>
          <p className="mt-2 text-3xl font-black text-brand-blue">{currentUser.progress}%</p>
        </Card>
        <Card>
          <h3 className="font-black">Твой XP 💰</h3>
          <p className="mt-2 text-3xl font-black text-brand-red">{currentUser.xp}</p>
        </Card>
        <Card>
          <h3 className="font-black">Твой уровень 🏆</h3>
          <p className="mt-2 text-3xl font-black text-brand-yellow">Lv.{currentUserLevel}</p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="font-black">Твой аватар</h3>
          <p className="mt-2 text-4xl font-black">{currentUserAvatar}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Аватар привязан к уровню и меняется автоматически.</p>
        </Card>
        <Card>
          <h3 className="font-black">Дней входа 🔥</h3>
          <p className="mt-2 text-3xl font-black text-brand-red">{currentUser.loginDays ?? currentUserLoginDays}</p>
        </Card>
        <Card>
          <h3 className="font-black">Роль в группе</h3>
          <p className="mt-2 text-2xl font-black text-fuchsia-600">{isCurrentUserLeader ? "👑 Лидер" : "🎯 Участник"}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Награда за текущий уровень: {getRewardForLevel(currentUserLevel)}</p>
        </Card>
      </section>
    </div>
  );
}

export default GroupDashboardPage;
