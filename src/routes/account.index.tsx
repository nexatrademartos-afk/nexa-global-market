
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  CircleHelp,
  Gift,
  Heart,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TicketPercent,
  UserRound,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NexaIdentityAnnouncement } from "@/components/NexaIdentityAnnouncement";
import { PlannedBadge } from "@/components/states";

type CustomerProfile = {
  full_name: string | null;
  customer_code: string | null;
};

type Service = {
  title: string;
  description: string;
  to:
    | "/shop"
    | "/account/orders"
    | "/account/wishlist"
    | "/account/cart"
    | "/account/profile"
    | "/account/addresses"
    | "/account/rewards"
    | "/account/notifications"
    | "/account/returns"
    | "/account/settings";
  icon: typeof ShoppingBag;
  available: boolean;
};

const PRIORITY_SERVICES: Service[] = [
  {
    title: "My Orders",
    description: "Access your orders and delivery updates.",
    to: "/account/orders",
    icon: Package,
    available: false,
  },
  {
    title: "NEXA Wallet",
    description: "Wallet services and payment features.",
    to: "/account/settings",
    icon: Wallet,
    available: false,
  },
  {
    title: "Q Points",
    description: "Your future points and rewards services.",
    to: "/account/rewards",
    icon: Gift,
    available: false,
  },
];

const OTHER_SERVICES: Service[] = [
  {
    title: "Shop products",
    description: "Explore products across the marketplace.",
    to: "/shop",
    icon: ShoppingBag,
    available: true,
  },
  {
    title: "My Cart",
    description: "Review items in your shopping cart.",
    to: "/account/cart",
    icon: ShoppingBag,
    available: true,
  },
  {
    title: "Shopping & Savings",
    description: "Find your saved products and wishlist.",
    to: "/account/wishlist",
    icon: Heart,
    available: true,
  },
  {
    title: "My Account",
    description: "View your profile and account details.",
    to: "/account/profile",
    icon: UserRound,
    available: false,
  },
  {
    title: "Delivery Addresses",
    description: "Manage your saved delivery locations.",
    to: "/account/addresses",
    icon: MapPin,
    available: false,
  },
  {
    title: "Notifications & Offers",
    description: "Account updates and special offers.",
    to: "/account/notifications",
    icon: Bell,
    available: false,
  },
  {
    title: "Help & Support",
    description: "Find assistance with your account.",
    to: "/account/returns",
    icon: CircleHelp,
    available: false,
  },
  {
    title: "Security & Privacy",
    description: "Account security and privacy settings.",
    to: "/account/settings",
    icon: ShieldCheck,
    available: false,
  },
  {
    title: "Referral Benefits",
    description: "Referral features and future benefits.",
    to: "/account/rewards",
    icon: Sparkles,
    available: false,
  },
  {
    title: "Coupons & Promotions",
    description: "Explore discount and promotion features.",
    to: "/account/rewards",
    icon: TicketPercent,
    available: false,
  },
];

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Customer Dashboard — NEXA GLOBAL MART" },
      {
        name: "description",
        content: "Your personal NEXA customer dashboard.",
      },
    ],
  }),
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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

        setEmail(user.email ?? "");
        setFullName(profile?.full_name?.trim() || metadataName.trim());
        setCustomerCode(profile?.customer_code?.trim() || "");
      } catch {
        if (active) {
          setError(
            "Some account details could not be loaded. Please refresh and try again."
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

  const filterServices = (services: Service[]) => {
    const term = search.trim().toLowerCase();

    if (!term) return services;

    return services.filter(
      (service) =>
        service.title.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term)
    );
  };

  const visiblePriority = filterServices(PRIORITY_SERVICES);
  const visibleOther = filterServices(OTHER_SERVICES);

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="overflow-hidden rounded-2xl border border-gold/50 bg-ink text-ink-foreground">
        <div className="p-5 md:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold sm:text-xs">
            Your personal NEXA space
          </p>

          <h1 className="mt-3 font-display text-2xl font-bold md:text-4xl">
            {loading
              ? "Welcome to NEXA"
              : firstName
                ? `Welcome back, ${firstName}!`
                : "Welcome back!"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-ink-foreground/70">
            Shop More. Save More. Get Rewarded.
          </p>

          <p className="mt-2 text-sm leading-6 text-ink-foreground/70">
            Your shopping and customer services, organised in one place.
          </p>

          {email && (
            <p className="mt-3 break-all text-xs text-ink-foreground/70">
              Signed in as {email}
            </p>
          )}
        </div>

        <div className="border-t border-white/10 bg-white/[0.04] p-5 md:px-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold sm:text-xs">
                Customer identification
              </p>
              <p className="mt-2 text-xs text-ink-foreground/70">
                Your NEXA customer ID
              </p>
              <p className="mt-1 break-all font-mono text-xl font-bold tracking-wide sm:text-2xl">
                {loading ? "Loading ID..." : customerCode || "ID unavailable"}
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-3 py-2 text-xs font-semibold text-gold">
              <ShieldCheck className="h-4 w-4" />
              Signed in
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-ink-foreground/60">
            Use your customer ID when contacting support. It is not your
            password or a payment credential.
          </p>
        </div>
      </section>

      <NexaIdentityAnnouncement />

      {error && (
        <p role="alert" className="rounded-xl border p-3 text-sm">
          {error}
        </p>
      )}

      <section className="space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
            Your priorities
          </p>
          <h2 className="mt-1 text-xl font-bold md:text-2xl">
            Your customer essentials
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your key customer services, together in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {visiblePriority.map((service) => (
            <ServiceCard key={service.title} service={service} featured />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
            Customer services
          </p>
          <h2 className="mt-1 text-xl font-bold md:text-2xl">
            Shopping & account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search below to find a service. Features still being developed are
            marked Coming Soon.
          </p>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="field pl-10"
            placeholder="Search customer services..."
            aria-label="Search customer services"
          />
        </label>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {visibleOther.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>

        {visiblePriority.length === 0 && visibleOther.length === 0 && (
          <div className="surface rounded-2xl p-6 text-center">
            <p className="font-semibold">No services found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search.
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/account/returns"
          className="surface flex items-center gap-3 rounded-2xl border p-4 transition hover:border-gold"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold/40">
            <CircleHelp className="h-5 w-5 text-gold" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Customer support</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Find help and support options.
            </span>
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          to="/shop"
          className="surface flex items-center gap-3 rounded-2xl border p-4 transition hover:border-gold"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold/40">
            <ShoppingBag className="h-5 w-5 text-gold" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Continue shopping</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Browse the NEXA marketplace.
            </span>
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        NEXA GLOBAL MART · Shop More. Save More. Get Rewarded.
      </p>
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
      className={`group flex min-h-40 flex-col rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-sm sm:min-h-44 sm:p-4 ${
        featured
          ? "border-gold/60 bg-gold-soft"
          : service.title === "Shop products"
            ? "border-gold/60 bg-gold-soft"
            : "surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-gold/40 sm:h-10 sm:w-10">
          <Icon className="h-4 w-4 text-gold sm:h-5 sm:w-5" />
        </span>

        {service.available ? (
          <span className="rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wide sm:text-[10px]">
            Available
          </span>
        ) : (
          <PlannedBadge label="Coming soon" />
        )}
      </div>

      <span className="mt-3 text-sm font-bold leading-5 sm:text-base">
        {service.title}
      </span>

      <span className="mt-1 text-xs leading-5 text-muted-foreground">
        {service.description}
      </span>

      <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold">
        {service.available ? "Open service" : "View section"}
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
    }
