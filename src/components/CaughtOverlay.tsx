import { Button } from "@/components/ui/button";

interface Props {
  onDismiss: () => void;
}

export default function CaughtOverlay({ onDismiss }: Props) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      style={{ border: '2px solid #FF00FF', margin: '8px' }}
    >
      <div className="flex flex-col items-center gap-8 p-8">
        <h1 className="font-display text-2xl text-foreground">YOU'VE BEEN CAUGHT.</h1>
        <p className="font-mono text-sm text-muted-foreground">GET BACK TO WORK.</p>
        <div className="flex flex-col items-center gap-2">
          <span className="font-display text-[10px] text-accent">STREAK RESET TO 0</span>
          <span className="font-display text-[10px] text-accent">−15 POINTS</span>
        </div>
        <Button variant="default" onClick={onDismiss} className="font-display text-[10px]">
          BACK TO WORK
        </Button>
      </div>
    </div>
  );
}
