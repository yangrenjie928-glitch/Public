const LEVEL_STEP_BASE_XP = 120;
const LEVEL_STEP_GROWTH_XP = 60;

const AVATAR_SPIRITS = ["🐼", "🐯", "🐲", "🦊", "🦁", "🐨", "🦄", "🦉", "🐙", "🦅", "🐺", "🐬"];
const LEVEL_CHENGYU = [
  "水滴石穿",
  "厚积薄发",
  "锲而不舍",
  "日拱一卒",
  "循序渐进",
  "破茧成蝶",
  "志在千里",
  "行稳致远",
  "勇往直前",
  "精益求精",
  "百折不挠",
  "乘风破浪",
];

const LEVEL_REWARD_TIERS = [
  { minLevel: 1, maxLevel: 4, text: "🎁 +1 мини-урок" },
  { minLevel: 5, maxLevel: 9, text: "🎟️ Буст XP x1.2 на 24 часа" },
  { minLevel: 10, maxLevel: 14, text: "💎 +200 к лимиту депозита" },
  { minLevel: 15, maxLevel: 24, text: "🚀 Экстра-практика с ИИ" },
  { minLevel: 25, maxLevel: 39, text: "🏅 Редкий титул профиля" },
  { minLevel: 40, maxLevel: Number.POSITIVE_INFINITY, text: "👑 Легендарный набор наград" },
];

function getStepXpForLevel(level) {
  if (level <= 1) return LEVEL_STEP_BASE_XP;
  return LEVEL_STEP_BASE_XP + (level - 1) * LEVEL_STEP_GROWTH_XP;
}

export function getXpToReachLevel(level) {
  if (level <= 1) return 0;
  const steps = level - 1;
  return Math.round((steps / 2) * (2 * LEVEL_STEP_BASE_XP + (steps - 1) * LEVEL_STEP_GROWTH_XP));
}

export function getLevelFromXp(totalXp) {
  const safeXp = Math.max(0, Number(totalXp) || 0);
  let level = 1;
  let consumedXp = 0;
  let stepXp = getStepXpForLevel(level);

  while (safeXp >= consumedXp + stepXp) {
    consumedXp += stepXp;
    level += 1;
    stepXp = getStepXpForLevel(level);
  }

  const xpIntoLevel = safeXp - consumedXp;
  const xpToNextLevel = stepXp;
  const progress = Math.min(100, Math.max(0, Math.round((xpIntoLevel / xpToNextLevel) * 100)));

  return {
    level,
    xpIntoLevel,
    xpToNextLevel,
    progress,
    currentLevelXpStart: consumedXp,
    nextLevelXpTarget: consumedXp + stepXp,
  };
}

export function getAvatarForLevel(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  return AVATAR_SPIRITS[(safeLevel - 1) % AVATAR_SPIRITS.length];
}

export function getChengyuForLevel(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  return LEVEL_CHENGYU[(safeLevel - 1) % LEVEL_CHENGYU.length];
}

export function getRewardForLevel(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  const reward = LEVEL_REWARD_TIERS.find((tier) => safeLevel >= tier.minLevel && safeLevel <= tier.maxLevel);
  return reward ? reward.text : "🎁 Бонус уровня";
}

export function getNextLevelRewardText(level) {
  return getRewardForLevel(Math.max(1, Number(level) || 1) + 1);
}
