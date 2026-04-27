import { supabase } from "../lib/supabase";

export async function listUsers(search = "") {
  let query = supabase.from("users").select("id, username, email, level, exp, role, status, created_at").order("created_at", { ascending: false });
  if (search.trim()) {
    query = query.or(`username.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
  }
  return query;
}

export async function updateUser(id, payload) {
  return supabase.from("users").update(payload).eq("id", id).select("id, username, email, level, exp, role, status, created_at").single();
}

export async function listCourses() {
  return supabase.from("courses").select("*").order("sort_order", { ascending: true });
}

export async function upsertCourse(payload) {
  return supabase.from("courses").upsert(payload).select("*").single();
}

export async function listEvents() {
  return supabase.from("events").select("*").order("start_at", { ascending: false });
}

export async function upsertEvent(payload) {
  return supabase.from("events").upsert(payload).select("*").single();
}

export async function listQuestionBank(category = "") {
  let query = supabase.from("question_bank").select("*").order("updated_at", { ascending: false });
  if (category) {
    query = query.eq("category", category);
  }
  return query;
}

export async function upsertQuestion(payload) {
  return supabase.from("question_bank").upsert(payload).select("*").single();
}

export async function listOrders(status = "") {
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (status) {
    query = query.eq("status", status);
  }
  return query;
}

export async function updateOrder(id, payload) {
  return supabase.from("orders").update(payload).eq("id", id).select("*").single();
}

export async function funnelSummary(startDate, endDate) {
  let query = supabase.from("funnel_events").select("step_name, user_id, created_at");
  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate);
  const { data, error } = await query;
  if (error) return { data: null, error };

  const map = new Map();
  data.forEach((item) => {
    const key = item.step_name;
    const existing = map.get(key) ?? { step: key, users: new Set() };
    if (item.user_id) existing.users.add(item.user_id);
    map.set(key, existing);
  });

  const rows = Array.from(map.values()).map((item) => ({
    step: item.step,
    users: item.users.size
  }));

  rows.sort((a, b) => b.users - a.users);
  return { data: rows, error: null };
}
