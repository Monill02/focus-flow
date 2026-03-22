import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

interface Props {
  onDismiss: () => void;
}

export default function ShiaOverlay({ onDismiss }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Autoplay with audio as soon as overlay mounts
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked — user interaction will trigger it
      });
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      style={{ border: '2px solid #FF00FF', margin: '8px' }}
    >
      <div className="flex flex-col items-center gap-8 p-8 w-full max-w-[720px]">
        <p
          className="font-display text-xs text-accent text-center tracking-wider"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          EYES UP. PHONE DOWN.
        </p>

        <video
          ref={videoRef}
          src="/just-do-it.mp4"
          className="w-full border-2 border-white"
          style={{ aspectRatio: '16/9' }}
          autoPlay
          playsInline
          controls={false}
          loop
        />

        <Button
          variant="lockin"
          onClick={onDismiss}
          className="font-display text-[10px]"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          I'M DOING IT.
        </Button>
      </div>
    </div>
  );
}