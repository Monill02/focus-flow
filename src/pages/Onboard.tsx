import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

type Mode = "signin" | "signup";

export default function Onboard() {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (user) {
    navigate("/");
    return null;
  }

  const validate = () => {
    if (!email.trim()) {
      setError("EMAIL IS REQUIRED.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("ENTER A VALID EMAIL ADDRESS.");
      return false;
    }
    if (!password.trim()) {
      setError("PASSWORD IS REQUIRED.");
      return false;
    }
    if (password.length < 6) {
      setError("PASSWORD MUST BE AT LEAST 6 CHARACTERS.");
      return false;
    }
    if (mode === "signup" && !name.trim()) {
      setError("NAME IS REQUIRED TO CREATE AN ACCOUNT.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim());
      }
      navigate("/");
    } catch (err: unknown) {
      // Map Supabase error messages to human-readable ones
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Invalid login credentials")) {
        setError("INCORRECT EMAIL OR PASSWORD.");
      } else if (msg.includes("Email not confirmed")) {
        setError("PLEASE CONFIRM YOUR EMAIL BEFORE SIGNING IN.");
      } else if (msg.includes("User already registered")) {
        setError("AN ACCOUNT WITH THIS EMAIL ALREADY EXISTS. SIGN IN INSTEAD.");
      } else if (msg.includes("Password should be")) {
        setError("PASSWORD MUST BE AT LEAST 6 CHARACTERS.");
      } else if (msg.includes("Unable to validate email")) {
        setError("ENTER A VALID EMAIL ADDRESS.");
      } else {
        setError(mode === "signin" ? "SIGN IN FAILED. TRY AGAIN." : "SIGN UP FAILED. TRY AGAIN.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      // No navigate needed — OAuth redirects automatically
    } catch {
      setError("GOOGLE SIGN IN FAILED. TRY AGAIN.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex w-full max-w-[360px] flex-col items-center gap-6 p-8">

        {/* Wordmark */}
        <h1 className="font-display text-2xl text-foreground tracking-wider">antk</h1>
        <p className="font-mono text-xs text-muted-foreground text-center">
          ship or get caught trying.
        </p>

        {/* Mode toggle */}
        <div className="flex w-full border border-foreground">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(""); }}
            className={`flex-1 py-2 font-display text-[10px] transition-colors ${
              mode === "signin"
                ? "bg-foreground text-background"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 py-2 font-display text-[10px] transition-colors ${
              mode === "signup"
                ? "bg-foreground text-background"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            SIGN UP
          </button>
        </div>

        {/* Google — primary CTA */}
        <Button
          type="button"
          variant="lockin"
          className="w-full font-display text-[10px]"
          onClick={handleGoogle}
          disabled={loading}
        >
          CONTINUE WITH GOOGLE
        </Button>

        {/* Divider */}
        <div className="flex w-full items-center gap-3">
          <div className="flex-1 border-t border-foreground opacity-30" />
          <span className="font-mono text-[10px] text-muted-foreground">OR</span>
          <div className="flex-1 border-t border-foreground opacity-30" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your name"
              className="w-full border border-foreground bg-background p-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            className="w-full border border-foreground bg-background p-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="w-full border border-foreground bg-background p-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          />

          {/* Error message */}
          {error && (
            <p className="font-display text-[10px] text-accent leading-relaxed">
              {error}
            </p>
          )}

          {/* Submit — secondary CTA */}
          <Button
            type="submit"
            variant="default"
            className="w-full font-display text-[10px]"
            disabled={loading}
          >
            {loading
              ? "..."
              : mode === "signin"
              ? "SIGN IN WITH EMAIL"
              : "CREATE ACCOUNT"}
          </Button>
        </form>

      </div>
    </div>
  );
}
