import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function Onboard() {
  const { user, signIn, signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (user) {
    navigate("/");
    return null;
  }

  const validate = () => {
    if (!email.trim() || !password.trim()) {
      setError("EMAIL AND PASSWORD REQUIRED.");
      return false;
    }
    if (password.length < 6) {
      setError("PASSWORD MUST BE 6+ CHARACTERS.");
      return false;
    }
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    try {
      await signIn(email.trim(), password);
      navigate("/");
    } catch {
      setError("SIGN IN FAILED.");
    }
  };

  const handleSignUp = async () => {
    setError("");
    if (!validate()) return;
    if (!name.trim()) {
      setError("NAME REQUIRED FOR SIGN UP.");
      return;
    }
    try {
      await signUp(email.trim(), password);
      navigate("/");
    } catch {
      setError("SIGN UP FAILED.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form onSubmit={handleSignIn} className="flex w-full max-w-[360px] flex-col items-center gap-4 p-8">
        <h1 className="font-display text-2xl text-foreground tracking-wider">antk</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="name (for first sign up)"
          className="w-full border border-foreground bg-background p-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          className="w-full border border-foreground bg-background p-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          className="w-full border border-foreground bg-background p-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          autoFocus
        />
        {error && <p className="font-display text-[10px] text-accent">{error}</p>}
        <div className="flex w-full gap-3">
          <Button type="submit" variant="default" className="flex-1 font-display text-[10px]">
            SIGN IN
          </Button>
          <Button type="button" variant="secondary" className="flex-1 font-display text-[10px]" onClick={handleSignUp}>
            SIGN UP
          </Button>
        </div>
      </form>
    </div>
  );
}
