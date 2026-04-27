import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { trackFunnelStep } from "../services/funnelTracking";

const lessonWords = [
  { hanzi: "马", pinyin: "mǎ", meaning: "лошадь" },
  { hanzi: "你", pinyin: "nǐ", meaning: "ты" },
  { hanzi: "好", pinyin: "hǎo", meaning: "хорошо" },
  { hanzi: "爱", pinyin: "ài", meaning: "любовь" },
  { hanzi: "学", pinyin: "xué", meaning: "учиться" },
  { hanzi: "家", pinyin: "jiā", meaning: "дом" },
  { hanzi: "水", pinyin: "shuǐ", meaning: "вода" },
  { hanzi: "天", pinyin: "tiān", meaning: "небо" },
  { hanzi: "友", pinyin: "yǒu", meaning: "друг" },
  { hanzi: "梦", pinyin: "mèng", meaning: "мечта" },
];

function FunnelTrialLessonPage() {
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState([]);
  useEffect(() => {
    trackFunnelStep("trial_lesson_open");
  }, []);

  const revealWord = (idx) => {
    if (revealed.includes(idx)) return;
    setRevealed((prev) => [...prev, idx]);
  };

  const progressStage = useMemo(() => {
    const ratio = revealed.length / lessonWords.length;
    if (ratio >= 1) return 100;
    if (ratio >= 0.6) return 60;
    return 30;
  }, [revealed]);

  return (
    <div className="space-y-6">
      <Card className="space-y-3 bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
        <h1 className="text-3xl font-black">Пробный урок 🎮</h1>
        <p className="font-bold">Нажимай на карточки и открывай значения. Это как мини-игра 😄</p>
        <p className="rounded-xl bg-white/20 px-4 py-2 font-black">Урок {progressStage}% / 60% / 100%</p>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lessonWords.map((word, idx) => {
          const isOpen = revealed.includes(idx);
          return (
            <button
              key={word.hanzi + idx}
              type="button"
              className="card space-y-2 p-5 text-left transition hover:scale-[1.02] active:scale-[0.97]"
              onClick={() => revealWord(idx)}
            >
              <div className="flex items-center justify-between">
                <p className="text-4xl font-black text-slate-900">{word.hanzi}</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black">🔊</span>
              </div>
              <p className="font-black text-fuchsia-600">{word.pinyin}</p>
              <p className={`font-semibold ${isOpen ? "text-slate-700" : "text-slate-300"}`}>
                {isOpen ? `Значение: ${word.meaning}` : "Нажми, чтобы открыть значение"}
              </p>
            </button>
          );
        })}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            trackFunnelStep("trial_lesson_complete", { revealed: revealed.length });
            navigate("/funnel/engagement");
          }}
          disabled={revealed.length < lessonWords.length}
        >
          Завершить урок и перейти дальше
        </Button>
        <p className="self-center text-sm font-bold text-slate-500">
          Открыто слов: {revealed.length}/{lessonWords.length}
        </p>
      </div>
    </div>
  );
}

export default FunnelTrialLessonPage;
