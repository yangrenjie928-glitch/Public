import { isSupabaseEnabled, supabase } from "../lib/supabase";
import { getOrCreateActiveGroup, joinRandomOpenStudyGroup } from "./appDataService";

export async function isGroupJoined(userId) {  if (!userId) return false;
  const { data, error } = await supabase.from("group_members").select("group_id").eq("user_id", userId).limit(1);
  if (error) return false;
  return Boolean(Array.isArray(data) && data[0]?.group_id);
}

export async function markGroupAsJoined(userId) {
  if (!userId) return { ok: false, error: "login_required" };
  const { error } = await getOrCreateActiveGroup(userId);
  if (error) return { ok: false, error: error.message || "join_failed" };
  return { ok: true };
}

export async function getJoinedGroupId(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.from("group_members").select("group_id").eq("user_id", userId).order("joined_at", { ascending: false }).limit(1);
  if (error) return null;
  return Array.isArray(data) ? (data[0]?.group_id ?? null) : null;
}

/** Случайный матч в открытую мини-группу с местами (мотивация совместного обучения). */
export async function joinRandomMotivationGroup(userId) {
  if (!userId) return { ok: false, error: "login_required" };
  if (!isSupabaseEnabled) return { ok: false, error: "supabase_disabled" };
  const { data, error } = await joinRandomOpenStudyGroup(userId);
  if (error) return { ok: false, error: error.message || "join_failed" };
  if (!data?.group_id) return { ok: false, error: "join_failed" };
  return { ok: true, groupId: data.group_id };
}
