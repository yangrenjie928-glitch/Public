import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { getDepositState, lockDeposit, settleDepositByProgress } from "../services/depositSystem";

const premiumFeatures = [
  "🧑‍🏫 Личный преподаватель",
  "📈 Индивидуальный план",
  "💬 1-на-1 поддержка",
  "⚡ Быстрый результат",
];

function PremiumCustomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState(3 * 60 * 60 + 25 * 60);
  const [depositState, setDepositState] = useState(() => getDepositState(user?.id));
  const [goalProgress, setGoalProgress] = useState(100);
  const [depositError, setDepositError] = useState("");
  const [settlementResult, setSettlementResult] = useState(null);
  const requiredDeposit = 1500;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const countdownLabel = useMemo(() => {
    const hours = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
    const seconds = String(secondsLeft % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [secondsLeft]);

  useEffect(() => {
    setDepositState(getDepositState(user?.id));
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="relative overflow-hidden bg-gradient-to-r from-fuchsia-600 via-brand-red to-brand-blue p-7 text-white">
        <span className="absolute right-5 top-5 rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-amber-900">🔥 Популярно</span>
        <h1 className="text-3xl font-black">👑 Персональный VIP курс</h1>
        <p className="mt-2 text-base font-bold text-white/90">Индивидуальный план + личный наставник</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-2xl bg-white/20 px-4 py-2 text-sm font-black">
            ⏳ Скидка сегодня: <span className="text-amber-200">{countdownLabel}</span>
          </div>
          <div className="rounded-2xl bg-white/20 px-4 py-2 text-sm font-black">⚡ Доступ к VIP-формату открывается сразу</div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-black">Что входит в VIP</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {premiumFeatures.map((feature) => (
            <div key={feature} className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-4 py-3 text-sm font-black text-fuchsia-800">
              {feature}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-black">Сравнение форматов</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-500">Standard</p>
            <ul className="mt-2 space-y-2 text-sm font-bold text-slate-700">
              <li>• Общий план</li>
              <li>• Самостоятельное обучение</li>
              <li>• Стандартный темп</li>
            </ul>
            <p className="mt-4 text-3xl font-black text-slate-800">990₽</p>
          </div>

          <div className="relative rounded-2xl border-2 border-brand-red bg-rose-50 p-4 shadow-[0_16px_36px_rgba(255,77,109,0.25)]">
            <span className="absolute -top-3 right-3 rounded-full bg-brand-red px-3 py-1 text-xs font-black text-white">Скидка сегодня</span>
            <p className="text-sm font-black text-rose-600">Premium VIP</p>
            <ul className="mt-2 space-y-2 text-sm font-bold text-rose-800">
              <li>• Персональный план</li>
              <li>• Наставник</li>
              <li>• Быстрый прогресс</li>
            </ul>
            <p className="mt-4 text-3xl font-black text-brand-red">2990₽</p>
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-to-r from-amber-50 to-rose-50 p-6">
        <p className="text-sm font-black text-slate-600">VIP дает ускоренный прогресс, персональные задачи и поддержку 1-на-1.</p>
        <div className="mt-4 space-y-3 rounded-2xl border border-brand-red/30 bg-white/80 p-4">
          <h3 className="text-lg font-black">💎 VIP депозит перед покупкой</h3>
          <p className="text-sm font-bold text-slate-600">
            Для VIP-пакета требуется депозит {requiredDeposit}₽. Возврат зависит от выполнения целей.
          </p>
          <p className="text-xs font-black text-slate-500">Текущий лимит депозита: {depositState.depositLimit}₽</p>
          {depositState.activeDeposit ? (
            <div className="space-y-2 rounded-xl bg-white p-3">
              <p className="text-sm font-black text-brand-red">Активный депозит: {depositState.activeDeposit.amount}₽</p>
              <label className="block text-xs font-black text-slate-500">
                Прогресс выполнения цели: {goalProgress}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={goalProgress}
                  onChange={(event) => setGoalProgress(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <Button
                variant="warning"
                onClick={() => {
                  const settled = settleDepositByProgress(user?.id, goalProgress);
                  if (!settled.ok) {
                    setDepositError(settled.error);
                    return;
                  }
                  setDepositState(settled.state);
                  setSettlementResult(settled.settlement);
                  setDepositError("");
                }}
              >
                Завершить и рассчитать возврат
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                const locked = lockDeposit(user?.id, { courseKey: "premium_custom", amount: requiredDeposit });
                if (!locked.ok) {
                  setDepositError(locked.error);
                  return;
                }
                setDepositState(locked.state);
                setDepositError("");
                setSettlementResult(null);
              }}
            >
              💳 Оплатить VIP-депозит
            </Button>
          )}
          {settlementResult ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
              Возврат: {settlementResult.refund}₽, удержано: {settlementResult.deduction}₽
            </p>
          ) : null}
          {depositError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-black text-rose-700">{depositError}</p> : null}
          <p className="text-xs font-bold text-slate-500">Совет: повышай лимит депозита через групповые награды и челленджи.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button disabled={!depositState.activeDeposit} onClick={() => navigate("/learning")}>
            👑 Выбрать VIP
          </Button>
          <Button variant="ghost" onClick={() => navigate("/learning/custom")}>
            Вернуться к Standard
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default PremiumCustomPage;
