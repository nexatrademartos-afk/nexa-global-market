import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const ACCOUNT_NAV = [
  { to: "/account", label: "Overview" },
  { to: "/account/profile", label: "Profile" },
  { to: "/account/orders", label: "My Orders" },
  { to: "/account/addresses", label: "Delivery Addresses" },
  { to: "/account/cart", label: "My Cart" },
  { to: "/account/wishlist", label: "Shopping & Savings" },
  { to: "/account/rewards", label: "Q Points & Rewards" },
  { to: "/account/notifications", label: "Notifications & Offers" },
  { to: "/account/returns", label: "Help & Support" },
  { to: "/account/settings", label: "Security & Privacy" },
  { to: "/account/applications", label: "Role Applications" },
] as const;

export const Route = createFileRoute("/account")({
  component: AccountLayout,
});

function AccountLayout() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setSigningOut(false);
        return;
      }

      await navigate({ to: "/", replace: true });
    } catch {
      setSigningOut(false);
    }
  }

  if (checkingSession || !signedIn) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {checkingSession
            ? "Checking your customer session..."
            : "Taking you to sign in..."}
        </p>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
      <aside className="mb-4 md:mb-0">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          NEXA Customer Dashboard
        </p>

        <nav
          aria-label="Customer account navigation"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-col md:gap-1 md:px-0"
        >
          {ACCOUNT_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  "bg-primary text-primary-foreground md:bg-secondary md:text-foreground md:font-semibold",
              }}
              className="flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm md:rounded-lg md:border-0 md:px-3"
            >
              {item.label}
            </Link>
          ))}

          <Link
            to="/account/applications"
            className="flex min-h-11 shrink-0 items-center rounded-full border border-gold/40 px-4 text-sm md:mt-3 md:rounded-lg md:px-3"
          >
            External Workspaces
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex min-h-11 shrink-0 items-center rounded-full border px-4 text-left text-sm text-muted-foreground disabled:opacity-60 md:mt-1 md:rounded-lg md:px-3"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </nav>
      </aside>

      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}
