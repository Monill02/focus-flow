import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getProjectById, getCurrentUserId, getActiveSession, getAllowlist,
  addToAllowlist, removeFromAllowlist, createSession,
} from "@/lib/store";
import type { Project, AllowlistEntry, Session } from "@/lib/store";
import { Button } from "@/components/ui/button";
import BountyLinkModal from "@/components/BountyLinkModal";

const TIME_OPTIONS = [
  { label: "30 MIN", value: 30 },
  { label: "1 HR", value: 60 },
  { label: "2 HRS", value: 120 },
  { label: "3 HRS", value: 180 },
  { label: "OPEN", value: null },
];

export default function SessionSetup() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const [project, setProject] = useState<Project | null>(null);
  const [existingSession, setExistingSession] = useState<Session | null>(null);
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [goal, setGoal] = useState("");
  const [timeBlock, setTimeBlock] = useState<number | null>(60);
  const [bounty, setBounty] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [showBountyModal, setShowBountyModal] = useState(false);
  const [createdSession, setCreatedSession] = useState<{ id: string; bounty_uuid: string | null } | null>(null);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    if (!projectId || !userId) { navigate("/"); return; }
    Promise.all([
      getProjectById(projectId),
      getActiveSession(userId),
      getAllowlist(userId),
    ]).then(([p, existing, list]) => {
      if (!p) { navigate("/"); return; }
      setProject(p);
      setExistingSession(existing ?? null);
      setAllowlist(list);
    });
  }, [projectId, userId, navigate]);

  if (!project || !userId) return null;

  const canLockIn = goal.trim() && allowlist.length > 0 && !existingSession;

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    const entry = await addToAllowlist(userId, newDomain.trim().toLowerCase());
    setAllowlist(prev => [...prev.filter(a => a.id !== entry.id), entry]);
    setNewDomain("");
  };

  const handleRemoveDomain = async (id: string) => {
    await removeFromAllowlist(id);
    setAllowlist(prev => prev.filter(a => a.id !== id));
  };

  const handleLockIn = async () => {
    if (!canLockIn || locking) return;
    setLocking(true);
    const session = await createSession({
      project_id: project.id,
      user_id: userId,
      goal: goal.trim(),
      time_block: timeBlock,
      bounty,
    });
    if (bounty && session.bounty_uuid) {
      setCreatedSession(session);
      setShowBountyModal(true);
    } else {
      navigate(`/session/${session.id}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex w-full max-w-[560px] flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <span className="font-mono text-lg text-foreground">{project.name}</span>
          <span className="font-display text-[8px] text-muted-foreground uppercase">{project.build_stage}</span>
        </div>

        {existingSession && (
          <p className="font-display text-[10px] text-accent">YOU'RE ALREADY LOCKED IN.</p>
        )}

        <div>
          <label className="font-display text-[10px] text-muted-foreground mb-2 block">WHAT ARE YOU SHIPPING TODAY?</label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={3}
            className="w-full border border-foreground bg-background p-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-none"
            placeholder="describe your goal..."
          />
        </div>

        <div>
          <label className="font-display text-[10px] text-muted-foreground mb-2 block">TIME BLOCK</label>
          <div className="flex gap-0">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setTimeBlock(opt.value)}
                className={`border border-foreground px-3 py-2 font-mono text-xs transition-colors duration-75 ${
                  timeBlock === opt.value ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-surface"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-display text-[10px] text-muted-foreground mb-2 block">ALLOWED URLS</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {allowlist.map((entry) => (
              <span key={entry.id} className="flex items-center gap-1 border border-foreground px-2 py-1 font-mono text-xs text-foreground">
                {entry.domain}
                <button onClick={() => handleRemoveDomain(entry.id)} className="text-muted-foreground hover:text-accent ml-1">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="add domain (e.g. github.com)"
              className="flex-1 border border-foreground bg-background p-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDomain())}
            />
            <Button variant="default" size="sm" onClick={handleAddDomain}>ADD</Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="font-display text-[10px] text-muted-foreground">SET BOUNTY</label>
          <button
            onClick={() => setBounty(!bounty)}
            className={`w-12 h-6 border border-foreground relative transition-colors duration-75 ${bounty ? "bg-accent" : "bg-background"}`}
          >
            <span className={`block w-4 h-4 border border-foreground bg-foreground absolute top-[3px] transition-all duration-75 ${bounty ? "left-[26px]" : "left-[3px]"}`} />
          </button>
        </div>

        <Button variant={canLockIn ? "lockin" : "lockinDisabled"} size="full" onClick={handleLockIn} disabled={!canLockIn || locking}>
          {locking ? "LOCKING IN..." : "LOCK IN"}
        </Button>

        <button onClick={() => navigate("/")} className="font-mono text-xs text-muted-foreground hover:text-foreground text-center">
          ← DASHBOARD
        </button>
      </div>

      {showBountyModal && createdSession && (
        <BountyLinkModal
          bountyUuid={createdSession.bounty_uuid!}
          sessionId={createdSession.id}
          onGo={() => navigate(`/session/${createdSession.id}`)}
        />
      )}
    </div>
  );
}
