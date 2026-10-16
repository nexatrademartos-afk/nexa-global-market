
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Info, MapPin, Package, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlannedBadge } from "@/components/states";

type CustomerProfile = {
  full_name: string | null;
  customer_code: string | null;
};

type MainService = {
  title: string;
  description: string;
  to: "/account/orders" | "/account/settings" | "/account/rewards" | "/account/addresses";
  icon: typeof Package;
};

const MAIN_SERVICES: MainService[] = [
  {
    title: "My Orders",
    description: "View your orders and order updates.",
    to: "/account/orders",
    icon: Package,
  },
  {
    title: "NEXA Wallet",
    description: "Access your wallet services.",
    to: "/account/settings",
    icon: Wallet,
  },
  {
    title: "Q Points",
    description: "Explore points and rewards.",
    to: "/account/rewards",
    icon: Gift,
  },
  {
    title: "Delivery & Tracking",
    description: "Check delivery information when available.",
    to: "/account/addresses",
    icon: MapPin,
  },
];

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "My Account — NEXA GLOBAL MART" },
      {
        name: "description",
        content: "Your NEXA customer account and services.",
      },
    ],
  }),
  component: CustomerAccountHome,
});

function CustomerAccountHome() {
  const [fullName, setFullName] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [showIdInfo, setShowIdInfo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCustomer() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
          if (active) {
            setError("Your session could not be verified. Please sign in again.");
          }
          return;
        }

        const metadataName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name.trim()
            : "";

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, customer_code")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!active) return;

        const profile = data as CustomerProfile | null;

        setFullName(profile?.full_name?.trim() || metadataName);
        setCustomerCode(profile?.customer_code?.trim() || "");
      } catch {
        if (active) {
          setError("Your account details could not be loaded. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCustomer();

    return () => {
      active = false;
    };
  }, []);

  const firstName = fullName.trim().split(/\s+/)[0] || "";

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
      <section className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {loading
            ? "Welcome back"
            : firstName
              ? `Welcome back, ${firstName}`
              : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Your account, all in one place.
        </p>
      </section>

      <section className="surface rounded-2xl border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              Your NEXA Customer ID
            </p>
            <p className="mt-1 break-all font-mono text-lg font-semibold tracking-wide sm:text-xl">
              {loading ? "Loading..." : customerCode || "ID unavailable"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowIdInfo((visible) => !visible)}
            aria-expanded={showIdInfo}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition hover:border-gold"
          >
            <Info className="h-4 w-4 text-gold" />
            {showIdInfo ? "Hide details" : "About your ID"}
          </button>
        </div>

        {showIdInfo && (
          <div className="mt-4 rounded-xl border border-gold/30 bg-gold-soft p-3 text-sm leading-6">
            Your NEXA Customer ID identifies your customer account. You can
            provide it when contacting customer support. Keep your password and
            sign-in verification details private.
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-xl border p-3 text-sm">
          {error}
        </p>
      )}

      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold sm:text-lg">
            Your services
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose what you want to do.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {MAIN_SERVICES.map((service) => {
            const Icon = service.icon;

            return (
              <Link
                key={service.title}
                to={service.to}
                className="surface group flex min-h-36 flex-col rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-sm sm:min-h-40 sm:p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-gold/40 bg-gold-soft">
                    <Icon className="h-6 w-6 text-gold" aria-hidden="true" />
                  </span>
                  <PlannedBadge label="Coming soon" />
                </div>

                <span className="mt-3 text-sm font-semibold leading-5 sm:text-base">
                  {service.title}
                </span>
                <span className="mt-1 text-xs leading-5 text-muted-foreground">
                  {service.description}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
