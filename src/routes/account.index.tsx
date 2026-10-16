
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Gift,
  Info,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlannedBadge } from "@/components/states";

type CustomerProfile = {
  full_name: string | null;
  customer_code: string | null;
};

type Service = {
  title: string;
  description: string;
  to: "/account/orders" | "/account/settings" | "/account/rewards";
  icon: typeof Package;
};

const PRIORITY_SERVICES: Service[] = [
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
    description: "Check delivery information through your orders.",
    to: "/account/orders",
    icon: Truck,
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
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const [fullName, setFullName] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showIdInfo, setShowIdInfo] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
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
            ? user.user_metadata.full_name
            : "";

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, customer_code")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!active) return;

        const profile = data as CustomerProfile | null;

        setFullName(profile?.full_name?.trim() || metadataName.trim());
        setCustomerCode(profile?.customer_code?.trim() || "");
      } catch {
        if (active) {
          setError(
            "Your account details could not be loaded. Please refresh and try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const firstName = fullName.trim().split(/\s+/)[0] || "";

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
      <section>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {loading
            ? "Welcome back"
            : firstName
              ? `Welcome back, ${firstName}`
              : "Welcome back"}
        </h1>
      </section>

      <section className="surface rounded-2xl border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              Your NEXA Customer ID
            </p>
            <p className="mt-1 break-all font-mono text-lg font-semibold tracking-wide sm:text-xl">
              {loading ? "Loading ID..." : customerCode || "ID unavailable"}
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-3 py-2 text-xs font-semibold text-gold">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Signed in
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowIdInfo((visible) => !visible)}
          aria-expanded={showIdInfo}
          className="mt-3 inline-flex items-center gap-2 rounded-lg py-2 text-sm font-medium text-gold transition hover:opacity-80"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
          {showIdInfo ? "Hide ID information" : "About your ID"}
        </button>

        {showIdInfo && (
          <p className="mt-2 rounded-xl border border-gold/30 bg-gold-soft p-3 text-sm leading-6">
            Your NEXA Customer ID identifies your customer account. You can
            provide it when contacting customer support. It is not your
            password or a payment credential. Keep your sign-in details private.
          </p>
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
          {PRIORITY_SERVICES.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/shop"
          className="surface flex min-h-24 items-center gap-3 rounded-2xl border p-3 transition hover:border-gold sm:p-4"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold/40 bg-gold-soft">
            <ShoppingBag
              className="h-5 w-5 text-gold"
              aria-hidden="true"
            />
          </span>
          <span className="text-sm font-semibold">Continue shopping</span>
        </Link>

        <Link
          to="/account/cart"
          className="surface flex min-h-24 items-center gap-3 rounded-2xl border p-3 transition hover:border-gold sm:p-4"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold/40 bg-gold-soft">
            <Package className="h-5 w-5 text-gold" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold">My Cart</span>
        </Link>
      </section>
    </main>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon;

  return (
    <Link
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

      <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold">
        View service
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
