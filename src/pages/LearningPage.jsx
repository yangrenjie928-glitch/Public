import { useMemo, useState } from "react";
import CourseCard from "../components/CourseCard";
import Button from "../components/Button";
import { courses, trialLesson } from "../data/mockData";

const levels = ["Все", "A1", "A2", "HSK"];
const types = ["Все", "Разговорный", "Бизнес"];

function LearningPage() {
  const [selectedLevel, setSelectedLevel] = useState("Все");
  const [selectedType, setSelectedType] = useState("Все");

  const filteredCourses = useMemo(
    () =>
      courses.filter(
        (course) =>
          (selectedLevel === "Все" || course.level === selectedLevel) &&
          (selectedType === "Все" || course.type === selectedType),
      ),
    [selectedLevel, selectedType],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[250px,1fr]">
      <aside className="card h-fit space-y-4 p-5">
        <h2 className="text-xl font-extrabold">Фильтры</h2>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-500">Уровень</p>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <Button
                key={level}
                size="sm"
                variant={selectedLevel === level ? "secondary" : "ghost"}
                onClick={() => setSelectedLevel(level)}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-500">Тип</p>
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <Button
                key={type}
                size="sm"
                variant={selectedType === type ? "primary" : "ghost"}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </aside>

      <section>
        <h1 className="mb-4 text-2xl font-extrabold">Каталог курсов</h1>
        <div className="grid gap-5 md:grid-cols-2">
          <CourseCard
            key={trialLesson.id}
            course={trialLesson}
            to="/learning/trial"
            bannerLabel="Бесплатная пробная тренировка"
            ctaLabel="Записаться на пробный"
            cardClassName="ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-slate-50"
          />
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default LearningPage;
