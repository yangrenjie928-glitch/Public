import Badge from "./Badge";
import Button from "./Button";
import Card from "./Card";

function TaskCard({ task, onClaim }) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <h4 className="font-semibold">{task.title}</h4>
        <p className="text-sm text-slate-500">Награда: +{task.points} очков</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge color={task.done ? "green" : "blue"}>{task.done ? "Выполнено" : "В процессе"}</Badge>
        <Button size="sm" variant="warning" onClick={() => onClaim(task.points)}>
          Забрать
        </Button>
      </div>
    </Card>
  );
}

export default TaskCard;
