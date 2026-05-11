import Badge from "./Badge";
import Button from "./Button";
import Card from "./Card";

function TaskCard({ task, onClaim, disabled = false, disabledHint = "" }) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <h4 className="font-semibold">{task.title}</h4>
        <p className="text-sm text-slate-500">Награда: +{task.points} очков</p>
        {disabledHint ? <p className="mt-1 text-xs font-bold text-amber-700">{disabledHint}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <Badge color={task.done ? "green" : "blue"}>{task.done ? "Выполнено" : "В процессе"}</Badge>
        <Button size="sm" variant="warning" onClick={() => onClaim(task)} disabled={disabled}>
          Забрать
        </Button>
      </div>
    </Card>
  );
}

export default TaskCard;
