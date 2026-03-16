import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getSessions, getProjects, getProjectById, getReflectionBySessionId,
  formatDuration, sessionDuration, getCurrentUserId,
} from "@/lib/store";

type View = "project" | "chrono";

export default function BuilderLog() {
  const [view, setView] = useState<View>("project");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const userId = getCurrentUserId();

  const allSessions = getSessions()
    .filter(s => s.user_id === userId && s.status !== "active")
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  const projects = getProjects()
    .filter(p => p.user_id === userId)
    .sort((a, b) => {
      const da = a.last_session_date || a.created_at;
      const db = b.last_session_date || b.created_at;
      return new Date(db).getTime() - new Date(da).getTime();
    });

  const toggleProject = (id: string) => {
    const next = new Set(expandedProjects);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedProjects(next);
  };

  const toggleSession = (id: string) => {
    const next = new Set(expandedSessions);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedSessions(next);
  };

  const SessionRow = ({ s }: { s: typeof allSessions[0] }) => {
    const reflection = getReflectionBySessionId(s.id);
    const expanded = expandedSessions.has(s.id);
    const project = getProjectById(s.project_id);
    return (
      <div className="border-b border-muted-foreground/20">
        <button
          onClick={() => toggleSession(s.id)}
          className="w-full flex items-center justify-between py-2 px-2 hover:bg-surface text-left transition-colors duration-75"
        >
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground w-20">
              {new Date(s.started_at).toLocaleDateString()}
            </span>
            {view === "chrono" && project && (
              <span className="font-mono text-xs text-muted-foreground">{project.name} ·</span>
            )}
            <span className="font-mono text-xs text-foreground">{s.goal}</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {formatDuration(sessionDuration(s))}
          </span>
        </button>
        {expanded && (
          <div className="px-4 pb-3 pt-1">
            {reflection ? (
              <div className="flex flex-col gap-2">
                {reflection.what_shipped && (
                  <div>
                    <span className="font-display text-[8px] text-muted-foreground">SHIPPED: </span>
                    <span className="font-mono text-xs text-foreground">{reflection.what_shipped}</span>
                  </div>
                )}
                {reflection.what_learned && (
                  <div>
                    <span className="font-display text-[8px] text-muted-foreground">LEARNED: </span>
                    <span className="font-mono text-xs text-foreground">{reflection.what_learned}</span>
                  </div>
                )}
                {reflection.what_blocked && (
                  <div>
                    <span className="font-display text-[8px] text-muted-foreground">BLOCKED: </span>
                    <span className="font-mono text-xs text-foreground">{reflection.what_blocked}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">No reflection logged.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-foreground px-4 py-3">
        <Link to="/" className="font-display text-sm text-foreground tracking-wider">antk</Link>
        <Link to="/" className="font-mono text-xs text-muted-foreground hover:text-foreground">← DASHBOARD</Link>
      </nav>

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-sm text-foreground">BUILDER LOG</h1>
          <div className="flex gap-0">
            <button
              onClick={() => setView("project")}
              className={`border border-foreground px-3 py-1 font-display text-[8px] transition-colors duration-75 ${
                view === "project" ? "bg-foreground text-background" : "bg-background text-foreground"
              }`}
            >
              BY PROJECT
            </button>
            <button
              onClick={() => setView("chrono")}
              className={`border border-foreground px-3 py-1 font-display text-[8px] transition-colors duration-75 ${
                view === "chrono" ? "bg-foreground text-background" : "bg-background text-foreground"
              }`}
            >
              CHRONOLOGICAL
            </button>
          </div>
        </div>

        {view === "project" ? (
          <div className="flex flex-col gap-4">
            {projects.map((p) => {
              const pSessions = allSessions.filter(s => s.project_id === p.id);
              const totalTime = pSessions.reduce((sum, s) => sum + sessionDuration(s), 0);
              const isExpanded = expandedProjects.has(p.id);

              return (
                <div key={p.id} className="border border-foreground">
                  <button
                    onClick={() => toggleProject(p.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-surface text-left transition-colors duration-75"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground text-xs">{isExpanded ? "▼" : "▶"}</span>
                      <span className="font-mono text-foreground">{p.name}</span>
                      <span className="font-display text-[8px] text-muted-foreground uppercase">{p.build_stage}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-muted-foreground">{pSessions.length} sessions</span>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">{formatDuration(totalTime)}</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-foreground">
                      {pSessions.length > 0 ? (
                        pSessions.map(s => <SessionRow key={s.id} s={s} />)
                      ) : (
                        <p className="p-4 font-mono text-xs text-muted-foreground">No sessions yet.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {projects.length === 0 && (
              <p className="font-mono text-sm text-muted-foreground">No projects yet.</p>
            )}
          </div>
        ) : (
          <div className="border border-foreground">
            {allSessions.length > 0 ? (
              allSessions.map(s => <SessionRow key={s.id} s={s} />)
            ) : (
              <p className="p-4 font-mono text-xs text-muted-foreground">No sessions yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
