import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSessionById, getProjectById, createReflection, formatDuration, sessionDuration } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function Reflection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = id ? getSessionById(id) : null;
  const project = session ? getProjectById(session.project_id) : null;

  const [whatShipped, setWhatShipped] = useState("");
  const [whatLearned, setWhatLearned] = useState("");
  const [whatBlocked, setWhatBlocked] = useState("");

  if (!session || !project) {
    navigate("/");
    return null;
  }

  const handleSave = () => {
    createReflection(session.id, {
      what_shipped: whatShipped,
      what_learned: whatLearned,
      what_blocked: whatBlocked,
    });
    navigate("/");
  };

  const duration = formatDuration(sessionDuration(session));
  const date = new Date(session.started_at).toLocaleDateString();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex w-full max-w-[560px] flex-col gap-6 p-8">
        {/* Header */}
        <div className="border-b border-foreground pb-4">
          <p className="font-mono text-lg text-foreground">{project.name}</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {date} · {duration}
          </p>
          <p className="font-mono text-sm text-muted-foreground mt-2">{session.goal}</p>
        </div>

        {/* Fields */}
        <div>
          <label className="font-display text-[10px] text-muted-foreground mb-2 block">WHAT I SHIPPED</label>
          <textarea
            value={whatShipped}
            onChange={(e) => setWhatShipped(e.target.value)}
            rows={3}
            className="w-full border border-foreground bg-background p-2 font-mono text-sm text-foreground focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <div>
          <label className="font-display text-[10px] text-muted-foreground mb-2 block">WHAT I LEARNED</label>
          <textarea
            value={whatLearned}
            onChange={(e) => setWhatLearned(e.target.value)}
            rows={3}
            className="w-full border border-foreground bg-background p-2 font-mono text-sm text-foreground focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <div>
          <label className="font-display text-[10px] text-muted-foreground mb-2 block">WHAT BLOCKED ME</label>
          <textarea
            value={whatBlocked}
            onChange={(e) => setWhatBlocked(e.target.value)}
            rows={3}
            className="w-full border border-foreground bg-background p-2 font-mono text-sm text-foreground focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <Button variant="default" size="full" onClick={handleSave} className="font-display text-[10px]">
          SAVE REFLECTION
        </Button>

        <button onClick={() => navigate("/")} className="font-mono text-xs text-muted-foreground hover:text-foreground text-center">
          skip
        </button>
      </div>
    </div>
  );
}
