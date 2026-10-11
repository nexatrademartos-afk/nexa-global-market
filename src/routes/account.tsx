import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  CircleHelp,
  ClipboardList,
  Gift,
  Heart,
  MapPin,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  TicketPercent,
  UserRound,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ACCOUNT_NAV = [
  { to: "/account", label: "Overview", icon: ShieldCheck, exact: true },
  { to: "/account/orders", label: "Orders & delivery", icon: Package },
  { to: "/account/cart", label: "My cart", icon: ShoppingBag },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/profile", label: "My profile", icon: UserRound },
  { to: "/account/addresses", label: "Delivery addresses", icon: MapPin },
  { to: "/account/rewards", label: "Rewards & referrals", icon: Gift },
  { to: "/account/notifications", label: "Notifications", icon: Bell },
  { to: "/account/returns", label: "Help & support", icon: CircleHelp },
  { to: "/account/settings", label: "Settings & privacy", icon: Settings },
  { to: "/account/applications", label: "Role applications", icon: ClipboardList },
] as const;

export const Route = createFileRoute("/account")({
  component: AccountLayout,
});

function AccountLayout() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      setSignedIn(!error && Boolean(data.user));
      setLoading(false);
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setSignedIn(Boolean(session?.user));
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setSignOutError("");
    const { error } = await supabase.auth.signOut();

    if (error) {
      setSignOutError("We couldn't sign you out. Please try again.");
      return;
    }

    window.location.assign("/");
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-12">
        <div className="surface rounded-2xl p-6" role="status">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            NEXA · Secure customer access
          </p>
          <p className="mt-3 font-semibold">
            Checking your account session...
          </p>
        </div>
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="mx-auto min-h-[65vh] max-w-4xl px-4 py-8 md:py-14">
        <section className="overflow-hidden rounded-3xl border border-gold/40 bg-background shadow-sm">
          <div className="bg-ink p-6 text-ink-foreground md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              NEXA · Customer access
            </p>

            <h1 className="mt-4 font-display text-3xl font-bold md:text-5xl">
              Your NEXA. Your account.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-foreground/75 md:text-base">
              Sign in to enter your personal customer dashboard. Manage your
              profile, saved items and customer services in one secure place.
              You can also continue browsing the marketplace without an account.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 md:p-8">
            <Link
              to="/sign-in"
              className="flex min-h-14 items-center justify-center rounded-xl bg-gold px-5 py-3 text-center font-bold text-gold-foreground transition hover:opacity-90"
            >
              Sign in to my account
            </Link>

            <Link
              to="/sign-up"
              className="flex min-h-14 items-center justify-center rounded-xl border border-gold/60 px-5 py-3 text-center font-semibold transition hover:bg-gold-soft"
            >
              Create a customer account
            </Link>

            <Link
              to="/shop"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold underline underline-offset-4 sm:col-span-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue browsing as a guest
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-background pb-20">
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 md:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-ink p-4 text-ink-foreground md:p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold sm:text-xs">
              NEXA · Private customer area
            </p>

            <p className="mt-1 text-lg font-bold sm:text-xl">
              Customer Dashboard
            </p>

            <p className="mt-1 text-xs text-ink-foreground/70">
              Your account services, together in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="nexa-account-navigation"
            className="flex min-h-11 items-center gap-2 rounded-xl border border-gold/50 px-4 text-sm font-semibold transition hover:bg-white/10"
          >
            {menuOpen ? "Close menu" : "Menu"}
            <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-[240px_minmax(0,1fr)] md:gap-7">
          <aside
            id="nexa-account-navigation"
            className={`${menuOpen ? "block" : "hidden"} md:block`}
          >
            <div className="surface overflow-hidden rounded-2xl border">
              <div className="border-b border-gold/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  My NEXA
                </p>
                <p className="mt-1 font-bold">Customer services</p>
              </div>

              <nav aria-label="Customer dashboard" className="grid gap-1 p-2">
                {ACCOUNT_NAV.map(({ to, label, icon: Icon, ...options }) => (
                  <Link
                    key={to}
                    to={to}
                    activeOptions={{
                      exact: "exact" in options && options.exact,
                    }}
                    activeProps={{
                      className:
                        "border-gold/50 bg-gold-soft font-semibold text-foreground",
                    }}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-muted-foreground transition hover:border-gold/40 hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gold" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>

              <div className="border-t p-3">
                <Link
                  to="/shop"
                  className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold hover:bg-gold-soft"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to marketplace
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Sign out
                </button>

                {signOutError && (
                  <p role="alert" className="px-3 pt-2 text-xs text-red-600">
                    {signOutError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-gold/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Coming soon
              </p>

              <div className="mt-3 space-y-3 text-sm">
                <p className="flex items-center gap-2">
                  <TicketPercent className="h-4 w-4 text-gold" />
                  Coupons & special offers
                </p>

                <p className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-gold" />
                  NEXA Pay
                </p>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  );
}
