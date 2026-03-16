import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  bountyUuid: string;
  sessionId: string;
  onGo: () => void;
}

export default function BountyLinkModal({ bountyUuid, sessionId, onGo }: Props) {
  const [copied, setCopied] = useState(false);
  const bountyUrl = `${window.location.origin}/bounty/${bountyUuid}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bountyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 p-8 border border-foreground max-w-[480px] w-full mx-4">
        <h2 className="font-display text-sm text-foreground">YOUR BOUNTY IS LIVE</h2>

        <div className="w-full border border-foreground p-3 font-mono text-xs text-foreground break-all select-all">
          {bountyUrl}
        </div>

        <Button variant="default" onClick={handleCopy} className="font-display text-[10px]">
          {copied ? "COPIED ✓" : "COPY LINK"}
        </Button>

        <Button variant="lockin" onClick={onGo} className="font-display text-[10px]">
          I'VE SHARED IT → GO
        </Button>
      </div>
    </div>
  );
}
