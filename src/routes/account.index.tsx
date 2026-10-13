import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { PlannedBadge } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import { ACCOUNT_NAV } from "./account";

// Only services that already have working pages are clickable.
const AVAILABLE = new Set<string>(["/account/cart", "/account/wishlist"]);

function getRegisteredFirstName(fullName: string | null | undefined) {
  return fullName?.trim().split(/\s+/)[0] || null;
}

function useFirstName() {
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFirstName() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          if (active) setFirstName(null);
          return;
        }

        const user = data.user;
        const metadata = user.user_metadata ?? {};

        // Prefer the name saved in the customer's profile.
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        // Use registration metadata if no profile name is available.
        const registeredName =
          profile?.full_name ||
          metadata["full_name"] ||
          metadata["first_name"] ||
          metadata["name"] ||
          "";

        const name = getRegisteredFirstName(
          typeof registeredName === "string" ? registeredName : null,
        );

        if (active) setFirstName(name);
      } catch (error) {
        console.error("Unable to load the customer's greeting name:", error);
        if (active) setFirstName(null);
      }
    }

    void loadFirstName();

    return () => {
      active = false;
    };
  }, []);

  return firstName;
}

function Overview() {
  const firstName = useFirstName();

  return (
    <AccountPage
      title={`Welcome back${firstName ? ` ${firstName}` : ""}`}
      intro="Your NEXA account, shopping and services — all in one place."
    >
      <section
        aria-label="Customer account services"
        className="rounded-2xl border border-[#C6A45B]/40 bg-[#080808] p-3 text-[#D5D5D5] shadow-xl sm:p-4"
      >
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF63]">
            Your dashboard
          </p>
          <p className="mt-1 text-sm text-[#AFAFAF]">
            Choose a service to continue.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ACCOUNT_NAV.slice(1).map((item) => {
            const available = AVAILABLE.has(item.to);

            const cardClassName =
              "relative flex aspect-square flex-col justify-between rounded-xl border p-3 transition-colors sm:p-4 " +
              (available
                ? "border-[#C6A45B]/50 bg-[#101010] text-[#D5D5D5] hover:border-[#E0BD70] hover:bg-[#17130B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E0BD70]"
                : "border-[#444444] bg-[#101010] text-[#858585]");

            if (available) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  className={cardClassName}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C6A45B]/40 bg-[#17130B] text-lg text-[#D4AF63]"
                  >
                    {item.to === "/account/cart" ? "◇" : "☆"}
                  </span>

                  <span className="text-sm font-semibold leading-snug sm:text-base">
                    {item.label}
                  </span>

                  <span className="text-xs text-[#D4AF63]">
                    Open service →
                  </span>
                </Link>
              );
            }

            return (
              <div
                key={item.to}
                aria-disabled="true"
                className={cardClassName}
              >
                <PlannedBadge label="Coming soon" />

                <span className="text-sm font-semibold leading-snug sm:text-base">
                  {item.label}
                </span>

                <span className="text-xs text-[#858585]">
                  Not available yet
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </AccountPage>
  );
}

export const Route = createFileRoute("/account/")({
  head: accountHead("Overview", "Your NEXA customer dashboard."),
  component: Overview,
});
      
