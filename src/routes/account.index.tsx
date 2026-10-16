
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  CircleHelp,
  Compass,
  Gift,
  Heart,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  TicketPercent,
  Truck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlannedBadge } from "@/components/states";

type CustomerProfile = {
  full_name: string | null;
  customer_code: string | null;
};

type Service = {
  title: string;
  to:
    | "/shop"
    | "/account/orders"
    | "/account/cart"
    | "/account/wishlist"
    | "/account/profile"
    | "/account/addresses"
    | "/account/rewards"
    | "/account/notifications"
    | "/account/returns"
    | "/account/settings"
    | "/account/applications";
  icon: typeof ShoppingBag;
  available: boolean;
};

const PRIORITY_SERVICES: Service[] = [
  {
    title: "My Orders",
    to: "/account/orders",
    icon: Package,
    available: false,
  },
  {
    title: "NEXA Wallet",
    to: "/account/settings",
    icon: Wallet,
    available: false,
  },
  {
    title: "Q Points",
    to: "/account/rewards",
    icon: Gift,
    available: false,
  },
  {
    title: "Delivery & Tracking",
    to: "/account/orders",
    icon: Truck,
    available: false,
  },
];

const OTHER_SERVICES: Service[] = [
  {
    title: "Shop Products",
    to: "/shop",
    icon: ShoppingBag,
    available: true,
  },
  {
    title: "My Cart",
    to: "/account/cart",
    icon: ShoppingBag,
    available: true,
  },
  {
    title: "Shopping & Savings",
    to: "/account/wishlist",
    icon: Heart,
    available: true,
  },
  {
    title: "My Profile",
    to: "/account/profile",
    icon: UserRound,
    available: false,
  },
  {
    title: "Delivery Addresses",
    to: "/account/addresses",
    icon: MapPin,
    available: false,
  },
  {
    title: "Coupons",
    to: "/account/rewards",
    icon: TicketPercent,
    available: false,
  },
  {
    title: "Notifications",
    to: "/account/notifications",
    icon: Bell,
    available: false,
  },
  {
    title: "Help & Support",
    to: "/account/returns",
    icon: CircleHelp,
    available: false,
  },
  {
    title: "Security & Privacy",
    to: "/account/settings",
    icon: ShieldCheck,
    available: false,
  },
  {
    title: "Discover",
    to: "/account/applications",
    icon: Compass,
    available: true,
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
  const [search, setSearch] = useState("");
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
            setError("Please sign in again to view your account.");
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
          setError(
            "We couldn't load all your account details. Please refresh and try again.",
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

  const firstName = fullName.trim().split(/\s+/)[0] || "there";

  const filteredPriority = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return PRIORITY_SERVICES;

    return PRIORITY_SERVICES.filter((service) =>
      service.title.toLowerCase().includes(term),
    );
  }, [search]);

  const filteredOther = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return OTHER_SERVICES;

    return OTHER_SERVICES.filter((service) =>
      service.title.toLowerCase().includes(term),
    );
  }, [search]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-5 pb-8 sm:py-7">
      <section className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            {loading ? "Welcome back" : `Welcome back, ${firstName}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account, all in one place.
          </p>
        </div>

        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/50 bg-gold-soft"
          aria-label="Signed-in customer"
          title="Signed-in customer"
        >
          <UserRound className="h-5 w-5 text-gold" />
        </span>
      </section>

      <section className="surface rounded-2xl border border-gold/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              Your NEXA Customer ID
            </p>
            <p className="mt-1 break-all font-mono text-lg font-bold tracking-wide sm:text-xl">
              {loading ? "Loading..." : customerCode || "ID unavailable"}
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4 text-gold" />
            Signed in
          </span>
        </div>

        <button
          type="button"
          aria-expanded={showIdInfo}
          onClick={() => setShowIdInfo((current) => !current)}
          className="mt-3 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-gold hover:underline"
        >
          {showIdInfo ? (
            <X className="h-4 w-4" />
          ) : (
            <CircleHelp className="h-4 w-4" />
          )}
          {showIdInfo ? "Close ID information" : "About your ID"}
        </button>

        {showIdInfo && (
          <p className="mt-2 rounded-xl bg-muted/50 p-3 text-sm leading-5 text-muted-foreground">
            Your NEXA Customer ID identifies your customer account when you
            contact support. Keep your sign-in details private. Your ID is
            not your password or a payment credential.
          </p>
        )}
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 p-3 text-sm"
        >
          {error}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-bold sm:text-lg">Your essentials</h2>

        <div className="grid grid-cols-2 gap-3">
          {filteredPriority.map((service) => (
            <ServiceCard
              key={service.title}
              service={service}
              featured
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold sm:text-lg">Explore services</h2>
          <span className="text-xs text-muted-foreground">
            {filteredOther.length} services
          </span>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="field pl-10 pr-10"
            placeholder="Find a service"
            aria-label="Search account services"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full"
              aria-label="Clear service search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredOther.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>

        {filteredPriority.length === 0 && filteredOther.length === 0 && (
          <div className="surface rounded-xl p-5 text-center">
            <p className="font-semibold">No matching services</p>
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-gold hover:underline"
              onClick={() => setSearch("")}
            >
              Clear search
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function ServiceCard({
  service,
  featured = false,
}: {
  service: Service;
  featured?: boolean;
}) {
  const Icon = service.icon;

  return (
    <Link
      to={service.to}
      className={[
        "group flex min-h-32 min-w-0 flex-col rounded-2xl border p-3 transition-colors",
        "hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        "sm:min-h-36 sm:p-4",
        featured
          ? "border-gold/50 bg-gold-soft"
          : service.available
            ? "surface"
            : "surface border-border",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold/40 bg-background/50">
          <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
        </span>

        {!service.available && (
          <PlannedBadge label="Coming soon" />
        )}
      </div>

      <span className="mt-3 text-sm font-bold leading-5 sm:text-base">
        {service.title}
      </span>

      <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-gold">
        {service.available ? "Open" : "View"}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
