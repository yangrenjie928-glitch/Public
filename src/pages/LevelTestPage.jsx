import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import Button from "../components/Button";
import Card from "../components/Card";
import {
  buildRecommendation,
  calculateScore,
  generateQuestionSet,
  getLevel,
  saveTestResult,
} from "../modules/levelTestScoring";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function LevelTestPage() {
  const navigate = useNavigate();
  const [session] = useState(() => generateQuestionSet());
  const questions = session.questions;
  const [current, setCurrent] = useState(0);
  const [singleSelected, setSingleSelected] = useState(null);
  const [multiSelected, setMultiSelected] = useState([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [answers, setAnswers] = useState({});

  const isFinished = current >= questions.length;
  const progress = useMemo(() => Math.round(((current + 1) / questions.length) * 100), [current]);
  const currentQuestion = questions[current];

  const submitAnswer = () => {
    if (!currentQuestion) return;
    if ((currentQuestion.type === "single" || currentQuestion.type === "reading") && singleSelected === null) return;
    if (currentQuestion.type === "multiple" && multiSelected.length === 0) return;
    if (currentQuestion.type === "text" && !textAnswer.trim()) return;

    const value =
      currentQuestion.type === "multiple"
        ? multiSelected
        : currentQuestion.type === "text"
          ? textAnswer
          : currentQuestion.options[singleSelected];

    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    setSingleSelected(null);
    setMultiSelected([]);
    setTextAnswer("");
    setCurrent((prev) => prev + 1);
  };

  const scoring = useMemo(() => calculateScore(answers, questions), [answers, questions]);
  const recommendation = useMemo(() => buildRecommendation(scoring.byDimension), [scoring.byDimension]);

  useEffect(() => {
    if (isFinished) saveTestResult(scoring);
  }, [isFinished, scoring]);

  if (isFinished) {
    const radarData = {
      labels: ["拼音", "词汇", "语法", "语序", "阅读", "表达"],
      datasets: [
        {
          label: "Баллы по навыкам",
          data: [
            scoring.byDimension.pinyin,
            scoring.byDimension.vocab,
            scoring.byDimension.grammar,
            scoring.byDimension.order,
            scoring.byDimension.reading,
            scoring.byDimension.speaking,
          ],
          backgroundColor: "rgba(236, 72, 153, 0.25)",
          borderColor: "rgba(236, 72, 153, 1)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(236, 72, 153, 1)",
        },
      ],
    };

    const radarOptions = {
      responsive: true,
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 25,
          ticks: { backdropColor: "transparent", color: "#64748b", stepSize: 5 },
          grid: { color: "rgba(148, 163, 184, 0.25)" },
          angleLines: { color: "rgba(148, 163, 184, 0.25)" },
        },
      },
      plugins: { legend: { display: false } },
    };

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="animate-pop space-y-3 bg-gradient-to-r from-fuchsia-500 to-pink-500 p-7 text-white text-center">
          <h1 className="text-3xl font-black">🎉 Твой уровень: {scoring.finalLevel}</h1>
          <p className="text-sm font-black">Тестовый банк: {session.tier} ({session.tier === "A" ? "基础" : session.tier === "B" ? "进阶" : "提升"})</p>
          <p className="text-lg font-bold">Общий балл: {scoring.total} / 100</p>
          <p className="font-bold">Правильных ответов: {scoring.correctCount} / 21 + 表达模块</p>
          <p className="font-bold">👉 Начни с базового курса</p>
          <Button variant="ghost" size="lg" type="button" onClick={() => navigate("/learning")}>
            🚀 Начать обучение
          </Button>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 text-xl font-black">Разбор по навыкам</h2>
            <div className="grid gap-2 text-sm font-bold">
              {[
                ["拼音", "pinyin"],
                ["词汇", "vocab"],
                ["语法", "grammar"],
                ["语序", "order"],
                ["阅读", "reading"],
                ["表达", "speaking"],
              ].map(([label, key]) => (
                <div key={key} className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
                  <span>{label}</span>
                  <span>
                    {scoring.byDimension[key]} / {key === "speaking" ? 15 : key === "grammar" ? 25 : key === "reading" ? 20 : key === "vocab" ? 15 : 10} —{" "}
                    {scoring.dimensionLevels[key]}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="mb-3 text-xl font-black">Радар навыков (chart.js)</h2>
            <Radar data={radarData} options={radarOptions} />
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-black">Авто-рекомендация</h2>
          <p className="mt-2 font-semibold text-slate-700">{recommendation}</p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl bg-slate-100 px-4 py-3">
              <p className="text-sm font-black text-slate-500">Профиль пользователя</p>
              <p className="font-bold">Тип: {scoring.userProfile.type}</p>
              <p className="font-bold">Уровень: {scoring.userProfile.level}</p>
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-3">
              <p className="text-sm font-black text-slate-500">Слабые места (weaknesses[])</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {scoring.weaknesses.length ? (
                  scoring.weaknesses.map((tag) => (
                    <span key={tag} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                    Слабые зоны не выявлены
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-3">
              <p className="text-sm font-black text-slate-500">Рекомендуемые курсы</p>
              <ul className="mt-2 space-y-1 text-sm font-bold">
                {scoring.userProfile.recommendedCourses.map((course) => (
                  <li key={course}>• {course}</li>
                ))}
              </ul>
            </div>
          </div>
          <Button className="mt-4" type="button" onClick={() => navigate("/learning/trial")}>
            🎁 Бесплатный пробный урок
          </Button>
        </Card>
      </div>
    );
  }
  const isSingle = currentQuestion.type === "single" || currentQuestion.type === "reading";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="space-y-3 bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
        <h1 className="text-3xl font-black">📊 Проверь свой уровень китайского</h1>
        <p className="font-bold">Вопрос {current + 1} из {questions.length}</p>
        <div className="h-3 w-full rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-yellow-300 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <Card className="space-y-4 transition-all duration-300">
        {currentQuestion.passage ? (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            <p className="mb-1 text-xs font-black uppercase">阅读材料</p>
            {currentQuestion.passage}
          </div>
        ) : null}
        <h2 className="text-xl font-black">{currentQuestion.question}</h2>

        {isSingle ? (
          <div className="grid gap-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={option}
                type="button"
                className={`rounded-2xl px-4 py-3 text-left font-black transition hover:scale-[1.02] active:scale-[0.97] ${
                  singleSelected === idx
                    ? "bg-fuchsia-500 text-white shadow-lg"
                    : "bg-slate-100 text-slate-700"
                }`}
                onClick={() => setSingleSelected(idx)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}

        {currentQuestion.type === "multiple" ? (
          <div className="grid gap-3">
            {currentQuestion.options.map((option) => {
              const active = multiSelected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={`rounded-2xl px-4 py-3 text-left font-black transition hover:scale-[1.02] active:scale-[0.97] ${
                    active ? "bg-fuchsia-500 text-white shadow-lg" : "bg-slate-100 text-slate-700"
                  }`}
                  onClick={() =>
                    setMultiSelected((prev) =>
                      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
                    )
                  }
                >
                  {active ? "✅ " : ""}{option}
                </button>
              );
            })}
          </div>
        ) : null}

        {currentQuestion.type === "text" ? (
          <textarea
            value={textAnswer}
            onChange={(event) => setTextAnswer(event.target.value)}
            placeholder="Напиши ответ по-китайски..."
            className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-fuchsia-500"
          />
        ) : null}

        <Button
          type="button"
          onClick={submitAnswer}
          disabled={
            (isSingle && singleSelected === null) ||
            (currentQuestion.type === "multiple" && multiSelected.length === 0) ||
            (currentQuestion.type === "text" && !textAnswer.trim())
          }
        >
          Ответить
        </Button>
        <p className="text-xs font-bold text-slate-500">Уровень этого блока: {getLevel(progress)}</p>
      </Card>
    </div>
  );
}

export default LevelTestPage;
