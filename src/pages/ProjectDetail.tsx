import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectById, updateProject, getProjectSessions, formatDuration, sessionDuration } from "@/lib/store";
import type { Project, Session } from "@/lib/store";
import { Button } from "@/components/ui/button";

const BUILD_STAGES = ["Ideation", "Building", "Shipping", "Done"] as const;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [name, setName] = useState("");
  const [stage, setStage] = useState<typeof BUILD_STAGES[number]>("Ideation");

  useEffect(() => {
    if (!id) { navigate("/"); return; }
    Promise.all([getProjectById(id), getProjectSessions(id)]).then(([p, s]) => {
      if (!p) { navigate("/"); return; }
      setProject(p);
      setSessions(s);
      setName(p.name);
      setStage(p.build_stage);
    });
  }, [id, navigate]);

  if (!project) return null;

  const totalTime = sessions.reduce((sum, s) => sum + sessionDuration(s), 0);

  const handleSave = async () => {
    await updateProject(project.id, { name: name.trim(), build_stage: stage });
    navigate("/");
  };

  const handleMarkDone = async () => {
    await updateProject(project.id, { status: "done" });
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex w-full max-w-[480px] flex-col gap-6 p-8">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-foreground bg-background p-2 font-mono text-lg text-foreground focus:outline-none focus:border-accent"
        />

        <div>
          <label className="font-display text-[10px] text-muted-foreground mb-2 block">BUILD STAGE</label>
          <div className="flex gap-0">
            {BUILD_STAGES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={`border border-foreground px-3 py-2 font-mono text-xs transition-colors duration-75 ${
                  stage === s ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-surface"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-foreground p-4 flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="font-mono text-xs text-muted-foreground">Created</span>
            <span className="font-mono text-xs text-foreground">{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-xs text-muted-foreground">Sessions</span>
            <span className="font-mono text-xs text-foreground">{sessions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-xs text-muted-foreground">Total time</span>
            <span className="font-mono text-xs text-foreground tabular-nums">{formatDuration(totalTime)}</span>
          </div>
        </div>

        <Button variant="default" size="full" onClick={handleSave} className="font-display text-[10px]">
          SAVE CHANGES
        </Button>

        <Button variant="default" size="full" onClick={handleMarkDone} className="font-display text-[10px]">
          MARK AS DONE
        </Button>

        <button onClick={() => navigate("/")} className="font-mono text-xs text-muted-foreground hover:text-foreground text-center">
          ← DASHBOARD
        </button>
      </div>
    </div>
  );
}
