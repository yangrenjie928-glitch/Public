import { supabase } from "../lib/supabase";
const PROFILE_SELECT =
  "id, username, email, level, exp, role, status, login_days, last_login_date, created_at, subscription_status, subscription_plan, subscription_current_period_end, subscription_cancel_at_period_end";

const COURSES_CACHE_KEY = "mandarinPlayCoursesCacheV1";
const COURSES_CACHE_MAX_AGE_MS = 2 * 60 * 1000;
const EVENTS_CACHE_KEY = "mandarinPlayEventsCacheV1";
const EVENTS_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

export function getMoscowDateKey(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Moscow",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch (_error) {
    return date.toISOString().slice(0, 10);
  }
}

export function readCoursesCatalogCache(maxAgeMs = COURSES_CACHE_MAX_AGE_MS) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COURSES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows) || !parsed.cachedAt) return null;
    if (Date.now() - Number(parsed.cachedAt) > maxAgeMs) return null;
    return parsed.rows;
  } catch (_error) {
    return null;
  }
}

export function writeCoursesCatalogCache(rows) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      COURSES_CACHE_KEY,
      JSON.stringify({
        cachedAt: Date.now(),
        rows: Array.isArray(rows) ? rows : [],
      }),
    );
  } catch (_error) {
    // ignore cache write failures
  }
}

export function readEventsCatalogCache(maxAgeMs = EVENTS_CACHE_MAX_AGE_MS) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(EVENTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows) || !parsed.cachedAt) return null;
    if (Date.now() - Number(parsed.cachedAt) > maxAgeMs) return null;
    return parsed.rows;
  } catch (_error) {
    return null;
  }
}

export function writeEventsCatalogCache(rows) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      EVENTS_CACHE_KEY,
      JSON.stringify({
        cachedAt: Date.now(),
        rows: Array.isArray(rows) ? rows : [],
      }),
    );
  } catch (_error) {
    // ignore cache write failures
  }
}

export function getMoscowMonthKey(date = new Date()) {
  return getMoscowDateKey(date).slice(0, 7);
}

function monthRange(monthKey) {
  const [yearRaw, monthRaw] = String(monthKey || "").split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    const now = getMoscowDateKey();
    return { from: `${now.slice(0, 7)}-01`, to: `${now.slice(0, 7)}-31` };
  }
  const from = `${yearRaw}-${monthRaw.padStart(2, "0")}-01`;
  const toDate = new Date(Date.UTC(year, month, 0));
  const to = `${yearRaw}-${monthRaw.padStart(2, "0")}-${String(toDate.getUTCDate()).padStart(2, "0")}`;
  return { from, to };
}

export async function fetchActiveTasks() {
  return supabase.from("tasks").select("id, title, points, sort_order").eq("is_active", true).order("sort_order", { ascending: true });
}

export async function fetchTaskClaimsForDate(userId, dateKey) {
  if (!userId) return { data: [], error: null };
  return supabase
    .from("user_task_claims")
    .select("task_id, claimed_for_date, points_awarded")
    .eq("user_id", userId)
    .eq("claimed_for_date", dateKey);
}

export async function claimTaskReward({ userId, taskId, points, currentExp, currentLevel }) {
  const dateKey = getMoscowDateKey();
  const { error: claimError } = await supabase.from("user_task_claims").insert({
    user_id: userId,
    task_id: taskId,
    points_awarded: points,
    claimed_for_date: dateKey,
  });
  if (claimError) return { data: null, error: claimError };

  const nextExp = Math.max(0, Number(currentExp || 0) + Number(points || 0));
  const { data: profileRows, error: profileError } = await supabase
    .from("users")
    .update({ exp: nextExp, level: currentLevel })
    .eq("id", userId)
    .select(PROFILE_SELECT)
    .limit(1);
  if (profileError) return { data: null, error: profileError };

  const profile = Array.isArray(profileRows) ? (profileRows[0] ?? null) : profileRows;
  if (!profile) return { data: null, error: new Error("Updated profile row not found.") };

  await supabase.from("experience_logs").insert({
    user_id: userId,
    delta_exp: Number(points || 0),
    balance_after: profile.exp,
    reason: "task_claim",
    source: "profile_dashboard",
    meta: { task_id: taskId, claimed_for_date: dateKey },
  });

  return { data: profile, error: null };
}

export async function fetchLeaderboard(limit = 10) {
  return supabase.from("weekly_rankings").select("user_id, username, points, rank").limit(limit);
}

export async function fetchMonthlyCheckins(userId, monthKey) {
  if (!userId) return { data: [], error: null };
  const { from, to } = monthRange(monthKey || getMoscowMonthKey());
  return supabase
    .from("user_checkins")
    .select("checkin_date")
    .eq("user_id", userId)
    .gte("checkin_date", from)
    .lte("checkin_date", to)
    .order("checkin_date", { ascending: true });
}

export async function insertDailyCheckin(userId, dateKey) {
  return supabase.from("user_checkins").insert({
    user_id: userId,
    checkin_date: dateKey,
    source: "profile_dashboard",
  });
}

export async function fetchCoursesCatalog() {
  return supabase
    .from("courses")
    .select("id, title, title_zh, subtitle, level, type, tags, sort_order, cover_url, progress_percent, banner_label, cta_label, status, price")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
}

export async function fetchCoursesCatalogWithCache(maxAgeMs = COURSES_CACHE_MAX_AGE_MS) {
  const cached = readCoursesCatalogCache(maxAgeMs);
  if (cached) return { data: cached, error: null, fromCache: true };
  const result = await fetchCoursesCatalog();
  if (!result.error) writeCoursesCatalogCache(result.data || []);
  return { ...result, fromCache: false };
}

export async function fetchEventsCatalog() {
  return supabase
    .from("events")
    .select("id, title, subtitle, cover_url, status, rewards, link, weekly_prize, start_at, end_at, meta")
    .in("status", ["Активные", "active", "published"])
    .order("start_at", { ascending: false, nullsFirst: false });
}

export async function fetchEventsCatalogWithCache(maxAgeMs = EVENTS_CACHE_MAX_AGE_MS) {
  const cached = readEventsCatalogCache(maxAgeMs);
  if (cached) return { data: cached, error: null, fromCache: true };
  const result = await fetchEventsCatalog();
  if (!result.error) writeEventsCatalogCache(result.data || []);
  return { ...result, fromCache: false };
}

export async function fetchEventById(eventId) {
  return supabase
    .from("events")
    .select("id, title, subtitle, cover_url, status, rewards, link, weekly_prize, start_at, end_at, meta")
    .eq("id", eventId)
    .limit(1);
}

export async function joinEvent(userId, eventId) {
  return supabase.from("event_participants").upsert({ user_id: userId, event_id: eventId }, { onConflict: "event_id,user_id" });
}

export async function fetchMyEventIds(userId) {
  if (!userId) return { data: [], error: null };
  const { data, error } = await supabase.from("event_participants").select("event_id").eq("user_id", userId);
  if (error) return { data: null, error };
  return { data: (data || []).map((row) => row.event_id).filter(Boolean), error: null };
}

export async function getOrCreateActiveGroup(userId) {
  const existing = await supabase.from("group_members").select("group_id, role").eq("user_id", userId).order("joined_at", { ascending: false }).limit(1);
  if (!existing.error && Array.isArray(existing.data) && existing.data[0]?.group_id) {
    return { data: existing.data[0], error: null };
  }

  const groupQuery = await supabase.from("study_groups").select("id, title, capacity, status").eq("status", "open").order("created_at", { ascending: true }).limit(1);
  let group = Array.isArray(groupQuery.data) ? (groupQuery.data[0] ?? null) : null;
  if (!group) {
    const created = await supabase
      .from("study_groups")
      .insert({ title: "Основная мини-группа", capacity: 6, status: "open", created_by: userId })
      .select("id, title, capacity, status")
      .limit(1);
    if (created.error) return { data: null, error: created.error };
    group = Array.isArray(created.data) ? (created.data[0] ?? null) : null;
  }
  if (!group) return { data: null, error: new Error("Unable to resolve group.") };

  const members = await supabase.from("group_members").select("id").eq("group_id", group.id);
  const isFirstMember = !members.error && Array.isArray(members.data) && members.data.length === 0;

  const joined = await supabase
    .from("group_members")
    .upsert({ group_id: group.id, user_id: userId, role: isFirstMember ? "leader" : "member" }, { onConflict: "group_id,user_id" })
    .select("group_id, role")
    .limit(1);
  if (joined.error) return { data: null, error: joined.error };
  const membership = Array.isArray(joined.data) ? (joined.data[0] ?? null) : null;
  return { data: membership, error: null };
}

function shuffleInPlace(rows) {
  const arr = Array.isArray(rows) ? [...rows] : [];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

/**
 * Подобрать открытую группу с местами случайным образом и записать пользователя (или вернуть текущее членство).
 */
export async function joinRandomOpenStudyGroup(userId) {
  const existingResult = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .limit(1);
  if (!existingResult.error && Array.isArray(existingResult.data) && existingResult.data[0]?.group_id) {
    return { data: existingResult.data[0], error: null };
  }

  const openGroupsResult = await supabase.from("study_groups").select("id, title, capacity, status").eq("status", "open");

  const createNewGroupMembership = async () => {
    const suffix = `${Date.now()}`.slice(-4);
    const created = await supabase
      .from("study_groups")
      .insert({ title: `Мотива-группа #${suffix}`, capacity: 6, status: "open", created_by: userId })
      .select("id, title, capacity, status")
      .limit(1);
    if (created.error) return { data: null, error: created.error };
    const newGroup = Array.isArray(created.data) ? (created.data[0] ?? null) : null;
    if (!newGroup?.id) return { data: null, error: new Error("Unable to create group.") };
    const joinedNew = await supabase
      .from("group_members")
      .upsert({ group_id: newGroup.id, user_id: userId, role: "leader" }, { onConflict: "group_id,user_id" })
      .select("group_id, role")
      .limit(1);
    if (joinedNew.error) return { data: null, error: joinedNew.error };
    const membership = Array.isArray(joinedNew.data) ? (joinedNew.data[0] ?? null) : null;
    return { data: membership, error: null };
  };

  if (openGroupsResult.error || !Array.isArray(openGroupsResult.data) || !openGroupsResult.data.length) {
    return createNewGroupMembership();
  }

  const ids = openGroupsResult.data.map((g) => g.id).filter(Boolean);
  const countRowsResult = ids.length ? await supabase.from("group_members").select("group_id").in("group_id", ids) : { data: [], error: null };
  const countsByGroup = {};
  for (const row of countRowsResult.data || []) {
    const gid = row?.group_id;
    if (!gid) continue;
    countsByGroup[gid] = (countsByGroup[gid] || 0) + 1;
  }

  const cap = (row) => {
    const n = Number(row?.capacity);
    return Number.isFinite(n) && n > 0 ? n : 6;
  };

  const joinable = openGroupsResult.data.filter((g) => (countsByGroup[g.id] || 0) < cap(g));
  const candidates = shuffleInPlace(joinable);
  let picked = candidates[0] || null;

  if (!picked) {
    return createNewGroupMembership();
  }

  const membersOnPicked = await supabase.from("group_members").select("id").eq("group_id", picked.id);
  const isFirstOnPicked = !membersOnPicked.error && Array.isArray(membersOnPicked.data) && membersOnPicked.data.length === 0;

  const joinedPick = await supabase
    .from("group_members")
    .upsert({ group_id: picked.id, user_id: userId, role: isFirstOnPicked ? "leader" : "member" }, { onConflict: "group_id,user_id" })
    .select("group_id, role")
    .limit(1);
  if (!joinedPick.error) {
    const membership = Array.isArray(joinedPick.data) ? (joinedPick.data[0] ?? null) : null;
    if (membership) return { data: membership, error: null };
  }

  return createNewGroupMembership();
}

export async function fetchGroupMembers(groupId) {
  const membersResult = await supabase
    .from("group_members")
    .select("id, role, user_id, joined_at")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });
  if (membersResult.error) return membersResult;

  const members = membersResult.data || [];
  const userIds = Array.from(new Set(members.map((member) => member.user_id).filter(Boolean)));
  if (!userIds.length) return { data: members, error: null };

  const usersResult = await supabase
    .from("users")
    .select("id, username, email, exp, level, login_days")
    .in("id", userIds);
  if (usersResult.error) return { data: members, error: usersResult.error };

  const userMap = new Map((usersResult.data || []).map((user) => [user.id, user]));
  return {
    data: members.map((member) => ({
      ...member,
      users: userMap.get(member.user_id) || null,
    })),
    error: null,
  };
}

export async function fetchGroupMessages(groupId) {
  const messagesResult = await supabase
    .from("group_messages")
    .select("id, group_id, user_id, message_text, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(120);
  if (messagesResult.error) return messagesResult;

  const messages = messagesResult.data || [];
  const userIds = Array.from(new Set(messages.map((message) => message.user_id).filter(Boolean)));
  if (!userIds.length) return { data: messages, error: null };

  const usersResult = await supabase.from("users").select("id, username, email").in("id", userIds);
  if (usersResult.error) return { data: messages, error: usersResult.error };

  const userMap = new Map((usersResult.data || []).map((user) => [user.id, user]));
  return {
    data: messages.map((message) => ({
      ...message,
      users: userMap.get(message.user_id) || null,
    })),
    error: null,
  };
}

export async function sendGroupMessage(groupId, userId, messageText) {
  return supabase
    .from("group_messages")
    .insert({ group_id: groupId, user_id: userId, message_text: messageText })
    .select("id, group_id, user_id, message_text, created_at")
    .limit(1);
}

export async function fetchGroupActivities(groupId) {
  return supabase
    .from("group_activities")
    .select("id, title, details, is_pinned, scheduled_at, created_at")
    .eq("group_id", groupId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function upsertGroupActivities(groupId, userId, activityTitles, pinnedTitle = "") {
  const normalized = (activityTitles || []).map((item) => String(item || "").trim()).filter(Boolean);
  const updates = normalized.map((title) => ({
    group_id: groupId,
    title,
    details: "",
    is_pinned: pinnedTitle === title,
    created_by: userId,
  }));

  const clearPinned = await supabase.from("group_activities").update({ is_pinned: false }).eq("group_id", groupId).eq("is_pinned", true);
  if (clearPinned.error) return { data: null, error: clearPinned.error };
  if (!updates.length) return { data: [], error: null };

  return supabase.from("group_activities").insert(updates).select("id, title, details, is_pinned, created_at");
}
