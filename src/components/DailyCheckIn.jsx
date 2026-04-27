import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "./Button";

const TOTAL_CELLS = 28;
/** Задержка перед показом награды — успеть увидеть «нажатие» 3D-кнопки */
const REWARD_APPEAR_DELAY_MS = 120;

const REWARD_POOL = [
  { id: "xp50", label: "+50 XP" },
  { id: "xp100", label: "+100 XP" },
  { id: "coin", label: "Монета удачи 🪙" },
  { id: "streak", label: "Щит стрика на 1 день 🛡️" },
  { id: "lesson", label: "Бесплатный мини-урок 📘" },
];

function pickRandomUnfilledIndex(filledSet) {
  const empty = [];
  for (let i = 0; i < TOTAL_CELLS; i += 1) {
    if (!filledSet.has(i)) empty.push(i);
  }
  if (empty.length === 0) return null;
  const r = Math.floor(Math.random() * empty.length);
  return empty[r];
}

function DailyCheckIn() {
  const [filledIndices, setFilledIndices] = useState(() => new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  /** После заполнения всех ячеек — ждём окончания «последней» анимации, затем включаем 3D */
  const [show3d, setShow3d] = useState(false);
  /** Награда ещё не забрана — блокируем повторный чек-ин */
  const [pendingClaim, setPendingClaim] = useState(false);
  const [rewardModal, setRewardModal] = useState(null);
  const [claimPressed, setClaimPressed] = useState(false);
  const lastFillTimerRef = useRef(null);
  const rewardDelayRef = useRef(null);
  const claimInProgressRef = useRef(false);

  const progress = useMemo(() => Math.round((filledIndices.size / TOTAL_CELLS) * 100), [filledIndices]);

  const schedule3dTransition = useCallback((willBeFull) => {
    if (lastFillTimerRef.current) {
      clearTimeout(lastFillTimerRef.current);
      lastFillTimerRef.current = null;
    }
    if (!willBeFull) {
      setShow3d(false);
      setPendingClaim(false);
      return;
    }
    setPendingClaim(true);
    // Сначала доигрываем анимацию ячейки, затем плавно включаем 3D-обёртку
    lastFillTimerRef.current = setTimeout(() => {
      setShow3d(true);
      lastFillTimerRef.current = null;
    }, 420);
  }, []);

  useEffect(
    () => () => {
      if (lastFillTimerRef.current) clearTimeout(lastFillTimerRef.current);
      if (rewardDelayRef.current) clearTimeout(rewardDelayRef.current);
    },
    [],
  );

  const handleCheckIn = () => {
    if (isAnimating) return;
    if (filledIndices.size >= TOTAL_CELLS) return;
    if (pendingClaim) return;

    const nextIndex = pickRandomUnfilledIndex(filledIndices);
    if (nextIndex === null) return;

    setIsAnimating(true);
    const next = new Set(filledIndices);
    next.add(nextIndex);
    const willBeFull = next.size >= TOTAL_CELLS;

    setFilledIndices(next);
    schedule3dTransition(willBeFull);

    window.setTimeout(() => setIsAnimating(false), 280);
  };

  const handleClaimReward = () => {
    if (!show3d || !pendingClaim) return;
    if (claimInProgressRef.current) return;
    claimInProgressRef.current = true;

    if (lastFillTimerRef.current) {
      clearTimeout(lastFillTimerRef.current);
      lastFillTimerRef.current = null;
    }
    if (rewardDelayRef.current) {
      clearTimeout(rewardDelayRef.current);
      rewardDelayRef.current = null;
    }

    const pick = REWARD_POOL[Math.floor(Math.random() * REWARD_POOL.length)];
    setClaimPressed(true);

    rewardDelayRef.current = setTimeout(() => {
      setClaimPressed(false);
      setRewardModal(pick.label);
      setFilledIndices(new Set());
      setShow3d(false);
      setPendingClaim(false);
      claimInProgressRef.current = false;
      rewardDelayRef.current = null;
    }, REWARD_APPEAR_DELAY_MS);
  };

  const closeModal = () => setRewardModal(null);

  const combineClass = [
    "checkin-combine",
    show3d && pendingClaim ? "checkin-grid--3d" : "checkin-grid--flat",
    claimPressed ? "checkin-grid--pressed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const gridInteractive = show3d && pendingClaim;

  const gridInner = (
    <div className="grid grid-cols-7 gap-1.5 p-3 sm:gap-2 sm:p-4">
      {Array.from({ length: TOTAL_CELLS }, (_, i) => {
        const filled = filledIndices.has(i);
        return (
          <div
            key={i}
            className={`checkin-cell flex h-9 items-center justify-center rounded-md text-xs font-bold sm:h-10 ${
              filled ? "checkin-cell--filled" : "checkin-cell--empty"
            }`}
          >
            {filled ? "✓" : ""}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="checkin-root space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">Ежедневный check-in 🎁</h2>
        <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-bold text-pink-800">
          Прогресс: {progress}%
        </span>
      </div>

      {/* Награда показывается только внутри этой области (не fixed на весь экран, не по hover) */}
      <div className="checkin-reward-anchor relative isolate rounded-2xl">
        <div className="checkin-perspective">
          {gridInteractive ? (
            <button
              type="button"
              className={`${combineClass} w-full cursor-pointer text-left`}
              onClick={handleClaimReward}
              aria-label="Получить награду за полный цикл чек-ина"
            >
              {gridInner}
            </button>
          ) : (
            <div className={`${combineClass} w-full cursor-default`}>{gridInner}</div>
          )}
        </div>

        {rewardModal ? (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-900/45 p-3 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkin-reward-title"
          >
            <div className="checkin-reward-card animate-pop w-full max-w-sm rounded-2xl border border-pink-200 bg-white p-5 text-center shadow-xl">
              <p id="checkin-reward-title" className="mb-1 text-lg font-black text-pink-600">
                Поздравляем!
              </p>
              <p className="mb-3 text-sm text-slate-600">Твоя награда:</p>
              <p className="mb-5 text-2xl font-black text-pink-600">{rewardModal}</p>
              <Button className="w-full" onClick={closeModal}>
                Отлично
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={handleCheckIn}
          disabled={isAnimating || filledIndices.size >= TOTAL_CELLS || pendingClaim}
        >
          Отметить чек-ин
        </Button>
        {pendingClaim && !show3d ? (
          <span className="text-sm font-semibold text-slate-500">Завершаем отметку…</span>
        ) : null}
        {show3d && pendingClaim ? (
          <span className="text-sm font-bold text-pink-700">Нажми на блок, чтобы забрать награду!</span>
        ) : null}
      </div>

    </div>
  );
}

export default DailyCheckIn;
