import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { PlannedBadge } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import { ACCOUNT_NAV } from "./account";

// Tiles whose pages already work today; all others are shown as Coming soon.
const AVAILABLE = new Set<string>(["/account/cart", "/account/wishlist"]);

function useFirstName() {
  const [first, setFirst] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const full = (profile?.full_name || (user.user_metadata?.full_name as string) || "").trim();
      const name = full.split(/\s+/)[0];
      if (active && name) setFirst(name);
    })();
    return () => {
      active = false;
    };
  }, []);
  return first;
}

function Overview() {
  const first = useFirstName();
  return (
    <AccountPage
      title={first ? `Welcome, ${first}` : "Welcome to NEXA"}
      intro="Everything about your shopping in one place."
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {ACCOUNT_NAV.slice(1).map((n) =>
          AVAILABLE.has(n.to) ? (
            <Link
              key={n.to}
              to={n.to}
              className="surface flex min-h-20 items-end p-4 font-semibold hover:border-gold"
            >
              {n.label}
            </Link>
          ) : (
            <div
              key={n.to}
              aria-disabled="true"
              className="surface flex min-h-20 flex-col items-start justify-between gap-2 p-4 font-semibold opacity-60"
            >
              <PlannedBadge label="Coming soon" />
              {n.label}
            </div>
          ),
        )}
      </div>
    </AccountPage>
  );
}

export const Route = createFileRoute("/account/")({
  head: accountHead("Overview", "Your NEXA customer dashboard."),
  component: Overview,
});
