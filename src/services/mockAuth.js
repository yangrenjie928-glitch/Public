/** Mock-only auth for demo UI. Replace with Supabase when ready. */
export const MOCK_USER_ID = "00000000-0000-4000-8000-000000000001";
const KEY_SESSION = "chinaCloudMockAuth.session";
const KEY_REMEMBER = "chinaCloudMockAuth.remember";

export async function mockDelay(ms = 550) {
  await new Promise((r) => setTimeout(r, ms));
}

export function readMockAuth() {
  try {
    const raw = sessionStorage.getItem(KEY_SESSION) || localStorage.getItem(KEY_REMEMBER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearMockAuth() {
  sessionStorage.removeItem(KEY_SESSION);
  localStorage.removeItem(KEY_REMEMBER);
  window.dispatchEvent(new CustomEvent("china-cloud-mock-auth-change"));
}

function writeMockAuth(payload, rememberMe) {
  sessionStorage.removeItem(KEY_SESSION);
  localStorage.removeItem(KEY_REMEMBER);
  const str = JSON.stringify(payload);
  if (rememberMe) localStorage.setItem(KEY_REMEMBER, str);
  else sessionStorage.setItem(KEY_SESSION, str);
  window.dispatchEvent(new CustomEvent("china-cloud-mock-auth-change"));
}

function buildProfile({ username, email, phone, avatar }) {
  const safeEmail = email?.trim() || (phone ? `user_${String(phone).replace(/\D/g, "")}@mock.local` : "guest@mock.local");
  return {
    id: MOCK_USER_ID,
    username: username || "Игрок",
    email: safeEmail,
    level: 1,
    exp: 0,
    role: "user",
    status: "active",
    login_days: 1,
    last_login_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
    subscription_status: "inactive",
    subscription_plan: null,
    subscription_current_period_end: null,
    subscription_cancel_at_period_end: false,
    phone: phone || null,
    avatar_emoji: avatar || "🐼",
  };
}

function buildUser({ username, email, phone, avatar }) {
  const safeEmail = email?.trim() || (phone ? `user_${String(phone).replace(/\D/g, "")}@mock.local` : "guest@mock.local");
  return {
    id: MOCK_USER_ID,
    email: safeEmail,
    phone: phone || undefined,
    app_metadata: { provider: "mock" },
    user_metadata: { username: username || "Игрок", avatar: avatar || "🐼" },
  };
}

export async function mockSendPhoneCode(phone) {
  await mockDelay(400);
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) {
    throw new Error("❌ Неверный номер");
  }
}

export async function mockPhoneLogin({ phone, code, rememberMe }) {
  await mockDelay(600);
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) throw new Error("❌ Неверный номер");
  if (!String(code || "").trim()) throw new Error("❌ Введи код из SMS");
  if (String(code).trim() !== "123456") throw new Error("❌ Неверный код");
  const username = `player_${digits.slice(-4)}`;
  const profile = buildProfile({ username, email: "", phone: `+7${digits}`, avatar: "🐼" });
  const user = buildUser({ username, email: profile.email, phone: profile.phone, avatar: "🐼" });
  writeMockAuth({ user, profile }, rememberMe);
}

export async function mockEmailLogin({ email, password, rememberMe }) {
  await mockDelay(650);
  const e = String(email || "").trim().toLowerCase();
  if (!e.includes("@")) throw new Error("❌ Неверный email");
  if (String(password || "").length < 4) throw new Error("❌ Неверный пароль");
  if (e === "bad@example.com") throw new Error("❌ Неверный пароль");
  const username = e.split("@")[0] || "player";
  const profile = buildProfile({ username, email: e, phone: null, avatar: "😎" });
  const user = buildUser({ username, email: e, phone: null, avatar: "😎" });
  writeMockAuth({ user, profile }, rememberMe);
}

export async function mockSocialLogin({ provider, rememberMe }) {
  await mockDelay(500);
  const username = provider === "vk" ? "VK_игрок" : "TG_игрок";
  const email = provider === "vk" ? "vk@mock.local" : "telegram@mock.local";
  const avatar = provider === "vk" ? "🎮" : "✈️";
  const profile = buildProfile({ username, email, phone: null, avatar });
  const user = buildUser({ username, email, phone: null, avatar });
  writeMockAuth({ user, profile }, rememberMe);
}

export async function mockRegisterPhone({ username, phone, code, password, confirmPassword, avatar, rememberMe }) {
  await mockDelay(700);
  if (String(password || "") !== String(confirmPassword || "")) throw new Error("❌ Пароли не совпадают");
  if (String(password || "").length < 4) throw new Error("❌ Слабый пароль");
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) throw new Error("❌ Неверный номер");
  if (String(code || "").trim() !== "123456") throw new Error("❌ Неверный код");
  const profile = buildProfile({
    username: username.trim(),
    email: "",
    phone: `+7${digits}`,
    avatar: avatar || "🐼",
  });
  const user = buildUser({
    username: username.trim(),
    email: profile.email,
    phone: profile.phone,
    avatar: avatar || "🐼",
  });
  writeMockAuth({ user, profile }, rememberMe);
}

export async function mockRegisterEmail({ username, email, password, confirmPassword, avatar, rememberMe }) {
  await mockDelay(700);
  if (String(password || "") !== String(confirmPassword || "")) throw new Error("❌ Пароли не совпадают");
  if (String(password || "").length < 4) throw new Error("❌ Слабый пароль");
  const e = String(email || "").trim().toLowerCase();
  if (!e.includes("@")) throw new Error("❌ Неверный email");
  const profile = buildProfile({
    username: username.trim(),
    email: e,
    phone: null,
    avatar: avatar || "🐉",
  });
  const user = buildUser({
    username: username.trim(),
    email: e,
    phone: null,
    avatar: avatar || "🐉",
  });
  writeMockAuth({ user, profile }, rememberMe);
}
