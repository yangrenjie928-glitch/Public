import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import Button from "../components/Button";
import JoinModal from "../components/group/JoinModal";
import { useAuth } from "../context/AuthContext";
import { isGroupJoined, markGroupAsJoined } from "../services/groupMembership";
import { fetchCoursesCatalog, fetchCoursesCatalogWithCache, readCoursesCatalogCache, writeCoursesCatalogCache } from "../services/appDataService";
import courseAdvanced from "../assets/courses/anime-course-advanced.svg";
import coursePersonal from "../assets/courses/anime-course-personal.svg";
import courseTravel from "../assets/courses/anime-course-travel.svg";
import courseTrial from "../assets/courses/anime-course-trial.svg";

const levels = ["Все", "A1", "A2", "HSK"];
const types = ["Все", "Персональный", "Продвинутый", "Групповой"];

function mapDbCourseToCard(course) {
  return {
    id: course.id,
    image:
      (typeof course.cover_url === "string" &&
      (course.cover_url.startsWith("http") || course.cover_url.startsWith("/assets/") || course.cover_url.startsWith("/images/"))
        ? course.cover_url
        : "") ||
      (course.type === "Персональный"
        ? coursePersonal
        : course.type === "Продвинутый"
          ? courseAdvanced
          : course.type === "Групповой"
            ? courseTravel
            : courseTrial),
    titleRu: course.title,
    titleZh: course.title_zh || "",
    tags: Array.isArray(course.tags) ? course.tags : [],
    progress: Number(course.progress_percent || 0),
    level: course.level || "A1",
    type: course.type || "Персональный",
    bannerLabel: course.banner_label || "",
    ctaLabel: course.cta_label || "",
    price: Number(course.price || 0),
  };
}

function pathForCustomCourse(course) {
  if (course.type === "Персональный") return "/learning/custom";
  if (course.type === "Продвинутый") return "/learning/custom-premium";
  return "/learning";
}

function LearningPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState("Все");
  const [selectedType, setSelectedType] = useState("Все");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [courses, setCourses] = useState(() => {
    const cached = readCoursesCatalogCache();
    return (cached || []).map(mapDbCourseToCard);
  });
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(() => {
    const cached = readCoursesCatalogCache();
    return !(Array.isArray(cached) && cached.length > 0);
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadCourses = async () => {
      const cachedRows = readCoursesCatalogCache();
      const hasInitialCourses = Array.isArray(cachedRows) && cachedRows.length > 0;
      setError("");
      if (!hasInitialCourses) {
        setLoading(true);
      }
      const firstLoad = await fetchCoursesCatalogWithCache();
      if (!isMounted) return;
      if (!firstLoad.error && Array.isArray(firstLoad.data) && firstLoad.data.length > 0) {
        setCourses(firstLoad.data.map(mapDbCourseToCard));
      }

      if (firstLoad.fromCache) {
        const { data: freshRows, error: freshError } = await fetchCoursesCatalog();
        if (!isMounted) return;
        if (freshError) {
          if (!hasInitialCourses && (!firstLoad.data || !firstLoad.data.length)) {
            setError(freshError.message || "Не удалось загрузить курсы.");
          }
        } else {
          setCourses((freshRows || []).map(mapDbCourseToCard));
          writeCoursesCatalogCache(freshRows || []);
        }
      }
      setLoading(false);
    };
    loadCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const syncJoined = async () => {
      if (!user?.id) {
        setIsJoined(false);
        return;
      }
      const joined = await isGroupJoined(user.id);
      if (!isMounted) return;
      setIsJoined(Boolean(joined));
    };
    syncJoined();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const trialLesson = useMemo(() => courses.find((course) => course.type === "Разговорный"), [courses]);
  const nonTrialCourses = useMemo(() => courses.filter((course) => course.type !== "Разговорный"), [courses]);

  const filteredCourses = useMemo(
    () =>
      nonTrialCourses.filter(
        (course) =>
          (selectedLevel === "Все" || course.level === selectedLevel) &&
          (selectedType === "Все" || course.type === selectedType),
      ),
    [selectedLevel, selectedType, nonTrialCourses],
  );
  const orderedCourses = useMemo(
    () => [...filteredCourses].sort((a, b) => (a.type === "Групповой" ? -1 : 0) - (b.type === "Групповой" ? -1 : 0)),
    [filteredCourses],
  );

  const handleJoinGroup = async () => {
    if (!user?.id) {
      setIsJoinModalOpen(false);
      navigate("/login");
      return;
    }
    setIsJoinModalOpen(false);
    const joined = await markGroupAsJoined(user?.id);
    if (joined.ok) {
      setIsJoined(true);
    }
    navigate("/learning/group-dashboard");
  };

  const handleGroupCourseClick = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    if (isJoined) {
      navigate("/learning/group-dashboard");
      return;
    }
    setIsJoinModalOpen(true);
  };

  const handleCustomCourseCta = (course) => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    navigate(pathForCustomCourse(course));
  };

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
        {error ? <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}
        {loading ? <p className="mb-3 text-sm font-semibold text-slate-500">Загружаем курсы...</p> : null}
        <div className="grid gap-5 md:grid-cols-2">
          {trialLesson ? (
            <CourseCard
              key={trialLesson.id}
              course={trialLesson}
              to="/learning/trial"
              bannerLabel={trialLesson.bannerLabel || "Бесплатная пробная тренировка"}
              ctaLabel={trialLesson.ctaLabel || "Записаться на пробный"}
              cardClassName="ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-slate-50"
            />
          ) : null}
          {orderedCourses.map((course) => {
            const isGroup = course.type === "Групповой";
            const isCustomTrack = course.type === "Персональный" || course.type === "Продвинутый";
            return (
              <CourseCard
                key={course.id}
                course={course}
                to={
                  isGroup
                    ? "/learning/group-dashboard"
                    : course.type === "Персональный"
                      ? "/learning/custom"
                      : course.type === "Продвинутый"
                        ? "/learning/custom-premium"
                        : "/learning"
                }
                ctaLabel={
                  isGroup
                    ? course.ctaLabel || "Присоединиться к группе"
                    : course.type === "Персональный"
                      ? course.ctaLabel || "Пройти опрос"
                      : course.type === "Продвинутый"
                        ? course.ctaLabel || "Выбрать VIP"
                        : course.ctaLabel || "Начать"
                }
                bannerLabel={
                  isGroup
                    ? course.bannerLabel || "Командная миссия 4-6 участников"
                    : course.type === "Персональный"
                      ? course.bannerLabel || "Пошаговый персональный квиз"
                      : course.type === "Продвинутый"
                        ? course.bannerLabel || "VIP формат с наставником"
                        : course.bannerLabel || "Индивидуальная программа"
                }
                onCtaClick={isGroup ? handleGroupCourseClick : isCustomTrack ? () => handleCustomCourseCta(course) : undefined}
              />
            );
          })}
        </div>
      </section>
      <JoinModal open={isJoinModalOpen} onJoin={handleJoinGroup} onCancel={() => setIsJoinModalOpen(false)} />
    </div>
  );
}

export default LearningPage;
