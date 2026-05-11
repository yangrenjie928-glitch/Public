const STORAGE_PREFIX = "mandarinPlayDepositSystem";

const defaultState = {
  depositLimit: 1200,
  activeDeposit: null,
  history: [],
};

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}:${userId || "guest"}`;
}

function readState(userId) {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    return {
      depositLimit: Number.isFinite(parsed.depositLimit) ? Math.max(0, parsed.depositLimit) : defaultState.depositLimit,
      activeDeposit: parsed.activeDeposit || null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch (_error) {
    return { ...defaultState };
  }
}

function writeState(userId, state) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
}

export function getDepositState(userId) {
  return readState(userId);
}

export function lockDeposit(userId, payload) {
  const state = readState(userId);
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Некорректная сумма депозита." };
  }
  if (amount > state.depositLimit) {
    return { ok: false, error: `Лимит депозита ${state.depositLimit}₽. Повышай лимит через награды.` };
  }
  if (state.activeDeposit) {
    return { ok: false, error: "У тебя уже есть активный депозит для другого курса." };
  }

  const nextState = {
    ...state,
    activeDeposit: {
      courseKey: payload.courseKey,
      amount,
      createdAt: new Date().toISOString(),
    },
  };
  writeState(userId, nextState);
  return { ok: true, state: nextState };
}

export function settleDepositByProgress(userId, progressPercent) {
  const state = readState(userId);
  if (!state.activeDeposit) {
    return { ok: false, error: "Нет активного депозита." };
  }

  const clampedProgress = Math.max(0, Math.min(100, Number(progressPercent) || 0));
  const refund = Math.round((state.activeDeposit.amount * clampedProgress) / 100);
  const deduction = state.activeDeposit.amount - refund;

  const settlement = {
    id: `settlement-${Date.now()}`,
    courseKey: state.activeDeposit.courseKey,
    amount: state.activeDeposit.amount,
    progressPercent: clampedProgress,
    refund,
    deduction,
    settledAt: new Date().toISOString(),
  };

  const nextState = {
    ...state,
    activeDeposit: null,
    history: [settlement, ...state.history].slice(0, 20),
  };
  writeState(userId, nextState);
  return { ok: true, settlement, state: nextState };
}

export function increaseDepositLimit(userId, delta, reason = "reward") {
  const state = readState(userId);
  const normalized = Number(delta);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return { ok: false, error: "Некорректный бонус лимита." };
  }

  const nextState = {
    ...state,
    depositLimit: state.depositLimit + normalized,
    history: [
      {
        id: `limit-${Date.now()}`,
        type: "limit_bonus",
        reason,
        delta: normalized,
        createdAt: new Date().toISOString(),
      },
      ...state.history,
    ].slice(0, 20),
  };

  writeState(userId, nextState);
  return { ok: true, state: nextState };
}
