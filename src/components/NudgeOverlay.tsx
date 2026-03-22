import { getRandomMotivation } from "@/lib/motivation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Props {
  onDismiss: () => void;
  /** Optional line above the GIF (e.g. posture / doomscroll). */
  headline?: string;
}

export default function NudgeOverlay({ onDismiss, headline }: Props) {
  const [{ item }] = useState(() => getRandomMotivation());

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      style={{ border: '2px solid #FF00FF', margin: '8px' }}
    >
      <div className="flex flex-col items-center gap-8 p-8 max-w-[480px]">
        {headline && (
          <p className="font-display text-sm text-accent text-center tracking-wider">{headline}</p>
        )}
        <img
          src={item.url}
          alt="motivation"
          className="w-full max-w-[400px] border border-foreground"
          style={{ imageRendering: 'auto' }}
        />
        <p className="font-mono text-sm text-muted-foreground text-center">{item.caption}</p>
        <Button variant="lockin" onClick={onDismiss} className="font-display text-[10px]">
          GET BACK IN.
        </Button>
      </div>
    </div>
  );
}
