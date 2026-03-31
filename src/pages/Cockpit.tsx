import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getSessionById, getProjectById, getUserById, getCurrentUserId, endSession,
  getCoworker, getActiveSession, getSettings, logViolation, formatDuration,
  getBountyEventsForSession,
} from "@/lib/store";
import type { Session, Project, User, UserSettings } from "@/lib/store";
import { DoomcamSession, isDoomcamEnvEnabled } from "@/features/doomcam";
import { Button } from "@/components/ui/button";
import NudgeOverlay from "@/components/NudgeOverlay";
import FuelOverlay from "@/components/FuelOverlay";
import CaughtOverlay from "@/components/CaughtOverlay";
import ShiaOverlay from "@/components/ShiaOverlay";

export default function Cockpit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const [session, setSession] = useState<Session | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [coworker, setCoworker] = useState<User | null>(null);
  const [coworkerSession, setCoworkerSession] = useState<Session | null>(null);
  const [cockpitSettings, setCockpitSettings] = useState<UserSettings | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  const [showFuel, setShowFuel] = useState(false);
  const [showCaught, setShowCaught] = useState(false);
  const [showShia, setShowShia] = useState(false);
  const [nudgeHeadline, setNudgeHeadline] = useState<string | undefined>(undefined);
  const [doomBanner, setDoomBanner] = useState<string | null>(null);
  const [status, setStatus] = useState<"ACTIVE" | "IDLE">("ACTIVE");
  const lastActivityRef = useRef(Date.now());
  const overlaysRef = useRef({ nudge: false, caught: false, fuel: false, shia: false });

  overlaysRef.current = { nudge: showNudge, caught: showCaught, fuel: showFuel, shia: showShia };

  // Load session data
  useEffect(() => {
    if (!id || !userId) return;
    Promise.all([
      getSessionById(id),
      getUserById(userId),
      getCoworker(),
      getSettings(userId),
    ]).then(([sess, u, cw, settings]) => {
      if (!sess || sess.status !== "active") { navigate("/"); return; }
      setSession(sess);
      setCurrentUser(u ?? null);
      setCoworker(cw ?? null);
      setCockpitSettings(settings);
      getProjectById(sess.project_id).then(p => setProject(p ?? null));
      if (cw) getActiveSession(cw.id).then(cs => setCoworkerSession(cs ?? null));
    });
  }, [id, userId, navigate]);

  const loadUser = useCallback(async () => {
    if (userId) {
      const u = await getUserById(userId);
      setCurrentUser(u ?? null);
    }
  }, [userId]);

  const handleLockOut = useCallback(async () => {
    if (!session) return;
    await endSession(session.id);
    navigate(`/session/${session.id}/reflect`);
  }, [session, navigate]);

  const handlePostureBad = useCallback(async () => {
    if (!session || !cockpitSettings) return;
    if (!cockpitSettings.triggeredEnabled) return;
    const o = overlaysRef.current;
    if (o.nudge || o.caught || o.fuel || o.shia) return;
    await logViolation(session.id, "posture");
    setShowShia(true);
  }, [session, cockpitSettings]);

  // Timer
  useEffect(() => {
    if (!session) return;
    const startTime = new Date(session.started_at).getTime();
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(timer);
  }, [session]);

  // Time block auto-end
  useEffect(() => {
    if (!session?.time_block) return;
    const endTime = new Date(session.started_at).getTime() + session.time_block * 60000;
    if (Date.now() >= endTime) handleLockOut();
  }, [elapsed, session, handleLockOut]);

  // Idle detection
  useEffect(() => {
    if (!session || !cockpitSettings) return;
    const threshold = cockpitSettings.idleThreshold * 60 * 1000;

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      if (status === "IDLE") setStatus("ACTIVE");
    };
    window.addEventListener("mousemove", resetActivity);
    window.addEventListener("keydown", resetActivity);
    window.addEventListener("click", resetActivity);

    const idleCheck = setInterval(async () => {
      if (Date.now() - lastActivityRef.current > threshold) {
        setStatus("IDLE");
        if (cockpitSettings.triggeredEnabled && !showNudge && !showCaught) {
          await logViolation(session.id, "idle");
          setNudgeHeadline(undefined);
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
  }, [session, cockpitSettings, status, showNudge, showCaught]);

  // Bounty catch polling
  useEffect(() => {
    if (!session?.bounty_active) return;
    const checker = setInterval(async () => {
      const events = await getBountyEventsForSession(session.id);
      if (events.length > 0 && !showCaught) setShowCaught(true);
    }, 3000);
    return () => clearInterval(checker);
  }, [session, showCaught]);

  const doomcamEnvOn = isDoomcamEnvEnabled();

  if (!session || !project || !currentUser) return null;

  const remaining = session.time_block
    ? Math.max(0, session.time_block * 60000 - elapsed)
    : null;

  if (remaining !== null && remaining <= 0 && session.status === "active") {
    handleLockOut();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {cockpitSettings?.doomscrollDefenseEnabled && doomcamEnvOn && session.status === "active" && (
        <DoomcamSession
          active
          enabled={cockpitSettings.doomscrollDefenseEnabled}
          envEnabled={doomcamEnvOn}
          onPostureBad={handlePostureBad}
          onStatus={(s, detail) => {
            if (s === "denied") setDoomBanner("Posture defense off — camera permission denied.");
            else if (s === "unavailable") setDoomBanner("Posture defense off — camera not available.");
            else if (s === "error") setDoomBanner(detail ?? "Posture defense failed to start.");
            else setDoomBanner(null);
          }}
        />
      )}

      {doomBanner && (
        <div className="border-b border-accent px-4 py-2 text-center font-mono text-[10px] text-foreground">
          {doomBanner}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-foreground px-4 py-3">
        <span className="font-mono text-sm text-foreground">{project.name}</span>
        <span className="font-display text-[8px] text-muted-foreground uppercase">{project.build_stage}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <p className="font-mono text-sm text-muted-foreground text-center max-w-md">{session.goal}</p>

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

        <div className="flex items-center gap-8">
          <span className="font-display text-[10px] text-foreground tabular-nums">🔥 {currentUser.streak}</span>
          <span className="font-display text-[10px] text-foreground tabular-nums">{currentUser.points} PTS</span>
        </div>

        {coworker && (
          <div className="border border-foreground px-4 py-2 flex items-center gap-3">
            <span className="font-mono text-xs text-foreground">{coworker.name}</span>
            <span className={`font-display text-[8px] uppercase ${coworkerSession ? "text-foreground" : "text-muted-foreground"}`}>
              {coworkerSession ? "ACTIVE" : "IDLE"}
            </span>
          </div>
        )}

        <div className="flex w-full max-w-md gap-4">
          <Button variant="default" size="full" onClick={() => setShowFuel(true)} className="font-display text-[10px]">
            FUEL
          </Button>
          <Button variant="default" size="full" onClick={handleLockOut} className="font-display text-[10px]">
            LOCK OUT
          </Button>
        </div>
      </div>

      {showNudge && (
        <NudgeOverlay
          headline={nudgeHeadline}
          onDismiss={() => {
            setShowNudge(false);
            setNudgeHeadline(undefined);
            lastActivityRef.current = Date.now();
            setStatus("ACTIVE");
          }}
        />
      )}
      {showFuel && <FuelOverlay onDismiss={() => setShowFuel(false)} />}
      {showCaught && (
        <CaughtOverlay onDismiss={() => { setShowCaught(false); loadUser(); }} />
      )}
      {showShia && <ShiaOverlay onDismiss={() => setShowShia(false)} />}
    </div>
  );
}
