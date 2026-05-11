import { Link } from "react-router-dom";
import Badge from "./Badge";
import Button from "./Button";
import Card from "./Card";
import ProgressBar from "./ProgressBar";
import { PAYMENTS_ENABLED } from "../config/payments";

function CourseCard({
  course,
  ctaLabel = "Начать",
  to = "/learning",
  bannerLabel = "Целевой учебный трек",
  cardClassName = "",
  onCtaClick,
  secondaryCtaLabel = "",
  onSecondaryCtaClick,
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
        {PAYMENTS_ENABLED && Number(course.price || 0) > 0 ? (
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
            Цена: {Number(course.price)} ₽
          </div>
        ) : null}
        {onCtaClick ? (
          <Button className="w-full" onClick={onCtaClick}>
            {ctaLabel}
          </Button>
        ) : (
          <Link to={to} className="block">
            <Button className="w-full">{ctaLabel}</Button>
          </Link>
        )}
        {secondaryCtaLabel && onSecondaryCtaClick ? (
          <Button className="w-full" variant="ghost" onClick={onSecondaryCtaClick}>
            {secondaryCtaLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export default CourseCard;
