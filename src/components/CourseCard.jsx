import { Link } from "react-router-dom";
import Badge from "./Badge";
import Button from "./Button";
import Card from "./Card";
import ProgressBar from "./ProgressBar";

function CourseCard({
  course,
  ctaLabel = "Начать",
  to = "/learning",
  bannerLabel = "Целевой учебный трек",
  cardClassName = "",
}) {
  const tagColor = (tag) => {
    if (tag.includes("HSK")) return "blue";
    if (tag.includes("Бесплат")) return "green";
    if (tag.includes("Пробн")) return "yellow";
    return "purple";
  };

  return (
    <Card className={`overflow-hidden p-0 ${cardClassName}`}>
      <div className="relative">
        <img src={course.image} alt={course.titleRu} className="h-44 w-full object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-bold text-white">
          {bannerLabel}
        </span>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-bold">{course.titleRu}</h3>
          <p className="text-2xl font-bold text-slate-800">{course.titleZh}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Фокус: {course.type}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {course.tags.map((tag) => (
            <Badge key={tag} color={tagColor(tag)}>
              {tag}
            </Badge>
          ))}
        </div>
        <ProgressBar value={course.progress} />
        <Link to={to} className="block">
          <Button className="w-full">{ctaLabel}</Button>
        </Link>
      </div>
    </Card>
  );
}

export default CourseCard;
