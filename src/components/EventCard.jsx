import { Link } from "react-router-dom";
import Badge from "./Badge";
import Button from "./Button";
import Card from "./Card";

function EventCard({ event }) {
  const targetLink = event.link || `/events/${event.id}`;

  return (
    <Card className="overflow-hidden p-0">
      <img src={event.image} alt={event.title} className="h-44 w-full object-cover" />
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{event.title}</h3>
          <Badge color={event.status === "Активные" ? "green" : "red"}>{event.status}</Badge>
        </div>
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">
          До конца: {event.countdown}
        </p>
        <div className="flex flex-wrap gap-2">
          {event.rewards.map((reward) => (
            <Badge key={reward} color="yellow">
              {reward}
            </Badge>
          ))}
        </div>
        <Link to={targetLink} className="block">
          <Button variant="secondary" className="w-full">
            Участвовать
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default EventCard;
