import { getRandomMotivation } from "@/lib/motivation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Props {
  onDismiss: () => void;
}

export default function FuelOverlay({ onDismiss }: Props) {
  const [{ item }] = useState(() => getRandomMotivation());

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background border-2 border-foreground" style={{ margin: '8px' }}>
      <div className="flex flex-col items-center gap-8 p-8 max-w-[480px]">
        <img
          src={item.url}
          alt="fuel"
          className="w-full max-w-[400px] border border-foreground"
        />
        <p className="font-mono text-sm text-muted-foreground text-center">{item.caption}</p>
        <Button variant="lockin" onClick={onDismiss} className="font-display text-[10px]">
          LET'S GO.
        </Button>
      </div>
    </div>
  );
}
