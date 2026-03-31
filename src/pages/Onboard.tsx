import { SignIn } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function Onboard() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <h1 className="font-display text-2xl tracking-wider text-foreground">antk</h1>
      <SignIn fallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />
    </div>
  );
}
