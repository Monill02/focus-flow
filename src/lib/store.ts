import { supabase } from "@/lib/supabase";

const genId = (): string =>
  Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

// ============ TYPES ============
export interface User {
  id: string;
  name: string;
  points: number;
  streak: number;
  last_session_date: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  build_stage: "Ideation" | "Building" | "Shipping" | "Done";
  status: "active" | "done";
  created_at: string;
  last_session_date: string | null;
  total_sessions: number;
}

export interface Session {
  id: string;
  project_id: string;
  user_id: string;
  goal: string;
  time_block: number | null;
  status: "active" | "complete" | "abandoned";
  started_at: string;
  ended_at: string | null;
  bounty_uuid: string | null;
  bounty_active: boolean;
  tab_deductions: number;
}

export interface AllowlistEntry {
  id: string;
  user_id: string;
  domain: string;
  last_used_at: string;
}

export interface Violation {
  id: string;
  session_id: string;
  type: "tab" | "idle" | "posture";
  offending_url?: string;
  occurred_at: string;
}

export interface Reflection {
  id: string;
  session_id: string;
  what_shipped: string;
  what_learned: string;
  what_blocked: string;
  created_at: string;
}

export interface BountyEvent {
  id: string;
  session_id: string;
  caught_at: string;
  checker_ip: string;
}

export interface UserSettings {
  fuelEnabled: boolean;
  triggeredEnabled: boolean;
  scheduledEnabled: boolean;
  scheduledInterval: number;
  idleThreshold: number;
  doomscrollDefenseEnabled: boolean;
}

// ============ USERS ============
export async function getUserById(id: string): Promise<User | undefined> {
  const { data } = await supabase.from("antk_users").select("*").eq("id", id).single();
  return data ?? undefined;
}

export async function ensureUser(id: string, name: string): Promise<User> {
  const existing = await getUserById(id);
  if (existing) return existing;
  const user: User = {
    id,
    name,
    points: 0,
    streak: 0,
    last_session_date: null,
    created_at: new Date().toISOString(),
  };
  await supabase.from("antk_users").insert(user);
  return user;
}

export async function updateUser(id: string, updates: Partial<User>) {
  await supabase.from("antk_users").update(updates).eq("id", id);
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem("antk_user_id");
}

export async function getCurrentUser(): Promise<User | undefined> {
  const id = getCurrentUserId();
  return id ? getUserById(id) : undefined;
}

export async function getCoworker(): Promise<User | undefined> {
  const myId = getCurrentUserId();
  if (!myId) return undefined;
  const { data } = await supabase.from("antk_users").select("*").neq("id", myId).limit(1);
  return data?.[0] ?? undefined;
}

// ============ PROJECTS ============
export async function getUserProjects(userId: string): Promise<Project[]> {
  const { data } = await supabase.from("antk_projects").select("*").eq("user_id", userId);
  return data ?? [];
}

export async function getActiveProjects(userId: string): Promise<Project[]> {
  const { data } = await supabase
    .from("antk_projects")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");
  if (!data) return [];
  return data.sort((a, b) => {
    const da = a.last_session_date || a.created_at;
    const db = b.last_session_date || b.created_at;
    return new Date(db).getTime() - new Date(da).getTime();
  });
}

export async function getDoneProjects(userId: string): Promise<Project[]> {
  const { data } = await supabase
    .from("antk_projects")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "done");
  return data ?? [];
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const { data } = await supabase.from("antk_projects").select("*").eq("id", id).single();
  return data ?? undefined;
}

export async function createProject(
  userId: string,
  name: string,
  buildStage: Project["build_stage"] = "Ideation",
): Promise<Project> {
  const project: Project = {
    id: genId(),
    user_id: userId,
    name,
    build_stage: buildStage,
    status: "active",
    created_at: new Date().toISOString(),
    last_session_date: null,
    total_sessions: 0,
  };
  await supabase.from("antk_projects").insert(project);
  return project;
}

export async function updateProject(id: string, updates: Partial<Project>) {
  await supabase.from("antk_projects").update(updates).eq("id", id);
}

// ============ SESSIONS ============
export async function getSessionById(id: string): Promise<Session | undefined> {
  const { data } = await supabase.from("antk_sessions").select("*").eq("id", id).single();
  return data ?? undefined;
}

export async function getSessionByBountyUuid(uuid: string): Promise<Session | undefined> {
  const { data } = await supabase
    .from("antk_sessions")
    .select("*")
    .eq("bounty_uuid", uuid)
    .single();
  return data ?? undefined;
}

export async function getActiveSession(userId: string): Promise<Session | undefined> {
  const { data } = await supabase
    .from("antk_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);
  return data?.[0] ?? undefined;
}

export async function getProjectSessions(projectId: string): Promise<Session[]> {
  const { data } = await supabase
    .from("antk_sessions")
    .select("*")
    .eq("project_id", projectId)
    .order("started_at", { ascending: false });
  return data ?? [];
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  const { data } = await supabase
    .from("antk_sessions")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "active")
    .order("started_at", { ascending: false });
  return data ?? [];
}

export async function createSession(data: {
  project_id: string;
  user_id: string;
  goal: string;
  time_block: number | null;
  bounty: boolean;
}): Promise<Session> {
  const session: Session = {
    id: genId(),
    project_id: data.project_id,
    user_id: data.user_id,
    goal: data.goal,
    time_block: data.time_block,
    status: "active",
    started_at: new Date().toISOString(),
    ended_at: null,
    bounty_uuid: data.bounty ? genId() : null,
    bounty_active: data.bounty,
    tab_deductions: 0,
  };
  await supabase.from("antk_sessions").insert(session);
  localStorage.setItem("antk_active_session", session.id);
  return session;
}

export async function endSession(sessionId: string) {
  const session = await getSessionById(sessionId);
  if (!session) return;

  await supabase
    .from("antk_sessions")
    .update({ status: "complete", ended_at: new Date().toISOString(), bounty_active: false })
    .eq("id", sessionId);

  localStorage.removeItem("antk_active_session");

  const project = await getProjectById(session.project_id);
  if (project) {
    await updateProject(session.project_id, {
      last_session_date: new Date().toISOString(),
      total_sessions: project.total_sessions + 1,
    });
  }

  const user = await getUserById(session.user_id);
  if (user) {
    const today = new Date().toISOString().split("T")[0];
    const lastDate = user.last_session_date;
    let newStreak = user.streak;
    if (!lastDate) {
      newStreak = 1;
    } else if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      newStreak = lastDate === yesterday ? user.streak + 1 : 1;
    }
    await updateUser(user.id, { points: user.points + 10, streak: newStreak, last_session_date: today });
  }
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem("antk_active_session");
}

// ============ ALLOWLIST ============
export async function getAllowlist(userId: string): Promise<AllowlistEntry[]> {
  const { data } = await supabase.from("antk_allowlist").select("*").eq("user_id", userId);
  return data ?? [];
}

export async function addToAllowlist(userId: string, domain: string): Promise<AllowlistEntry> {
  const { data: existing } = await supabase
    .from("antk_allowlist")
    .select("*")
    .eq("user_id", userId)
    .eq("domain", domain)
    .single();
  if (existing) return existing;
  const entry: AllowlistEntry = {
    id: genId(),
    user_id: userId,
    domain,
    last_used_at: new Date().toISOString(),
  };
  await supabase.from("antk_allowlist").insert(entry);
  return entry;
}

export async function removeFromAllowlist(id: string) {
  await supabase.from("antk_allowlist").delete().eq("id", id);
}

// ============ VIOLATIONS ============
export async function logViolation(sessionId: string, type: "tab" | "idle" | "posture", url?: string) {
  await supabase.from("antk_violations").insert({
    id: genId(),
    session_id: sessionId,
    type,
    offending_url: url,
    occurred_at: new Date().toISOString(),
  });

  if (type === "tab") {
    const session = await getSessionById(sessionId);
    if (session && session.tab_deductions < 15) {
      await supabase
        .from("antk_sessions")
        .update({ tab_deductions: session.tab_deductions + 5 })
        .eq("id", sessionId);
      const user = await getUserById(session.user_id);
      if (user) await updateUser(user.id, { points: Math.max(0, user.points - 5) });
    }
  }
}

// ============ REFLECTIONS ============
export async function getReflectionBySessionId(sessionId: string): Promise<Reflection | undefined> {
  const { data } = await supabase
    .from("antk_reflections")
    .select("*")
    .eq("session_id", sessionId)
    .single();
  return data ?? undefined;
}

export async function createReflection(
  sessionId: string,
  data: { what_shipped: string; what_learned: string; what_blocked: string },
): Promise<Reflection> {
  const reflection: Reflection = {
    id: genId(),
    session_id: sessionId,
    ...data,
    created_at: new Date().toISOString(),
  };
  await supabase.from("antk_reflections").insert(reflection);

  const session = await getSessionById(sessionId);
  if (session) {
    const user = await getUserById(session.user_id);
    if (user) await updateUser(user.id, { points: user.points + 5 });
  }
  return reflection;
}

// ============ BOUNTY EVENTS ============
export async function getBountyEventsForSession(sessionId: string): Promise<BountyEvent[]> {
  const { data } = await supabase
    .from("antk_bounty_events")
    .select("*")
    .eq("session_id", sessionId);
  return data ?? [];
}

export async function createBountyEvent(sessionId: string): Promise<BountyEvent | null> {
  const existing = await getBountyEventsForSession(sessionId);
  if (existing.length > 0) return null;

  const event: BountyEvent = {
    id: genId(),
    session_id: sessionId,
    caught_at: new Date().toISOString(),
    checker_ip: "remote",
  };
  await supabase.from("antk_bounty_events").insert(event);

  const session = await getSessionById(sessionId);
  if (session) {
    const user = await getUserById(session.user_id);
    if (user) await updateUser(user.id, { streak: 0, points: Math.max(0, user.points - 15) });
  }
  return event;
}

// ============ SETTINGS ============
const DEFAULT_SETTINGS: UserSettings = {
  fuelEnabled: true,
  triggeredEnabled: true,
  scheduledEnabled: false,
  scheduledInterval: 30,
  idleThreshold: 5,
  doomscrollDefenseEnabled: true,
};

export async function getSettings(userId: string): Promise<UserSettings> {
  const { data } = await supabase
    .from("antk_user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (!data) return DEFAULT_SETTINGS;
  return {
    fuelEnabled: data.fuel_enabled,
    triggeredEnabled: data.triggered_enabled,
    scheduledEnabled: data.scheduled_enabled,
    scheduledInterval: data.scheduled_interval,
    idleThreshold: data.idle_threshold,
    doomscrollDefenseEnabled: data.doomscroll_defense_enabled,
  };
}

export async function saveSettings(userId: string, settings: UserSettings) {
  await supabase.from("antk_user_settings").upsert(
    {
      user_id: userId,
      fuel_enabled: settings.fuelEnabled,
      triggered_enabled: settings.triggeredEnabled,
      scheduled_enabled: settings.scheduledEnabled,
      scheduled_interval: settings.scheduledInterval,
      idle_threshold: settings.idleThreshold,
      doomscroll_defense_enabled: settings.doomscrollDefenseEnabled,
    },
    { onConflict: "user_id" },
  );
}

// ============ HELPERS ============
export function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function sessionDuration(session: Session): number {
  const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
  return end - new Date(session.started_at).getTime();
}
