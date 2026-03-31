// localStorage-based data layer for antk MVP prototype

const genId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

// Types
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
  build_stage: 'Ideation' | 'Building' | 'Deployment' | 'Iteration';
  status: 'active' | 'done';
  created_at: string;
  last_session_date: string | null;
  total_sessions: number;
}

export interface Session {
  id: string;
  project_id: string;
  user_id: string;
  goal: string;
  time_block: number | null; // minutes
  status: 'active' | 'complete' | 'abandoned';
  started_at: string;
  ended_at: string | null;
  bounty_uuid: string | null;
  bounty_active: boolean;
  tab_deductions: number; // track per-session deductions
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
  type: 'tab' | 'idle' | 'posture';
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
  scheduledInterval: number; // minutes
  idleThreshold: number; // minutes
  /** Webcam posture / “doomscroll” defense during active sessions */
  doomscrollDefenseEnabled: boolean;
}

// Storage keys
const KEYS = {
  users: 'antk_users',
  projects: 'antk_projects',
  sessions: 'antk_sessions',
  allowlist: 'antk_allowlist',
  violations: 'antk_violations',
  reflections: 'antk_reflections',
  bountyEvents: 'antk_bounty_events',
};

function getList<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function setList<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ============ USERS ============
export function getUsers(): User[] {
  return getList<User>(KEYS.users);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function createUser(name: string, id?: string): User {
  const users = getUsers();
  const user: User = {
    id: id || genId(),
    name,
    points: 0,
    streak: 0,
    last_session_date: null,
    created_at: new Date().toISOString(),
  };
  users.push(user);
  setList(KEYS.users, users);
  localStorage.setItem('antk_user_id', user.id);
  return user;
}

export function ensureUser(id: string, name: string): User {
  const existing = getUserById(id);
  if (existing) return existing;
  return createUser(name, id);
}

export function updateUser(id: string, updates: Partial<User>) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    setList(KEYS.users, users);
  }
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem('antk_user_id');
}

export function getCurrentUser(): User | undefined {
  const id = getCurrentUserId();
  return id ? getUserById(id) : undefined;
}

export function getCoworker(): User | undefined {
  const myId = getCurrentUserId();
  return getUsers().find(u => u.id !== myId);
}

// ============ PROJECTS ============
export function getProjects(): Project[] {
  return getList<Project>(KEYS.projects);
}

export function getUserProjects(userId: string): Project[] {
  return getProjects().filter(p => p.user_id === userId);
}

export function getActiveProjects(userId: string): Project[] {
  return getUserProjects(userId)
    .filter(p => p.status === 'active')
    .sort((a, b) => {
      const da = a.last_session_date || a.created_at;
      const db = b.last_session_date || b.created_at;
      return new Date(db).getTime() - new Date(da).getTime();
    });
}

export function getDoneProjects(userId: string): Project[] {
  return getUserProjects(userId).filter(p => p.status === 'done');
}

export function getProjectById(id: string): Project | undefined {
  return getProjects().find(p => p.id === id);
}

export function createProject(userId: string, name: string, buildStage: Project['build_stage'] = 'Ideation'): Project {
  const projects = getProjects();
  const project: Project = {
    id: genId(),
    user_id: userId,
    name,
    build_stage: buildStage,
    status: 'active',
    created_at: new Date().toISOString(),
    last_session_date: null,
    total_sessions: 0,
  };
  projects.push(project);
  setList(KEYS.projects, projects);
  return project;
}

export function updateProject(id: string, updates: Partial<Project>) {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx !== -1) {
    projects[idx] = { ...projects[idx], ...updates };
    setList(KEYS.projects, projects);
  }
}

// ============ SESSIONS ============
export function getSessions(): Session[] {
  return getList<Session>(KEYS.sessions);
}

export function getSessionById(id: string): Session | undefined {
  return getSessions().find(s => s.id === id);
}

export function getSessionByBountyUuid(uuid: string): Session | undefined {
  return getSessions().find(s => s.bounty_uuid === uuid);
}

export function getActiveSession(userId: string): Session | undefined {
  return getSessions().find(s => s.user_id === userId && s.status === 'active');
}

export function getProjectSessions(projectId: string): Session[] {
  return getSessions()
    .filter(s => s.project_id === projectId)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

export function createSession(data: {
  project_id: string;
  user_id: string;
  goal: string;
  time_block: number | null;
  bounty: boolean;
}): Session {
  const sessions = getSessions();
  const session: Session = {
    id: genId(),
    project_id: data.project_id,
    user_id: data.user_id,
    goal: data.goal,
    time_block: data.time_block,
    status: 'active',
    started_at: new Date().toISOString(),
    ended_at: null,
    bounty_uuid: data.bounty ? genId() : null,
    bounty_active: data.bounty,
    tab_deductions: 0,
  };
  sessions.push(session);
  setList(KEYS.sessions, sessions);
  localStorage.setItem('antk_active_session', session.id);
  return session;
}

export function endSession(sessionId: string) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx === -1) return;

  const session = sessions[idx];
  sessions[idx] = {
    ...session,
    status: 'complete',
    ended_at: new Date().toISOString(),
    bounty_active: false,
  };
  setList(KEYS.sessions, sessions);
  localStorage.removeItem('antk_active_session');

  // Update project
  updateProject(session.project_id, {
    last_session_date: new Date().toISOString(),
    total_sessions: (getProjectById(session.project_id)?.total_sessions || 0) + 1,
  });

  // Award points
  const user = getUserById(session.user_id);
  if (user) {
    let newPoints = user.points + 10;
    let newStreak = user.streak;
    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.last_session_date;

    if (!lastDate) {
      newStreak = 1;
    } else if (lastDate === today) {
      // no change
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastDate === yesterday) {
        newStreak = user.streak + 1;
      } else {
        newStreak = 1;
      }
    }

    updateUser(user.id, {
      points: newPoints,
      streak: newStreak,
      last_session_date: today,
    });
  }
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem('antk_active_session');
}

// ============ ALLOWLIST ============
export function getAllowlist(userId: string): AllowlistEntry[] {
  return getList<AllowlistEntry>(KEYS.allowlist).filter(a => a.user_id === userId);
}

export function addToAllowlist(userId: string, domain: string): AllowlistEntry {
  const list = getList<AllowlistEntry>(KEYS.allowlist);
  const existing = list.find(a => a.user_id === userId && a.domain === domain);
  if (existing) return existing;
  const entry: AllowlistEntry = {
    id: genId(),
    user_id: userId,
    domain,
    last_used_at: new Date().toISOString(),
  };
  list.push(entry);
  setList(KEYS.allowlist, list);
  return entry;
}

export function removeFromAllowlist(id: string) {
  const list = getList<AllowlistEntry>(KEYS.allowlist);
  setList(KEYS.allowlist, list.filter(a => a.id !== id));
}

// ============ VIOLATIONS ============
export function logViolation(sessionId: string, type: 'tab' | 'idle' | 'posture', url?: string) {
  const violations = getList<Violation>(KEYS.violations);
  violations.push({
    id: genId(),
    session_id: sessionId,
    type,
    offending_url: url,
    occurred_at: new Date().toISOString(),
  });
  setList(KEYS.violations, violations);

  // Deduct points for tab violations (cap at -15 per session)
  if (type === 'tab') {
    const sessions = getSessions();
    const sIdx = sessions.findIndex(s => s.id === sessionId);
    if (sIdx !== -1 && sessions[sIdx].tab_deductions < 15) {
      sessions[sIdx].tab_deductions += 5;
      setList(KEYS.sessions, sessions);
      const user = getUserById(sessions[sIdx].user_id);
      if (user) {
        updateUser(user.id, { points: Math.max(0, user.points - 5) });
      }
    }
  }
}

// ============ REFLECTIONS ============
export function getReflections(): Reflection[] {
  return getList<Reflection>(KEYS.reflections);
}

export function getReflectionBySessionId(sessionId: string): Reflection | undefined {
  return getReflections().find(r => r.session_id === sessionId);
}

export function createReflection(sessionId: string, data: {
  what_shipped: string;
  what_learned: string;
  what_blocked: string;
}): Reflection {
  const reflections = getReflections();
  const reflection: Reflection = {
    id: genId(),
    session_id: sessionId,
    ...data,
    created_at: new Date().toISOString(),
  };
  reflections.push(reflection);
  setList(KEYS.reflections, reflections);

  // Award +5 points
  const session = getSessionById(sessionId);
  if (session) {
    const user = getUserById(session.user_id);
    if (user) {
      updateUser(user.id, { points: user.points + 5 });
    }
  }
  return reflection;
}

// ============ BOUNTY EVENTS ============
export function getBountyEvents(): BountyEvent[] {
  return getList<BountyEvent>(KEYS.bountyEvents);
}

export function getBountyEventsForSession(sessionId: string): BountyEvent[] {
  return getBountyEvents().filter(e => e.session_id === sessionId);
}

export function createBountyEvent(sessionId: string): BountyEvent | null {
  // Only one catch per session
  if (getBountyEventsForSession(sessionId).length > 0) return null;
  const events = getBountyEvents();
  const event: BountyEvent = {
    id: genId(),
    session_id: sessionId,
    caught_at: new Date().toISOString(),
    checker_ip: 'local',
  };
  events.push(event);
  setList(KEYS.bountyEvents, events);

  // Penalty: streak reset, -15 points
  const session = getSessionById(sessionId);
  if (session) {
    const user = getUserById(session.user_id);
    if (user) {
      updateUser(user.id, {
        streak: 0,
        points: Math.max(0, user.points - 15),
      });
    }
  }
  return event;
}

// ============ SETTINGS ============
export function getSettings(userId: string): UserSettings {
  try {
    const raw = localStorage.getItem(`antk_settings_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    fuelEnabled: true,
    triggeredEnabled: true,
    scheduledEnabled: false,
    scheduledInterval: 30,
    idleThreshold: 5,
    doomscrollDefenseEnabled: true,
  };
}

export function saveSettings(userId: string, settings: UserSettings) {
  localStorage.setItem(`antk_settings_${userId}`, JSON.stringify(settings));
}

// ============ HELPERS ============
export function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function sessionDuration(session: Session): number {
  const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
  return end - new Date(session.started_at).getTime();
}

export function getTotalTimeForProject(projectId: string): number {
  return getProjectSessions(projectId).reduce((sum, s) => sum + sessionDuration(s), 0);
}
