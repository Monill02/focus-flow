import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getSessionById, getProjectById, getUserById, getCurrentUserId, endSession,
  getCoworker, getActiveSession, getSettings, logViolation, formatDuration,
  getBountyEventsForSession,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import NudgeOverlay from "@/components/NudgeOverlay";
import FuelOverlay from "@/components/FuelOverlay";
import CaughtOverlay from "@/components/CaughtOverlay";

export default function Cockpit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const session = id ? getSessionById(id) : null;
  const project = session ? getProjectById(session.project_id) : null;
  const user = userId ? getUserById(userId) : null;
  const coworker = getCoworker();
  const coworkerSession = coworker ? getActiveSession(coworker.id) : null;

  const [elapsed, setElapsed] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  const [showFuel, setShowFuel] = useState(false);
  const [showCaught, setShowCaught] = useState(false);
  const [status, setStatus] = useState<"ACTIVE" | "IDLE">("ACTIVE");
  const lastActivityRef = useRef(Date.now());
  const [, setTick] = useState(0);

  // Redirect if no session
  useEffect(() => {
    if (!session || session.status !== "active") {
      navigate("/");
    }
  }, [session, navigate]);

  // Timer
  useEffect(() => {
    if (!session) return;
    const startTime = new Date(session.started_at).getTime();
    const timer = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  // Time block auto-end
  useEffect(() => {
    if (!session?.time_block) return;
    const endTime = new Date(session.started_at).getTime() + session.time_block * 60000;
    if (Date.now() >= endTime) {
      handleLockOut();
    }
  }, [elapsed]);

  // Idle detection
  useEffect(() => {
    if (!session || !userId) return;
    const settings = getSettings(userId);
    const threshold = settings.idleThreshold * 60 * 1000;

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      if (status === "IDLE") setStatus("ACTIVE");
    };
    window.addEventListener("mousemove", resetActivity);
    window.addEventListener("keydown", resetActivity);
    window.addEventListener("click", resetActivity);

    const idleCheck = setInterval(() => {
      if (Date.now() - lastActivityRef.current > threshold) {
        setStatus("IDLE");
        if (settings.triggeredEnabled && !showNudge && !showCaught) {
          logViolation(session.id, "idle");
          setShowNudge(true);
        }
      }
    }, 10000);

    return () => {
      clearInterval(idleCheck);
      window.removeEventListener("mousemove", resetActivity);
      window.removeEventListener("keydown", resetActivity);
      window.removeEventListener("click", resetActivity);
    };
  }, [session, userId, status, showNudge, showCaught]);

  // EXTENSION HOOK: tab violation events will be received here via WebSocket.

  // Check for bounty catches (poll in localStorage prototype)
  useEffect(() => {
    if (!session || !session.bounty_active) return;
    const checker = setInterval(() => {
      const events = getBountyEventsForSession(session.id);
      if (events.length > 0 && !showCaught) {
        setShowCaught(true);
      }
    }, 3000);
    return () => clearInterval(checker);
  }, [session, showCaught]);

  const handleLockOut = useCallback(() => {
    if (!session) return;
    endSession(session.id);
    navigate(`/session/${session.id}/reflect`);
  }, [session, navigate]);

  // Force re-read user data
  const refreshUser = () => setTick(t => t + 1);
  const currentUser = userId ? getUserById(userId) : null;

  if (!session || !project || !currentUser) return null;

  const remaining = session.time_block
    ? Math.max(0, session.time_block * 60000 - elapsed)
    : null;

  // Auto-end if time is up
  if (remaining !== null && remaining <= 0 && session.status === 'active') {
    handleLockOut();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-foreground px-4 py-3">
        <span className="font-mono text-sm text-foreground">{project.name}</span>
        <span className="font-display text-[8px] text-muted-foreground uppercase">{project.build_stage}</span>
      </div>

      {/* Main cockpit */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        {/* Goal */}
        <p className="font-mono text-sm text-muted-foreground text-center max-w-md">{session.goal}</p>

        {/* Timer */}
        <div className="text-center">
          <p className="font-display text-5xl text-foreground tabular-nums tracking-wider">
            {formatDuration(elapsed)}
          </p>
          {remaining !== null && (
            <p className="font-mono text-xs text-muted-foreground mt-2 tabular-nums">
              {formatDuration(remaining)} remaining
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8">
          <span className="font-display text-[10px] text-foreground tabular-nums">🔥 {currentUser.streak}</span>
          <span className="font-display text-[10px] text-foreground tabular-nums">{currentUser.points} PTS</span>
        </div>

        {/* Coworker status */}
        {coworker && (
          <div className="border border-foreground px-4 py-2 flex items-center gap-3">
            <span className="font-mono text-xs text-foreground">{coworker.name}</span>
            <span className={`font-display text-[8px] uppercase ${
              coworkerSession ? "text-foreground" : "text-muted-foreground"
            }`}>
              {coworkerSession ? "ACTIVE" : "IDLE"}
            </span>
          </div>
        )}

        {/* Action row */}
        <div className="flex w-full max-w-md gap-4">
          <Button
            variant="default"
            size="full"
            onClick={() => setShowFuel(true)}
            className="font-display text-[10px]"
          >
            FUEL
          </Button>
          <Button
            variant="default"
            size="full"
            onClick={handleLockOut}
            className="font-display text-[10px]"
          >
            LOCK OUT
          </Button>
        </div>
      </div>

      {/* Overlays */}
      {showNudge && (
        <NudgeOverlay
          onDismiss={() => {
            setShowNudge(false);
            lastActivityRef.current = Date.now();
            setStatus("ACTIVE");
          }}
        />
      )}
      {showFuel && <FuelOverlay onDismiss={() => setShowFuel(false)} />}
      {showCaught && (
        <CaughtOverlay
          onDismiss={() => {
            setShowCaught(false);
            refreshUser();
          }}
        />
      )}
    </div>
  );
}
