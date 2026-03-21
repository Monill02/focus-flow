import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  getCurrentUserId, getSettings, saveSettings, getAllowlist,
  addToAllowlist, removeFromAllowlist,
} from "@/lib/store";
import { Button } from "@/components/ui/button";

const IDLE_OPTIONS = [2, 5, 10, 15];
const SCHEDULE_OPTIONS = [15, 30, 60];

export default function Settings() {
  const { signOut } = useAuth();
  const userId = getCurrentUserId();
  const [settings, setSettingsState] = useState(() => getSettings(userId || ""));
  const [newDomain, setNewDomain] = useState("");
  const allowlist = userId ? getAllowlist(userId) : [];

  if (!userId) return null;

  const update = (partial: Partial<typeof settings>) => {
    const next = { ...settings, ...partial };
    setSettingsState(next);
    saveSettings(userId, next);
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    addToAllowlist(userId, newDomain.trim().toLowerCase());
    setNewDomain("");
  };

  const Toggle = ({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) => (
    <div className="flex items-center justify-between py-2">
      <span className="font-mono text-sm text-foreground">{label}</span>
      <button
        onClick={() => !disabled && onChange(!checked)}
        className={`w-12 h-6 border border-foreground relative transition-colors duration-75 ${checked ? "bg-accent" : "bg-background"} ${disabled ? "opacity-50" : ""}`}
      >
        <span className={`block w-4 h-4 border border-foreground bg-foreground absolute top-[3px] transition-all duration-75 ${checked ? "left-[26px]" : "left-[3px]"}`} />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <nav className="flex items-center justify-between border-b border-foreground px-4 py-3">
        <Link to="/" className="font-display text-sm text-foreground tracking-wider">antk</Link>
        <Link to="/" className="font-mono text-xs text-muted-foreground hover:text-foreground">← DASHBOARD</Link>
      </nav>

      <div className="flex-1 flex justify-center p-8">
        <div className="w-full max-w-[480px] flex flex-col gap-8">
          <h1 className="font-display text-sm text-foreground">SETTINGS</h1>
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await signOut();
              }}
            >
              SIGN OUT
            </Button>
          </div>

          {/* Motivation */}
          <div className="border border-foreground p-4 flex flex-col gap-2">
            <h2 className="font-display text-[10px] text-muted-foreground mb-2">MOTIVATION</h2>
            <Toggle
              checked={settings.fuelEnabled}
              onChange={(v) => update({ fuelEnabled: v })}
              label="On-demand (Fuel button)"
            />
            <Toggle
              checked={settings.triggeredEnabled}
              onChange={(v) => update({ triggeredEnabled: v })}
              label="Triggered (on idle)"
            />
            <Toggle
              checked={settings.scheduledEnabled}
              onChange={() => {}}
              label="Scheduled — COMING SOON"
              disabled
            />
            {settings.scheduledEnabled && (
              <div className="flex gap-0 mt-2">
                {SCHEDULE_OPTIONS.map(m => (
                  <button
                    key={m}
                    onClick={() => update({ scheduledInterval: m })}
                    className={`border border-foreground px-3 py-1 font-mono text-xs ${settings.scheduledInterval === m ? "bg-foreground text-background" : "bg-background text-foreground"}`}
                  >
                    {m} MIN
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Distraction Defense */}
          <div className="border border-foreground p-4">
            <h2 className="font-display text-[10px] text-muted-foreground mb-4">DISTRACTION DEFENSE</h2>
            <label className="font-mono text-xs text-muted-foreground mb-2 block">Idle threshold</label>
            <div className="flex gap-0">
              {IDLE_OPTIONS.map(m => (
                <button
                  key={m}
                  onClick={() => update({ idleThreshold: m })}
                  className={`border border-foreground px-3 py-2 font-mono text-xs transition-colors duration-75 ${settings.idleThreshold === m ? "bg-foreground text-background" : "bg-background text-foreground"}`}
                >
                  {m} MIN
                </button>
              ))}
            </div>
          </div>

          {/* URL Allowlist */}
          <div className="border border-foreground p-4">
            <h2 className="font-display text-[10px] text-muted-foreground mb-4">URL ALLOWLIST</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {allowlist.map(entry => (
                <span key={entry.id} className="flex items-center gap-1 border border-foreground px-2 py-1 font-mono text-xs text-foreground">
                  {entry.domain}
                  <button onClick={() => removeFromAllowlist(entry.id)} className="text-muted-foreground hover:text-accent ml-1">×</button>
                </span>
              ))}
              {allowlist.length === 0 && <span className="font-mono text-xs text-muted-foreground">No domains saved.</span>}
            </div>
            <div className="flex gap-2">
              <input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="add domain"
                className="flex-1 border border-foreground bg-background p-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDomain())}
              />
              <Button variant="default" size="sm" onClick={handleAddDomain}>ADD</Button>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground mt-3">Changes take effect on next session start.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
