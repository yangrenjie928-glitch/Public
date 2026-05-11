import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { fetchEventById, fetchEventsCatalog, fetchLeaderboard, joinEvent } from "../services/appDataService";
import animeSpring from "../assets/events/anime-spring.svg";
import { useAuth } from "../context/AuthContext";

const steps = ["Посети урок", "Ответь на вопросы", "Получи награду"];

function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const viewerId = user?.id ?? profile?.id ?? null;
  const [events, setEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const [eventResult, eventsFallback, leaderboardResult] = await Promise.all([
        eventId ? fetchEventById(eventId) : Promise.resolve({ data: [], error: null }),
        fetchEventsCatalog(),
        fetchLeaderboard(10),
      ]);
      if (!isMounted) return;

      if (leaderboardResult.error) {
        setError(leaderboardResult.error.message || "Не удалось загрузить данные события.");
      } else {
        setLeaderboard(
          (leaderboardResult.data || []).map((item, index) => ({
            id: item.user_id || `${index + 1}`,
            name: item.username || `Игрок ${index + 1}`,
            points: Number(item.points || 0),
          })),
        );
      }

      const pickRows = (rows) =>
        (rows || []).map((row) => ({
          id: row.id,
          title: row.title,
          image: row.cover_url || animeSpring,
          status: row.status || "Активные",
          countdown: row.subtitle || row.meta?.countdown || "Скоро",
          rewards: Array.isArray(row.rewards) ? row.rewards : [],
          link: row.link || `/events/${row.id}`,
        }));

      const chosen = pickRows(eventResult.data);
      if (chosen.length) {
        setEvents(chosen);
      } else if (!eventsFallback.error) {
        setEvents(pickRows(eventsFallback.data));
      } else {
        setError(eventsFallback.error.message || "Не удалось загрузить событие.");
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const event = useMemo(() => events.find((item) => item.id === eventId) || events[0], [events, eventId]);
  if (!event) {
    return <p className="text-sm font-semibold text-slate-500">Загружаем событие...</p>;
  }

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
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}
      {notice ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{notice}</p> : null}

      <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
        <div className="container-main">
          <Button
            className="w-full shadow-lg"
            size="lg"
            disabled={joining}
            onClick={async () => {
              if (!viewerId) {
                navigate("/login");
                return;
              }
              setJoining(true);
              const { error: joinError } = await joinEvent(viewerId, event.id);
              if (joinError) {
                setError(joinError.message || "Не удалось записаться в событие.");
              } else {
                setError("");
                setNotice("Ты успешно присоединился к событию.");
              }
              setJoining(false);
            }}
          >
            Участвовать сейчас
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPage;
