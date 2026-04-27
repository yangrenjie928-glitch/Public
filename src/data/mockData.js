import animeSpring from "../assets/events/anime-spring.svg";
import animeSpeak from "../assets/events/anime-speak.svg";
import animeWinter from "../assets/events/anime-winter.svg";
import courseBasic from "../assets/courses/anime-course-basic.svg";
import courseBusiness from "../assets/courses/anime-course-business.svg";
import courseTravel from "../assets/courses/anime-course-travel.svg";

export const courses = [
  {
    id: 1,
    image: courseBasic,
    titleRu: "Базовый китайский",
    titleZh: "基础汉语",
    tags: ["HSK1", "Разговорный"],
    progress: 35,
    level: "A1",
    type: "Разговорный",
  },
  {
    id: 2,
    image: courseBusiness,
    titleRu: "Китайский для работы",
    titleZh: "商务汉语",
    tags: ["HSK2", "Бизнес"],
    progress: 62,
    level: "A2",
    type: "Бизнес",
  },
  {
    id: 3,
    image: courseTravel,
    titleRu: "Путешествие по Китаю",
    titleZh: "旅行汉语",
    tags: ["HSK1", "Разговорный"],
    progress: 18,
    level: "HSK",
    type: "Разговорный",
  },
];

/** Бесплатный пробный урок — всегда показывается в каталоге (вне фильтров). */
export const trialLesson = {
  id: "trial-free",
  image: courseBasic,
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
  {
    id: "spring-hsk",
    title: "Весенний HSK Челлендж",
    image: animeSpring,
    status: "Активные",
    countdown: "2 дня 14 часов",
    rewards: ["₽100", "Бесплатный урок", "ТОП бонус"],
  },
  {
    id: "speak-7-days",
    title: "Говори за 7 дней",
    image: animeSpeak,
    status: "Активные",
    countdown: "5 дней 02 часа",
    rewards: ["₽100", "Бесплатный урок"],
  },
  {
    id: "winter-race",
    title: "Зимняя гонка",
    image: animeWinter,
    status: "Завершённые",
    countdown: "Завершено",
    rewards: ["Сертификат"],
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
