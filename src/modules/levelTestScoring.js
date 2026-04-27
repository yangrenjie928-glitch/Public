const baseQuestions = [
  { id: 1, type: "single", category: "pinyin", question: "“吃”的拼音是：", options: ["ci", "chi", "qi"], answer: "chi" },
  { id: 2, type: "single", category: "pinyin", question: "“去”的拼音是：", options: ["qu", "chu", "cu"], answer: "qu" },
  { id: 3, type: "single", category: "pinyin", question: "“很”的拼音是：", options: ["heng", "hen", "han"], answer: "hen" },
  { id: 4, type: "single", category: "pinyin", question: "“四”的拼音是：", options: ["si", "shi", "xi"], answer: "si" },
  { id: 5, type: "single", category: "pinyin", question: "哪个是三声？", options: ["mā", "má", "mǎ"], answer: "mǎ" },

  { id: 6, type: "single", category: "vocab", question: "“老师”是什么意思？", options: ["学生", "教师", "医生"], answer: "教师" },
  { id: 7, type: "single", category: "vocab", question: "“贵”的意思是：", options: ["便宜", "漂亮", "价格高"], answer: "价格高" },
  { id: 8, type: "single", category: "vocab", question: "“昨天”指的是：", options: ["今天", "明天", "前一天"], answer: "前一天" },
  { id: 9, type: "single", category: "vocab", question: "“喝”通常和什么搭配？", options: ["饭", "水", "书"], answer: "水" },
  { id: 10, type: "single", category: "vocab", question: "“大”的反义词是：", options: ["高", "小", "多"], answer: "小" },

  { id: 11, type: "single", category: "grammar", question: "我昨天 ___ 北京。", options: ["去", "去了", "去过"], answer: "去了" },
  { id: 12, type: "single", category: "grammar", question: "他会 ___ 中文。", options: ["说", "看", "听"], answer: "说" },
  { id: 13, type: "single", category: "grammar", question: "我有三 ___ 书。", options: ["个", "本", "条"], answer: "本" },
  { id: 14, type: "single", category: "grammar", question: "我 ___ 他一本书。", options: ["给", "给了", "给过"], answer: "给" },
  { id: 15, type: "single", category: "grammar", question: "这个问题很 ___ 。", options: ["难", "难的", "很难的"], answer: "难" },

  {
    id: 16,
    type: "single",
    category: "order",
    question: "正确语序是：",
    options: ["我 明天 去 北京", "我 去 明天 北京", "明天 我 北京 去"],
    answer: "我 明天 去 北京",
  },
  { id: 17, type: "single", category: "order", question: "正确语序：", options: ["他 中文 学习", "他 学习 中文", "中文 他 学习"], answer: "他 学习 中文" },
  { id: 18, type: "single", category: "order", question: "正确语序：", options: ["我 很 喜欢 你", "我 喜欢 很 你", "喜欢 我 很 你"], answer: "我 很 喜欢 你" },

  {
    id: 19,
    type: "reading",
    category: "reading",
    question: "安娜是哪国人？",
    passage: "我叫安娜，我是俄罗斯人。我在大学学习中文。我每天学习两个小时。我喜欢中国文化，也喜欢中国菜。",
    options: ["中国", "俄罗斯", "日本"],
    answer: "俄罗斯",
  },
  {
    id: 20,
    type: "reading",
    category: "reading",
    question: "她每天学习多久？",
    passage: "我叫安娜，我是俄罗斯人。我在大学学习中文。我每天学习两个小时。我喜欢中国文化，也喜欢中国菜。",
    options: ["一个小时", "两个小时", "三个小时"],
    answer: "两个小时",
  },
  {
    id: 21,
    type: "multiple",
    category: "reading",
    question: "她喜欢什么？",
    passage: "我叫安娜，我是俄罗斯人。我在大学学习中文。我每天学习两个小时。我喜欢中国文化，也喜欢中国菜。",
    options: ["中文", "中国文化", "中国菜"],
    answer: ["中国文化", "中国菜"],
  },

  { id: 22, type: "text", category: "speaking", question: "用中文介绍你自己（不少于5个字）" },
  { id: 23, type: "text", category: "speaking", question: "写一句你每天做的事情" },
];

const cloneQuestions = (arr) => arr.map((q) => ({ ...q, options: q.options ? [...q.options] : undefined, answer: Array.isArray(q.answer) ? [...q.answer] : q.answer }));

const applyOverrides = (source, overrides) =>
  source.map((q) => {
    const patch = overrides[q.id];
    if (!patch) return q;
    return {
      ...q,
      ...patch,
      options: patch.options ? [...patch.options] : q.options ? [...q.options] : undefined,
      answer: Array.isArray(patch.answer)
        ? [...patch.answer]
        : patch.answer !== undefined
          ? patch.answer
          : Array.isArray(q.answer)
            ? [...q.answer]
            : q.answer,
    };
  });

const bankBOverrides = {
  1: { question: "“迟到”的拼音中“迟”是：", options: ["chi", "ci", "zhi"], answer: "chi" },
  5: { question: "哪个是四声？", options: ["mā", "má", "mà"], answer: "mà" },
  8: { question: "“刚才”最接近：", options: ["刚刚", "马上", "一直"], answer: "刚刚" },
  11: { question: "我昨天 ___ 这本书。", options: ["看", "看了", "看着"], answer: "看了" },
  14: { question: "我 ___ 你发了消息。", options: ["给", "给了", "给过"], answer: "给" },
  16: {
    question: "正确语序是：",
    options: ["他 昨天 在家 学习 中文", "他 学习 中文 昨天 在家", "昨天 在家 他 中文 学习"],
    answer: "他 昨天 在家 学习 中文",
  },
  18: {
    question: "正确语序：",
    options: ["我 真的 很 喜欢 汉语", "我 喜欢 真的 很 汉语", "真的 我 汉语 喜欢 很"],
    answer: "我 真的 很 喜欢 汉语",
  },
  19: {
    passage:
      "我叫安娜，我是俄罗斯人。我在大学学习中文。周末我去中文角练习口语。我最喜欢中国电影和川菜。",
    question: "安娜通常周末做什么？",
    options: ["看电影", "去中文角练习口语", "在家休息"],
    answer: "去中文角练习口语",
  },
  20: {
    question: "她最喜欢什么？",
    options: ["中国电影和川菜", "日本文化", "足球"],
    answer: "中国电影和川菜",
  },
  21: {
    question: "根据短文，她在做什么？",
    options: ["学习中文", "练习口语", "学习法语"],
    answer: ["学习中文", "练习口语"],
  },
};

const bankCOverrides = {
  2: { question: "“取得”的拼音中“取”是：", options: ["qu", "qv", "chu"], answer: "qu" },
  4: { question: "“是”和“四”中，哪个拼音是 si？", options: ["是", "四", "都不是"], answer: "四" },
  7: { question: "“性价比很高”最接近：", options: ["很贵", "很划算", "很便宜"], answer: "很划算" },
  10: { question: "“复杂”的反义词是：", options: ["简单", "困难", "重要"], answer: "简单" },
  12: { question: "他会 ___ 汉字，也会 ___ 新闻。", options: ["看 / 听", "说 / 听", "听 / 看"], answer: "看 / 听" },
  13: { question: "我买了两 ___ 葡萄酒。", options: ["瓶", "本", "条"], answer: "瓶" },
  15: { question: "这个解释听起来很 ___ 。", options: ["合理", "合理的", "很合理的"], answer: "合理" },
  17: {
    question: "正确语序：",
    options: ["他 下课后 在图书馆 复习", "他 在图书馆 下课后 复习", "下课后 复习 他 在图书馆"],
    answer: "他 下课后 在图书馆 复习",
  },
  19: {
    passage:
      "我叫安娜，我是俄罗斯人。我在大学学习中文。我每天早上背单词，晚上和中国朋友语音聊天。最近我在准备HSK考试。",
    question: "她最近在做什么？",
    options: ["准备HSK考试", "学习日语", "找工作"],
    answer: "准备HSK考试",
  },
  20: {
    question: "她晚上做什么？",
    options: ["看电视剧", "和中国朋友语音聊天", "跑步"],
    answer: "和中国朋友语音聊天",
  },
  21: {
    question: "短文中提到的学习方式有：",
    options: ["背单词", "语音聊天", "写小说"],
    answer: ["背单词", "语音聊天"],
  },
  22: { question: "用中文介绍你最近一次学习计划（不少于5个字）" },
  23: { question: "写一句你今天必须完成的中文任务" },
};

export const questionBanks = {
  A: cloneQuestions(baseQuestions),
  B: applyOverrides(cloneQuestions(baseQuestions), bankBOverrides),
  C: applyOverrides(cloneQuestions(baseQuestions), bankCOverrides),
};

const weights = { pinyin: 10, vocab: 15, grammar: 25, order: 15, reading: 20, speaking: 15 };
const maxima = { pinyin: 5, vocab: 5, grammar: 5, order: 3, reading: 3 };

const toRounded = (value) => Math.round(value * 10) / 10;
const HISTORY_KEY = "level-test-history";
const SAMPLE_SIZE = 23;

const isMultipleMatch = (picked, answer) => {
  if (!Array.isArray(picked) || !Array.isArray(answer)) return false;
  const a = [...picked].sort();
  const b = [...answer].sort();
  if (a.length !== b.length) return false;
  return a.every((item, idx) => item === b[idx]);
};

const speakingAiScore = (text = "") => {
  const clean = text.trim();
  if (!clean) return 0;
  const hasChinese = /[\u4e00-\u9fff]/.test(clean);
  const len = clean.length;
  let score = 1;
  if (hasChinese) score += 1;
  if (len >= 5) score += 1;
  if (len >= 10) score += 1;
  if (/[，。！？,.!?]/.test(clean)) score += 1;
  return Math.min(5, score);
};

export function getLevel(score) {
  if (score <= 30) return "A0";
  if (score <= 50) return "A1";
  if (score <= 70) return "A2";
  if (score <= 85) return "B1";
  return "B2";
}

export function getFinalLevel(scores) {
  const values = Object.values(scores).sort((a, b) => a - b);
  const lowestTwoAvg = (values[0] + values[1]) / 2;
  return getLevel(lowestTwoAvg);
}

const difficultyFromHistory = (history = []) => {
  if (!history.length) return "A";
  const avg = history.reduce((s, item) => s + (item.total || 0), 0) / history.length;
  if (avg <= 50) return "A";
  if (avg <= 75) return "B";
  return "C";
};

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function getHistoricalResults() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getUserTierFromHistory() {
  const history = getHistoricalResults();
  return difficultyFromHistory(history);
}

export function generateQuestionSet() {
  const tier = getUserTierFromHistory();
  const bank = questionBanks[tier] || questionBanks.A;
  return {
    tier,
    questions: shuffle(bank).slice(0, SAMPLE_SIZE),
  };
}

export function calculateScore(answerMap, questionsSet = baseQuestions) {
  const correctRaw = { pinyin: 0, vocab: 0, grammar: 0, order: 0, reading: 0 };
  let speakingScore = 0;
  let speakingCount = 0;
  const wrongQuestionIds = [];

  questionsSet.forEach((q) => {
    const userAnswer = answerMap[q.id];
    if (q.category === "speaking") {
      speakingCount += 1;
      const base = (userAnswer?.trim()?.length || 0) >= 5 ? 2.5 : 0;
      const ai = speakingAiScore(userAnswer) * 1;
      speakingScore += base + ai;
      return;
    }

    if (q.type === "multiple") {
      if (isMultipleMatch(userAnswer, q.answer)) {
        correctRaw[q.category] += 1;
      } else {
        wrongQuestionIds.push(q.id);
      }
      return;
    }

    if (userAnswer === q.answer) {
      correctRaw[q.category] += 1;
    } else if (q.category !== "speaking") {
      wrongQuestionIds.push(q.id);
    }
  });

  const byDimension = {
    pinyin: toRounded((correctRaw.pinyin / maxima.pinyin) * weights.pinyin),
    vocab: toRounded((correctRaw.vocab / maxima.vocab) * weights.vocab),
    grammar: toRounded((correctRaw.grammar / maxima.grammar) * weights.grammar),
    order: toRounded((correctRaw.order / maxima.order) * weights.order),
    reading: toRounded((correctRaw.reading / maxima.reading) * weights.reading),
    speaking: toRounded(Math.min(weights.speaking, speakingScore)),
  };

  const total = toRounded(
    byDimension.pinyin +
      byDimension.vocab +
      byDimension.grammar +
      byDimension.order +
      byDimension.reading +
      byDimension.speaking,
  );

  const dimensionLevels = Object.fromEntries(
    Object.entries(byDimension).map(([k, v]) => [k, getLevel(v)]),
  );

  const weaknesses = diagnoseWeaknesses(byDimension, wrongQuestionIds);
  const userProfile = buildUserProfile(byDimension, weaknesses);

  return {
    total,
    byDimension,
    dimensionLevels,
    finalLevel: getFinalLevel(byDimension),
    correctCount:
      correctRaw.pinyin + correctRaw.vocab + correctRaw.grammar + correctRaw.order + correctRaw.reading,
    speakingAnswered: speakingCount,
    weaknesses,
    userProfile,
  };
}

function diagnoseWeaknesses(byDimension, wrongQuestionIds) {
  const tags = new Set();
  const ids = new Set(wrongQuestionIds);
  if ([1, 2, 3, 4, 5].some((id) => ids.has(id)) || byDimension.pinyin < 6) tags.add("zh/ch/sh 混淆");
  if ([11, 14].some((id) => ids.has(id)) || byDimension.grammar < 13) tags.add("了使用错误");
  if (ids.has(13) || byDimension.grammar < 12) tags.add("量词错误");
  if ([16, 17, 18].some((id) => ids.has(id)) || byDimension.order < 9) tags.add("语序问题");
  if (byDimension.speaking < 8) tags.add("输出能力低");
  return [...tags];
}

function buildUserProfile(byDimension, weaknesses) {
  const final = getFinalLevel(byDimension);
  let type = "balanced";
  if (byDimension.speaking <= Math.min(byDimension.pinyin, byDimension.vocab, byDimension.reading)) type = "output弱";
  else if (byDimension.reading <= Math.min(byDimension.speaking, byDimension.vocab)) type = "input弱";
  else if (byDimension.grammar <= Math.min(byDimension.order, byDimension.vocab)) type = "grammar弱";

  const recommendedCourses = [];
  if (weaknesses.includes("zh/ch/sh 混淆")) recommendedCourses.push("Фонетика и тоны: zh/ch/sh");
  if (weaknesses.includes("了使用错误")) recommendedCourses.push("Мини-курс по 了 в реальной речи");
  if (weaknesses.includes("量词错误")) recommendedCourses.push("Счётные слова и конструкции");
  if (weaknesses.includes("语序问题")) recommendedCourses.push("Порядок слов в китайском");
  if (weaknesses.includes("输出能力低")) recommendedCourses.push("Разговорный спринт с AI");
  if (!recommendedCourses.length) recommendedCourses.push("Базовый курс A1 для стабильного роста");

  return {
    level: final,
    type,
    weaknesses,
    recommendedCourses,
  };
}

export function saveTestResult(result) {
  const history = getHistoricalResults();
  history.push({
    total: result.total,
    finalLevel: result.finalLevel,
    createdAt: Date.now(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20)));
}

export function buildRecommendation(byDimension) {
  const sorted = Object.entries(byDimension).sort((a, b) => a[1] - b[1]);
  const weak = sorted[0]?.[0];
  const map = {
    pinyin: "Твоя зона роста — пиньинь. Рекомендуем тренажер произношения и тонов.",
    vocab: "Твоя зона роста — словарный запас. Рекомендуем базовый лексический курс.",
    grammar: "Твоя зона роста — грамматика. Рекомендуем изучить базовые конструкции.",
    order: "Твоя зона роста — порядок слов. Рекомендуем блок по структуре предложений.",
    reading: "Твоя зона роста — чтение. Рекомендуем короткие тексты и задания на понимание.",
    speaking: "Твоя зона роста — выражение мыслей. Рекомендуем разговорную практику с AI.",
  };
  return map[weak] || "Отличный старт! Продолжай практику ежедневно.";
}
