import { useEffect, useMemo, useState } from "react";
import EventCard from "../components/EventCard";
import Button from "../components/Button";
import {
  fetchEventsCatalog,
  fetchEventsCatalogWithCache,
  fetchMyEventIds,
  readEventsCatalogCache,
  writeEventsCatalogCache,
} from "../services/appDataService";
import animeSpring from "../assets/events/anime-spring.svg";
import { useAuth } from "../context/AuthContext";

const tabs = ["Все", "Активные", "Завершённые", "Мои"];

function mapDbEventToCard(event) {
  return {
    id: event.id,
    title: event.title,
    image:
      (typeof event.cover_url === "string" &&
      (event.cover_url.startsWith("http") || event.cover_url.startsWith("/assets/") || event.cover_url.startsWith("/images/"))
        ? event.cover_url
        : "") || animeSpring,
    status: event.status || "Активные",
    countdown: event.subtitle || event.meta?.countdown || "Скоро",
    rewards: Array.isArray(event.rewards) ? event.rewards : [],
    link: event.link || `/events/${event.id}`,
  };
}

function EventsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Все");
  const [events, setEvents] = useState(() => {
    const cached = readEventsCatalogCache();
    return (cached || []).map(mapDbEventToCard);
  });
  const [myEventIds, setMyEventIds] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(() => {
    const cached = readEventsCatalogCache();
    return !(Array.isArray(cached) && cached.length > 0);
  });

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      const hasInitialEvents = Array.isArray(readEventsCatalogCache()) && readEventsCatalogCache().length > 0;
      if (!hasInitialEvents) {
        setLoading(true);
      }
      setError("");

      const cachedOrRemote = await fetchEventsCatalogWithCache();
      if (!isMounted) return;
      if (!cachedOrRemote.error && Array.isArray(cachedOrRemote.data) && cachedOrRemote.data.length > 0) {
        setEvents(cachedOrRemote.data.map(mapDbEventToCard));
      }

      if (cachedOrRemote.fromCache) {
        const { data: freshData, error: freshError } = await fetchEventsCatalog();
        if (!isMounted) return;
        if (freshError) {
          if (!hasInitialEvents) {
            setError(freshError.message || "Не удалось загрузить события.");
          }
        } else {
          setEvents((freshData || []).map(mapDbEventToCard));
          writeEventsCatalogCache(freshData || []);
          setError("");
        }
      } else if (cachedOrRemote.error) {
        setError(cachedOrRemote.error.message || "Не удалось загрузить события.");
      }

      setLoading(false);
    };
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadMyEvents = async () => {
      const { data, error: myError } = await fetchMyEventIds(user?.id);
      if (!isMounted) return;
      if (!myError) {
        setMyEventIds(data || []);
      }
    };
    loadMyEvents();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const filteredEvents = useMemo(
    () =>
      activeTab === "Все"
        ? events
        : activeTab === "Мои"
          ? events.filter((event) => myEventIds.includes(event.id))
          : events.filter((event) => event.status === activeTab),
    [activeTab, events, myEventIds],
  );

  return (
    <div className="space-y-6">
      <div>
        <span className="xp-chip mb-3">Еженедельный банк наград: ₽5 000</span>
        <h1 className="text-3xl font-black">События и челленджи</h1>
        <p className="text-slate-600">Участвуй, поднимайся в рейтинге и лови бонусы быстрее других.</p>
      </div>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm font-semibold text-slate-500">Загружаем события...</p> : null}
      {activeTab === "Мои" && !user?.id ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">Войди в аккаунт, чтобы видеть свои активности.</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button key={tab} variant={activeTab === tab ? "secondary" : "ghost"} onClick={() => setActiveTab(tab)}>
            {tab}
          </Button>
        ))}
      </div>
      {loading && filteredEvents.length === 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, idx) => (
            <div key={`event-skeleton-${idx}`} className="card h-72 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

export default EventsPage;
