import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentUserId, getUserById, getActiveProjects, getDoneProjects,
  getCoworker, getActiveSession, timeAgo,
} from "@/lib/store";
import type { User, Project } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [coworker, setCoworker] = useState<User | null>(null);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [doneProjects, setDoneProjects] = useState<Project[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) { navigate("/onboard"); return; }
    Promise.all([
      getUserById(userId),
      getActiveProjects(userId),
      getDoneProjects(userId),
      getCoworker(),
      getActiveSession(userId),
    ]).then(([u, active, done, cw, activeSess]) => {
      if (!u) { navigate("/onboard"); return; }
      if (activeSess) { navigate(`/session/${activeSess.id}`); return; }
      setUser(u);
      setActiveProjects(active);
      setDoneProjects(done);
      setCoworker(cw ?? null);
    });
  }, [navigate, tick]);

  // Re-fetch periodically to update stats
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(i);
  }, []);

  if (!user) return null;

  const extActive = localStorage.getItem("antk_ext_active") === "true";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!extActive && (
        <div className="border-b border-foreground px-4 py-2 text-center font-mono text-xs text-foreground">
          INSTALL THE ANTK EXTENSION TO ENABLE DISTRACTION DEFENSE →
        </div>
      )}

      <nav className="flex items-center justify-between border-b border-foreground px-4 py-3">
        <Link to="/" className="font-display text-sm text-foreground tracking-wider">antk</Link>
        <div className="flex items-center gap-6">
          <Link to="/log" className="font-mono text-sm text-muted-foreground hover:text-foreground">LOG</Link>
          <Link to="/settings" className="font-mono text-sm text-muted-foreground hover:text-foreground">SETTINGS</Link>
          <div className="flex items-center gap-4">
            <span className="font-display text-[10px] text-foreground tabular-nums">🔥 {user.streak}</span>
            <span className="font-display text-[10px] text-foreground tabular-nums">{user.points} PTS</span>
          </div>
          <span className="font-mono text-sm text-muted-foreground">{user.name}</span>
        </div>
      </nav>

      <div className="flex-1 p-8">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {activeProjects.map((project) => (
            <div
              key={project.id}
              className="min-w-[300px] flex-shrink-0 border border-foreground p-4 flex flex-col gap-3 cursor-pointer hover:border-accent transition-colors duration-75"
              style={{ borderRadius: "4px" }}
            >
              <div className="flex items-start justify-between" onClick={() => navigate(`/projects/${project.id}`)}>
                <span className="font-mono text-lg text-foreground">{project.name}</span>
                <span className="font-display text-[8px] text-muted-foreground uppercase">{project.build_stage}</span>
              </div>
              <div className="flex flex-col gap-1" onClick={() => navigate(`/projects/${project.id}`)}>
                <span className="font-mono text-xs text-muted-foreground">
                  {project.last_session_date ? timeAgo(project.last_session_date) : "No sessions yet"}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {project.total_sessions} session{project.total_sessions !== 1 ? "s" : ""}
                </span>
              </div>
              <Button
                variant="lockin"
                size="full"
                onClick={(e) => { e.stopPropagation(); navigate(`/session/new?project=${project.id}`); }}
              >
                LOCK IN
              </Button>
            </div>
          ))}

          <div
            className="min-w-[300px] flex-shrink-0 border border-dashed border-muted-foreground p-4 flex items-center justify-center cursor-pointer hover:border-foreground transition-colors duration-75"
            onClick={() => navigate("/projects/new")}
          >
            <span className="font-mono text-4xl text-muted-foreground">+</span>
          </div>
        </div>

        {doneProjects.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowDone(!showDone)}
              className="font-display text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-75"
            >
              {showDone ? "▼" : "▶"} DONE PROJECTS ({doneProjects.length})
            </button>
            {showDone && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {doneProjects.map((project) => (
                  <div
                    key={project.id}
                    className="border border-muted-foreground p-4 opacity-50"
                    style={{ borderRadius: "4px" }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-lg text-muted-foreground">{project.name}</span>
                      <span className="font-display text-[8px] text-muted-foreground uppercase line-through">{project.build_stage}</span>
                    </div>
                    <Link to="/log" className="font-mono text-xs text-muted-foreground hover:text-foreground mt-2 block">
                      VIEW LOG
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {coworker && (
          <div className="mt-8 border-t border-muted-foreground pt-4">
            <span className="font-mono text-xs text-muted-foreground">
              {coworker.name} — 🔥 {coworker.streak} — {coworker.points} PTS
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
