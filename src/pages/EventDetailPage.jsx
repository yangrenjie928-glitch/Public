import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { events, leaderboard } from "../data/mockData";

const steps = ["Посети урок", "Ответь на вопросы", "Получи награду"];

function EventDetailPage() {
  const { eventId } = useParams();
  const event = useMemo(() => events.find((item) => item.id === eventId) || events[0], [eventId]);

  return (
    <div className="space-y-6 pb-24">
      <Card className="overflow-hidden bg-gradient-to-r from-brand-blue to-brand-red p-0 text-white">
        <img src={event.image} alt={event.title} className="h-52 w-full object-cover opacity-30" />
        <div className="-mt-52 p-8">
          <h1 className="text-3xl font-black">{event.title}</h1>
          <p className="mt-2 inline-block rounded-full bg-white/20 px-4 py-2 font-semibold">
            До конца: {event.countdown}
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-2xl font-extrabold">Шаги участия</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl bg-slate-100 p-4">
              <p className="mb-2 text-sm font-bold text-brand-blue">Шаг {index + 1}</p>
              <p className="font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-2xl font-extrabold">Награды</h2>
        <div className="flex flex-wrap gap-3">
          {event.rewards.map((reward) => (
            <span key={reward} className="reward-chip animate-pop">
              🎁 {reward}
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-2xl font-extrabold">Топ 10 участников</h2>
        <div className="space-y-2">
          {leaderboard.map((player, index) => (
            <div key={player.id} className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-2">
              <p className="font-semibold">
                {index + 1}. {player.name}
              </p>
              <p className="font-bold text-brand-red">{player.points} очков</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
        <div className="container-main">
          <Button className="w-full shadow-lg" size="lg">
            Участвовать сейчас
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPage;
