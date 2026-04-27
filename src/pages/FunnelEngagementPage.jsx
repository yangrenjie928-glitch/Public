import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { trackFunnelStep } from "../services/funnelTracking";

const taskList = [
  { id: "q", label: "Ответь на 5 вопросов" },
  { id: "w", label: "Напиши 1 слово" },
  { id: "s", label: "Поделись результатом" },
];

function FunnelEngagementPage() {
  const navigate = useNavigate();
  const [done, setDone] = useState([]);
  const [showReward, setShowReward] = useState(false);
  useEffect(() => {
    trackFunnelStep("engagement_open");
  }, []);

  const allDone = useMemo(() => done.length === taskList.length, [done.length]);

  const toggleTask = (id) => {
    setDone((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const finishTasks = () => {
    if (!allDone) return;
    trackFunnelStep("engagement_complete");
    setShowReward(true);
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-2 bg-gradient-to-r from-orange-400 to-rose-500 p-6 text-white">
        <h1 className="text-3xl font-black">Этап вовлечения 🕹️</h1>
        <p className="font-bold">Выполни 3 задания и получи +100 points 💰</p>
      </Card>

      <section className="grid gap-3">
        {taskList.map((task) => {
          const checked = done.includes(task.id);
          return (
            <button
              key={task.id}
              type="button"
              className={`card flex items-center justify-between p-4 text-left transition hover:scale-[1.01] active:scale-[0.97] ${
                checked ? "bg-emerald-50" : "bg-white"
              }`}
              onClick={() => toggleTask(task.id)}
            >
              <p className="text-lg font-black">{checked ? "✔ " : ""}{task.label}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${checked ? "bg-emerald-500 text-white" : "bg-slate-100"}`}>
                {checked ? "Done" : "Tap"}
              </span>
            </button>
          );
        })}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" type="button" onClick={finishTasks} disabled={!allDone}>
          Получить +100 points 💰
        </Button>
      </div>

      {showReward ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="animate-pop w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
            <p className="text-4xl">🎉</p>
            <h2 className="mt-2 text-3xl font-black text-fuchsia-600">Отлично!</h2>
            <p className="mt-2 font-bold text-slate-700">Ты уже сделал первый шаг!</p>
            <p className="mt-1 font-black text-emerald-600">+100 points 💰</p>
            <Button
              className="mt-5 w-full"
              type="button"
              onClick={() => {
                trackFunnelStep("offer_open");
                navigate("/funnel/offer");
              }}
            >
              Продолжить
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default FunnelEngagementPage;
