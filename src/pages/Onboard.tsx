import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, getUsers } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function Onboard() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const users = getUsers();
  if (users.length >= 2) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="border border-foreground p-8 text-center">
          <p className="font-display text-sm text-foreground">THIS SPACE IS TAKEN.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("NAME REQUIRED.");
      return;
    }
    try {
      createUser(name.trim());
      navigate("/");
    } catch (err) {
      setError("SPACE IS FULL.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8 p-8">
        <h1 className="font-display text-2xl text-foreground tracking-wider">antk</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="what's your name?"
          className="w-full max-w-[320px] border border-foreground bg-background p-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
          autoFocus
        />
        {error && <p className="font-display text-[10px] text-accent">{error}</p>}
        <Button type="submit" variant="default" className="font-display text-[10px]">
          ENTER THE SPACE
        </Button>
      </form>
    </div>
  );
}
