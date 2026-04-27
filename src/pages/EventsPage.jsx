import { useMemo, useState } from "react";
import EventCard from "../components/EventCard";
import Button from "../components/Button";
import { events } from "../data/mockData";

const tabs = ["Все", "Активные", "Завершённые"];

function EventsPage() {
  const [activeTab, setActiveTab] = useState("Все");

  const filteredEvents = useMemo(
    () => (activeTab === "Все" ? events : events.filter((event) => event.status === activeTab)),
    [activeTab],
  );

  return (
    <div className="space-y-6">
      <div>
        <span className="xp-chip mb-3">Еженедельный банк наград: ₽5 000</span>
        <h1 className="text-3xl font-black">События и челленджи</h1>
        <p className="text-slate-600">Участвуй, поднимайся в рейтинге и лови бонусы быстрее других.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button key={tab} variant={activeTab === tab ? "secondary" : "ghost"} onClick={() => setActiveTab(tab)}>
            {tab}
          </Button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export default EventsPage;
