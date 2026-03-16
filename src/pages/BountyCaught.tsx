import { useParams } from "react-router-dom";

export default function BountyCaught() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6">
      <span className="font-display text-sm text-foreground tracking-wider">antk</span>
      <h1 className="font-display text-2xl text-accent">CAUGHT.</h1>
      <p className="font-mono text-sm text-muted-foreground">They've been notified.</p>
    </div>
  );
}
