import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { getDepositState, lockDeposit, settleDepositByProgress } from "../services/depositSystem";

const purposeOptions = [
  { id: "business", label: "💼 Для бизнеса" },
  { id: "hsk", label: "📚 Для экзамена HSK" },
  { id: "travel", label: "✈️ Для путешествий" },
  { id: "self", label: "🎯 Для себя" },
];

const goalOptions = [
  { id: "start", label: "🌱 С нуля" },
  { id: "fast", label: "⚡ Быстро освоить базу" },
  { id: "improve", label: "🎯 Улучшить навыки" },
];

const timeOptions = [
  { id: "light", label: "10–15 мин в день" },
  { id: "mid", label: "30 мин в день" },
  { id: "deep", label: "1 час+" },
];

const steps = [
  {
    id: "purpose",
    title: "🎯 Зачем тебе китайский?",
    options: purposeOptions,
  },
  {
    id: "goal",
    title: "🚀 Как ты хочешь учиться?",
    options: goalOptions,
  },
  {
    id: "time",
    title: "⏱ Сколько времени ты готов уделять?",
    options: timeOptions,
  },
];

function PersonalCustomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({
    purpose: "",
    goal: "",
    time: "",
  });
  const [depositState, setDepositState] = useState(() => getDepositState(user?.id));
  const [goalProgress, setGoalProgress] = useState(100);
  const [depositError, setDepositError] = useState("");
  const [settlementResult, setSettlementResult] = useState(null);

  const currentStep = steps[stepIndex];
  const isSummaryStep = stepIndex === steps.length;
  const canContinue = isSummaryStep || Boolean(answers[currentStep.id]);
  const progressPercent = Math.round((Math.min(stepIndex + 1, 4) / 4) * 100);

  const result = useMemo(() => {
    const recommendsPremium =
      answers.purpose === "business" ||
      answers.goal === "fast" ||
      answers.time === "deep";

    const courseType = recommendsPremium ? "VIP персональный курс" : "Персональный курс Standard";
    const learningSpeed =
      answers.time === "deep" ? "Интенсивный ритм (6-7 уроков в неделю)" : answers.time === "mid" ? "Стабильный ритм (4 урока в неделю)" : "Мягкий ритм (2-3 урока в неделю)";
    const suggestedFormat =
      answers.goal === "start"
        ? "Пошаговый старт + словарные мини-миссии"
        : answers.goal === "fast"
          ? "Спринты по 20-30 минут + живая практика"
          : "Разговорные сессии + закрепление сложных тем";

    return { courseType, learningSpeed, suggestedFormat, recommendsPremium };
  }, [answers]);

  const requiredDeposit = 500;

  useEffect(() => {
    setDepositState(getDepositState(user?.id));
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="bg-gradient-to-r from-brand-blue to-brand-red p-6 text-white">
        <p className="text-sm font-black uppercase tracking-wider text-white/85">Step-by-step quiz</p>
        <h1 className="mt-2 text-3xl font-black">🧭 Персональная настройка курса</h1>
        <p className="mt-2 text-sm font-bold text-white/90">Ответь на 3 вопроса и получи точный учебный план за 30 секунд.</p>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-black text-white/90">
            <span>Шаг {Math.min(stepIndex + 1, 4)}/4</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/30">
            <div className="h-2 rounded-full bg-white transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </Card>

      {!isSummaryStep ? (
        <Card className="space-y-5 p-6 transition-all duration-300">
          <h2 className="text-2xl font-black">{currentStep.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {currentStep.options.map((option) => {
              const selected = answers[currentStep.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentStep.id]: option.id,
                    }))
                  }
                  className={`rounded-2xl border-2 px-5 py-4 text-left text-base font-black transition ${
                    selected
                      ? "border-brand-blue bg-brand-blue/10 text-brand-blue shadow-[0_10px_24px_rgba(59,130,246,0.25)]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-red/40 hover:bg-rose-50/40"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            {stepIndex > 0 ? (
              <Button variant="ghost" onClick={() => setStepIndex((prev) => prev - 1)}>
                Назад
              </Button>
            ) : null}
            <Button variant="secondary" disabled={!canContinue} onClick={() => setStepIndex((prev) => prev + 1)}>
              Дальше →
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="space-y-5 p-6 transition-all duration-300">
          <h2 className="text-3xl font-black text-brand-blue">📊 Твой план готов! 🎉</h2>
          <div className="grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Recommended course type</p>
              <p className="mt-1 text-lg font-black">{result.courseType}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Learning speed</p>
              <p className="mt-1 text-lg font-black">{result.learningSpeed}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Suggested format</p>
              <p className="mt-1 text-lg font-black">{result.suggestedFormat}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-800">
              {result.recommendsPremium
                ? "🔥 Для твоей цели лучше подойдет VIP формат: быстрее результат и личный наставник."
                : "✨ Стандартный формат отлично подойдет. При желании можно ускориться в VIP режиме."}
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-brand-blue/30 bg-brand-blue/5 p-4">
            <h3 className="text-xl font-black">💰 Депозит перед покупкой курса</h3>
            <p className="text-sm font-bold text-slate-600">
              Перед началом курса нужно внести депозит {requiredDeposit}₽. После достижения цели депозит возвращается.
              Если цель не достигнута, удержание зависит от прогресса.
            </p>
            <p className="text-xs font-black text-slate-500">Текущий лимит депозита: {depositState.depositLimit}₽</p>
            {depositState.activeDeposit ? (
              <div className="space-y-3 rounded-xl bg-white p-3">
                <p className="text-sm font-black text-brand-blue">Активный депозит: {depositState.activeDeposit.amount}₽</p>
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
                  const locked = lockDeposit(user?.id, { courseKey: "standard_custom", amount: requiredDeposit });
                  if (!locked.ok) {
                    setDepositError(locked.error);
                    return;
                  }
                  setDepositState(locked.state);
                  setDepositError("");
                  setSettlementResult(null);
                }}
              >
                💳 Оплатить депозит
              </Button>
            )}
            {settlementResult ? (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                Возврат: {settlementResult.refund}₽, удержано: {settlementResult.deduction}₽
              </p>
            ) : null}
            {depositError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-black text-rose-700">{depositError}</p> : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button disabled={!depositState.activeDeposit} onClick={() => navigate("/learning")}>
              🚀 Начать обучение
            </Button>
            <Button variant="secondary" onClick={() => navigate("/learning/custom-premium")}>
              👑 Посмотреть VIP
            </Button>
            <Button variant="ghost" onClick={() => setStepIndex(0)}>
              Пройти заново
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default PersonalCustomPage;
