
import { useEffect, useState } from "react";
import {
  createFileRoute,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({
  component: AccountLayout,
});

function AccountLayout() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        setSignedIn(false);
        setCheckingSession(false);
        void navigate({ to: "/sign-in", replace: true });
        return;
      }

      setSignedIn(true);
      setCheckingSession(false);
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (!session) {
        setSignedIn(false);
        void navigate({ to: "/sign-in", replace: true });
      } else {
        setSignedIn(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (checkingSession || !signedIn) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {checkingSession
            ? "Checking your session..."
            : "Taking you to sign in..."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
      <Outlet />
    </main>
  );
}
