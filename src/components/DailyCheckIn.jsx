import { useEffect, useMemo, useRef, useState } from "react";
import Button from "./Button";
import { fetchMonthlyCheckins, getMoscowDateKey, insertDailyCheckin } from "../services/appDataService";

const FLIP_ANIMATION_MS = 620;
const MONTHLY_POPUP_DELAY_MS = 620;

const MONTHLY_REWARD_POOL = [
  { id: "mega_xp", label: "🔥 +500 XP и статус месяца" },
  { id: "vip_trial", label: "🌟 VIP-тренировка на 3 дня" },
  { id: "deposit", label: "💎 +300 к лимиту депозита" },
  { id: "lesson_pack", label: "📘 Пакет из 5 мини-уроков" },
];

function parseMoscowDateParts(dateKey) {
  const [yearRaw, monthRaw, dayRaw] = String(dateKey || "").split("-");
  return { year: Number(yearRaw), month: Number(monthRaw), day: Number(dayRaw) };
}

function getDaysInMonthFromMonthKey(monthKey) {
  const [yearRaw, monthRaw] = String(monthKey || "").split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return 30;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dayFromDateKey(dateKey) {
  const parts = String(dateKey || "").split("-");
  return Number(parts[2] || 0);
}

function DailyCheckIn({ allowRewards = true, checkInScopeKey = "guest" }) {
  const [moscowDateKey, setMoscowDateKey] = useState(() => getMoscowDateKey());
  const [checkedDays, setCheckedDays] = useState(() => new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [monthlyCelebration, setMonthlyCelebration] = useState(null);
  const [flippingDay, setFlippingDay] = useState(null);
  const [error, setError] = useState("");
  const flipTimerRef = useRef(null);
  const monthlyPopupTimerRef = useRef(null);

  const moscowMonthKey = useMemo(() => String(moscowDateKey).slice(0, 7), [moscowDateKey]);
  const { day: todayMoscowDay } = useMemo(() => parseMoscowDateParts(moscowDateKey), [moscowDateKey]);
  const daysInCurrentMonth = useMemo(() => getDaysInMonthFromMonthKey(moscowMonthKey), [moscowMonthKey]);
  const progress = useMemo(
    () => Math.round((checkedDays.size / Math.max(daysInCurrentMonth, 1)) * 100),
    [checkedDays.size, daysInCurrentMonth],
  );
  const checkedInToday = useMemo(() => checkedDays.has(todayMoscowDay), [checkedDays, todayMoscowDay]);
  const monthCompleted = useMemo(() => checkedDays.size >= daysInCurrentMonth, [checkedDays.size, daysInCurrentMonth]);

  useEffect(
    () => () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
      if (monthlyPopupTimerRef.current) clearTimeout(monthlyPopupTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    const syncState = async () => {
      if (!checkInScopeKey || checkInScopeKey === "guest") {
        setCheckedDays(new Set());
        return;
      }
      const nowKey = getMoscowDateKey();
      setMoscowDateKey(nowKey);
      const { data, error: fetchError } = await fetchMonthlyCheckins(checkInScopeKey, nowKey.slice(0, 7));
      if (!isMounted) return;
      if (fetchError) {
        setError(fetchError.message || "Не удалось загрузить историю check-in.");
        return;
      }
      setError("");
      const parsed = (data || []).map((row) => dayFromDateKey(row.checkin_date)).filter((day) => day > 0);
      setCheckedDays(new Set(parsed));
    };
    syncState();
    window.addEventListener("focus", syncState);
    return () => {
      isMounted = false;
      window.removeEventListener("focus", syncState);
    };
  }, [checkInScopeKey]);

  const handleCheckIn = async () => {
    if (!allowRewards) return;
    if (isAnimating) return;

    const todayKey = getMoscowDateKey();
    const { day: todayDay } = parseMoscowDateParts(todayKey);
    const monthKey = todayKey.slice(0, 7);
    const daysInMonth = getDaysInMonthFromMonthKey(monthKey);
    if (!Number.isInteger(todayDay) || todayDay < 1 || todayDay > daysInMonth) return;
    if (checkedDays.has(todayDay)) return;
    if (!checkInScopeKey || checkInScopeKey === "guest") return;

    setIsAnimating(true);
    const { error: insertError } = await insertDailyCheckin(checkInScopeKey, todayKey);
    if (insertError) {
      setError(insertError.message || "Не удалось сохранить check-in.");
      setIsAnimating(false);
      return;
    }
    setError("");

    const nextChecked = new Set(checkedDays);
    nextChecked.add(todayDay);
    const willCompleteMonth = nextChecked.size >= daysInMonth;
    setMoscowDateKey(todayKey);
    setCheckedDays(nextChecked);
    setFlippingDay(todayDay);

    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    flipTimerRef.current = window.setTimeout(() => {
      setFlippingDay(null);
      flipTimerRef.current = null;
    }, FLIP_ANIMATION_MS);

    if (willCompleteMonth) {
      if (monthlyPopupTimerRef.current) clearTimeout(monthlyPopupTimerRef.current);
      monthlyPopupTimerRef.current = window.setTimeout(() => {
        const reward = MONTHLY_REWARD_POOL[Math.floor(Math.random() * MONTHLY_REWARD_POOL.length)];
        setMonthlyCelebration(reward.label);
        monthlyPopupTimerRef.current = null;
      }, MONTHLY_POPUP_DELAY_MS);
    }

    window.setTimeout(() => setIsAnimating(false), 280);
  };

  return (
    <div className="checkin-root relative -m-5 space-y-4 p-5 sm:-m-6 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">Ежедневный check-in 🎁</h2>
        <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-bold text-pink-800">
          Прогресс: {progress}% ({checkedDays.size}/{daysInCurrentMonth})
        </span>
      </div>

      <div className="checkin-reward-anchor relative isolate rounded-2xl">
        <div className="checkin-combine checkin-grid--flat w-full cursor-default">
          <div className="grid grid-cols-7 gap-1.5 p-3 sm:gap-2 sm:p-4">
            {Array.from({ length: daysInCurrentMonth }, (_, index) => {
              const dayNumber = index + 1;
              const filled = checkedDays.has(dayNumber);
              const isToday = dayNumber === todayMoscowDay;
              return (
                <div
                  key={dayNumber}
                  className={`checkin-cell flex h-10 flex-col items-center justify-center rounded-md text-[11px] font-black sm:h-11 ${
                    filled ? "checkin-cell--filled" : "checkin-cell--empty"
                  } ${flippingDay === dayNumber ? "checkin-cell--flip" : ""} ${isToday ? "checkin-cell--today" : ""}`}
                  title={`День ${dayNumber}`}
                >
                  {filled ? <span className="leading-none text-sm">✓</span> : <span className="leading-none">{dayNumber}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={handleCheckIn} disabled={!allowRewards || checkedInToday || isAnimating || monthCompleted}>
          {checkedInToday ? "Сегодня уже отмечено" : `Отметить день ${todayMoscowDay}`}
        </Button>
        {!allowRewards ? <span className="text-sm font-bold text-amber-700">Войди в аккаунт, чтобы получать награды за check-in.</span> : null}
        {allowRewards && checkedInToday ? (
          <span className="text-sm font-bold text-slate-600">Следующая отметка станет доступна после 00:00 по Москве.</span>
        ) : null}
        {!checkedInToday ? <span className="text-sm font-semibold text-brand-blue">Сегодня активна ячейка дня: {todayMoscowDay}</span> : null}
        {monthCompleted ? <span className="text-sm font-bold text-fuchsia-700">Месяц закрыт! Готово праздничное награждение 🎆</span> : null}
      </div>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{error}</p> : null}

      {monthlyCelebration ? (
        <div className="checkin-fireworks-overlay" role="dialog" aria-labelledby="monthly-reward-title">
          <div className="checkin-fireworks-stage" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => {
              const left = 6 + ((index * 13) % 88);
              const top = 8 + ((index * 17) % 72);
              const delay = (index % 6) * 0.22;
              const hue = (index * 33) % 360;
              return (
                <span
                  key={`fw-${index}`}
                  className="checkin-firework"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    animationDelay: `${delay}s`,
                    "--firework-hue": `${hue}`,
                  }}
                />
              );
            })}
          </div>
          <div className="checkin-monthly-reward-card">
            <p className="text-5xl">🎆🎉🎆</p>
            <h3 id="monthly-reward-title" className="mt-2 text-2xl font-black text-fuchsia-700">
              Месяц закрыт!
            </h3>
            <p className="mt-2 text-sm font-bold text-slate-600">Ты отметил все дни месяца и получил награду:</p>
            <p className="mt-3 text-xl font-black text-brand-red">{monthlyCelebration}</p>
            <Button className="mt-5 w-full" onClick={() => setMonthlyCelebration(null)}>
              Забрать награду
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DailyCheckIn;
