import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getSessionByBountyUuid, getProjectById, getUserById, createBountyEvent, formatDuration } from "@/lib/store";
import type { Session, Project, User } from "@/lib/store";

export default function BountyView() {
  const { uuid } = useParams<{ uuid: string }>();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!uuid) { setSession(null); return; }
    getSessionByBountyUuid(uuid).then(sess => {
      setSession(sess ?? null);
      if (sess) {
        Promise.all([getProjectById(sess.project_id), getUserById(sess.user_id)]).then(([p, u]) => {
          setProject(p ?? null);
          setUser(u ?? null);
        });
        setElapsed(Date.now() - new Date(sess.started_at).getTime());
      }
    });
  }, [uuid]);

  // Poll for updates
  useEffect(() => {
    if (!session?.bounty_active) return;
    const i = setInterval(() => {
      setElapsed(Date.now() - new Date(session.started_at).getTime());
      // Re-fetch session to check status
      getSessionByBountyUuid(uuid!).then(sess => {
        if (sess) setSession(sess);
      });
    }, 30000);
    return () => clearInterval(i);
  }, [session, uuid]);

  if (session === undefined) return null;

  if (!session || !session.bounty_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="border border-foreground p-8">
          <p className="font-display text-sm text-foreground">BOUNTY EXPIRED.</p>
        </div>
      </div>
    );
  }

  const status = session.status === "active" ? "ACTIVE" : "DONE";

  const handleCatch = async () => {
    const result = await createBountyEvent(session.id);
    if (result) window.location.href = `/bounty/${uuid}/caught`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="px-4 py-3 border-b border-foreground">
        <span className="font-display text-sm text-foreground tracking-wider">antk</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
        <p className="font-mono text-2xl text-foreground">{user?.name || "Unknown"}</p>
        <p className="font-mono text-sm text-muted-foreground">{project?.name || ""}</p>
        <p className="font-mono text-sm text-muted-foreground italic">{session.goal}</p>

        <div className="border border-foreground px-4 py-2">
          <span className={`font-display text-[10px] uppercase ${status === "ACTIVE" ? "text-foreground" : "text-muted-foreground"}`}>
            {status}
          </span>
        </div>

        <p className="font-mono text-sm text-muted-foreground tabular-nums">
          Time in session: {formatDuration(elapsed)}
        </p>

        {status === "ACTIVE" ? (
          <button
            onClick={handleCatch}
            className="bg-accent px-8 py-3 font-display text-[10px] text-background border border-accent hover:shadow-accent-glow transition-all duration-75"
          >
            THEY'RE SLACKING
          </button>
        ) : (
          <div className="border border-foreground px-8 py-3 cursor-not-allowed">
            <span className="font-display text-[10px] text-muted-foreground">THEY'RE LOCKED IN</span>
          </div>
        )}
      </div>
    </div>
  );
}
