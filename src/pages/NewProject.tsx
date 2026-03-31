import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject, getCurrentUserId } from "@/lib/store";
import { Button } from "@/components/ui/button";

const BUILD_STAGES = ["Ideation", "Building", "Deployment", "Iteration"] as const;

export default function NewProject() {
  const [name, setName] = useState("");
  const [stage, setStage] = useState<typeof BUILD_STAGES[number]>("Ideation");
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !userId) return;
    createProject(userId, name.trim(), stage);
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="flex w-full max-w-[480px] flex-col gap-6 p-8">
        <h1 className="font-display text-sm text-foreground">NEW PROJECT</h1>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          className="border border-foreground bg-background p-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
          autoFocus
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
                  stage === s
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-surface"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          variant="default"
          className="font-display text-[10px]"
          disabled={!name.trim()}
        >
          CREATE PROJECT
        </Button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          ← DASHBOARD
        </button>
      </form>
    </div>
  );
}