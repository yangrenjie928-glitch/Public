import animeSpring from "../assets/events/anime-spring.svg";
import courseBasic from "../assets/courses/anime-course-basic.svg";
import courseAdvanced from "../assets/courses/anime-course-advanced.svg";
import coursePersonal from "../assets/courses/anime-course-personal.svg";
import courseTravel from "../assets/courses/anime-course-travel.svg";
import courseTrial from "../assets/courses/anime-course-trial.svg";

export const courses = [
  {
    id: 1,
    image: coursePersonal,
    titleRu: "Персональная настройка курса",
    titleZh: "个性定制",
    tags: ["Индивидуально", "Персональный план"],
    progress: 20,
    level: "A1",
    type: "Персональный",
  },
  {
    id: 2,
    image: courseAdvanced,
    titleRu: "Продвинутая персональная настройка",
    titleZh: "高级定制",
    tags: ["Премиум", "Глубокая настройка"],
    progress: 45,
    level: "A2",
    type: "Продвинутый",
  },
  {
    id: 3,
    image: courseTravel,
    titleRu: "Групповой курс 4-6 человек",
    titleZh: "小组课程（4-6人）",
    tags: ["Мини-группа", "4-6 человек"],
    progress: 10,
    level: "HSK",
    type: "Групповой",
  },
];

/** Бесплатный пробный урок — всегда показывается в каталоге (вне фильтров). */
export const trialLesson = {
  id: "trial-free",
  image: courseTrial,
  titleRu: "Бесплатный пробный урок",
  titleZh: "免费试听",
  tags: ["Бесплатно", "Пробный урок", "20 мин"],
  progress: 0,
  level: "A1",
  type: "Разговорный",
};

export const events = [
  {
    id: "chinese-month",
    title: "Месяц китайского языка 🇨🇳",
    image: animeSpring,
    status: "Активные",
    countdown: "Только в этом месяце",
    rewards: ["Таинственный приз", "Бонусы", "Бесплатные уроки"],
    link: "/campaign/chinese-month",
  },
];

export const tasks = [
  { id: 1, title: "Учись 10 минут", points: 20, done: true },
  { id: 2, title: "Ответь на 5 вопросов", points: 30, done: false },
  { id: 3, title: "Поделись в VK", points: 10, done: false },
];

export const leaderboard = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Игрок ${i + 1}`,
  points: 1200 - i * 75,
}));
