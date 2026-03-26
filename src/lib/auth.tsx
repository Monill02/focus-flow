import { useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { ensureUser } from "@/lib/store";

// AuthProvider is no longer needed — ClerkProvider in main.tsx wraps the app.
// Kept as a pass-through so existing imports don't break.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      const name =
        user.fullName ||
        user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
        "Builder";
      ensureUser(user.id, name);
      localStorage.setItem("antk_user_id", user.id);
    } else {
      localStorage.removeItem("antk_user_id");
    }
  }, [user, isLoaded]);

  return {
    user: user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
          name:
            user.fullName ||
            user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
            "Builder",
        }
      : null,
    loading: !isLoaded,
    signOut: () => clerkSignOut(),
  };
}
