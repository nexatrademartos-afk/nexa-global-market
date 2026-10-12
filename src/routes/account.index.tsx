
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  CircleHelp,
  ClipboardList,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
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
import { PlannedBadge } from "@/components/states";

type CustomerProfile = {
  full_name: string | null;
  customer_code: string | null;
};

const SERVICES = [
  {
    title: "Shop products",
    description: "Explore clothing, electronics, beauty and more.",
    to: "/shop",
    icon: ShoppingBag,
    status: "available",
  },
  {
    title: "Orders & delivery",
    description: "Order history, delivery progress and tracking.",
    to: "/account/orders",
    icon: Package,
    status: "soon",
  },
  {
    title: "My wishlist",
    description: "Find products you have saved.",
    to: "/account/wishlist",
    icon: Heart,
    status: "available",
  },
  {
    title: "My cart",
    description: "Review items saved in this browser.",
    to: "/account/cart",
    icon: ShoppingBag,
    status: "available",
  },
  {
    title: "My profile",
    description: "Your name and contact details.",
    to: "/account/profile",
    icon: UserRound,
    status: "soon",
  },
  {
    title: "Delivery addresses",
    description: "Manage your saved delivery locations.",
    to: "/account/addresses",
    icon: MapPin,
    status: "soon",
  },
  {
    title: "Q Points & rewards",
    description: "Points balance, history and rewards.",
    to: "/account/rewards",
    icon: Gift,
    status: "soon",
  },
  {
    title: "Coupons & offers",
    description: "Discounts and special promotions.",
    to: "/account/rewards",
    icon: TicketPercent,
    status: "soon",
  },
  {
    title: "Referrals",
    description: "Invite friends and follow referral rewards.",
    to: "/account/rewards",
    icon: Sparkles,
    status: "soon",
  },
  {
    title: "Notifications",
    description: "Updates from NEXA about your account.",
    to: "/account/notifications",
    icon: Bell,
    status: "soon",
  },
  {
    title: "Help & support",
    description: "Find help with orders and your account.",
    to: "/account/returns",
    icon: CircleHelp,
    status: "soon",
  },
  {
    title: "NEXA AI assistant",
    description: "Your future 24/7 shopping assistant.",
    to: "/account/returns",
    icon: MessageCircle,
    status: "soon",
  },
  {
    title: "NEXA Pay & wallet",
    description: "Future payment and wallet services.",
    to: "/account/settings",
    icon: Wallet,
    status: "soon",
  },
  {
    title: "Account security",
    description: "Privacy and security settings.",
    to: "/account/settings",
    icon: ShieldCheck,
    status: "soon",
  },
  {
    title: "My activity",
    description: "A summary of your customer activity.",
    to: "/account/orders",
    icon: ClipboardList,
    status: "soon",
  },
] as const;

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Customer Dashboard — NEXA Trade Mart" },
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

        if (authError) {
          throw authError;
        }

        const user = authData.user;

        if (!user) {
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

        if (profileError) {
          throw profileError;
        }

        if (!active) {
          return;
        }

        const profile = data as CustomerProfile | null;

        setEmail(user.email ?? "");
        setFullName(profile?.full_name?.trim() || metadataName.trim());
        setCustomerCode(profile?.customer_code?.trim() || "");
      } catch {
        if (active) {
          setError(
            "Your account is signed in, but some profile details could not be loaded. Please refresh and try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const firstName = fullName.trim().split(/\s+/)[0] || "there";

  const visibleServices = SERVICES.filter((service) => {
    const term = search.trim().toLowerCase();

    return (
      !term ||
      service.title.toLowerCase().includes(term) ||
      service.description.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="overflow-hidden rounded-2xl border border-[#C6A45B]/70 bg-[#080808] text-[#D5D5D5] shadow-[0_0_18px_rgba(198,164,91,0.12)]">
        <div className="p-5 md:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D4AF63] sm:text-xs">
            Your personal NEXA space
          </p>

          <h1 className="mt-3 font-display text-2xl font-bold text-[#E0BD70] md:text-4xl">
            {loading ? "Welcome to NEXA" : `Welcome back, ${firstName}!`}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#B8B8B8]">
            Your shopping and customer services, organised in one place.
          </p>

          {email && (
            <p className="mt-3 break-all text-xs text-[#AFAFAF]">
              Signed in as {email}
            </p>
          )}
        </div>

        <div className="border-t border-[#C6A45B]/25 bg-white/[0.025] p-5 md:px-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF63] sm:text-xs">
                Customer identification
              </p>

              <p className="mt-2 text-xs text-[#B8B8B8]">
                Your NEXA customer ID
              </p>

              <p className="mt-1 break-all font-mono text-xl font-bold tracking-wide text-[#E0BD70] sm:text-2xl">
                {loading ? "Loading ID..." : customerCode || "ID unavailable"}
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-[#C6A45B]/60 px-3 py-2 text-xs font-semibold text-[#D4AF63]">
              <ShieldCheck className="h-4 w-4" />
              Signed in
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-[#AFAFAF]">
            Use this ID when contacting NEXA support. It is not your password
            or a payment credential.
          </p>
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-[#C6A45B]/50 bg-[#0B0B0B] p-3 text-sm text-[#D5D5D5]"
        >
          {error}
        </p>
      )}

      <section className="space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B8B8B8] sm:text-xs">
            Your account
          </p>

          <h2 className="mt-1 text-xl font-bold text-[#E0BD70] md:text-2xl">
            Customer services
          </h2>

          <p className="mt-1 text-sm text-[#B8B8B8]">
            Choose a service. Features that are still being built are marked
            Coming soon.
          </p>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8B8B8]" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="field border-[#C6A45B]/50 bg-[#080808] pl-10 text-[#D5D5D5] placeholder:text-[#858585] focus:border-[#D4AF63] focus:ring-[#C6A45B]/20"
            placeholder="Search your customer services..."
            aria-label="Search customer services"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          {visibleServices.map((service) => {
            const Icon = service.icon;
            const available = service.status === "available";

            return (
              <Link
                key={service.title}
                to={service.to}
                className="group flex min-h-40 flex-col rounded-xl border border-[#C6A45B]/60 bg-[#090909] p-3 text-[#D5D5D5] shadow-[0_0_12px_rgba(198,164,91,0.10)] transition duration-200 hover:-translate-y-0.5 hover:border-[#E0BD70] hover:shadow-[0_0_18px_rgba(198,164,91,0.22)] sm:min-h-44 sm:rounded-2xl sm:p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#C6A45B]/50 bg-[#11100D] sm:h-10 sm:w-10">
                    <Icon className="h-4 w-4 text-[#D4AF63] sm:h-5 sm:w-5" />
                  </span>

                  {available ? (
                    <span className="rounded-full border border-[#C6A45B]/60 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#E0BD70] sm:text-[10px]">
                      Available
                    </span>
                  ) : (
                    <PlannedBadge label="Coming soon" />
                  )}
                </div>

                <span className="mt-3 text-sm font-bold leading-5 text-[#E0BD70] sm:text-base">
                  {service.title}
                </span>

                <span className="mt-1 text-xs leading-5 text-[#B8B8B8]">
                  {service.description}
                </span>

                <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-[#D4AF63]">
                  {available ? "Open service" : "Coming soon"}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        {visibleServices.length === 0 && (
          <div className="rounded-xl border border-[#C6A45B]/50 bg-[#090909] p-6 text-center text-[#D5D5D5] shadow-[0_0_12px_rgba(198,164,91,0.08)]">
            <p className="font-semibold text-[#E0BD70]">No services found</p>

            <p className="mt-1 text-sm text-[#B8B8B8]">
              Try a different search.
            </p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/account/returns"
          className="flex min-w-0 items-center gap-3 rounded-xl border border-[#C6A45B]/50 bg-[#090909] p-3 text-[#D5D5D5] shadow-[0_0_12px_rgba(198,164,91,0.08)] transition hover:border-[#E0BD70] hover:shadow-[0_0_16px_rgba(198,164,91,0.18)] sm:rounded-2xl sm:p-4"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#C6A45B]/50 sm:h-10 sm:w-10">
            <CircleHelp className="h-5 w-5 text-[#D4AF63]" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#E0BD70]">
              Customer support
            </span>

            <span className="mt-1 block text-xs leading-5 text-[#B8B8B8]">
              Find help and support options.
            </span>
          </span>

          <ArrowRight className="h-4 w-4 shrink-0 text-[#D4AF63]" />
        </Link>

        <Link
          to="/shop"
          className="flex min-w-0 items-center gap-3 rounded-xl border border-[#C6A45B]/50 bg-[#090909] p-3 text-[#D5D5D5] shadow-[0_0_12px_rgba(198,164,91,0.08)] transition hover:border-[#E0BD70] hover:shadow-[0_0_16px_rgba(198,164,91,0.18)] sm:rounded-2xl sm:p-4"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#C6A45B]/50 sm:h-10 sm:w-10">
            <ShoppingBag className="h-5 w-5 text-[#D4AF63]" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#E0BD70]">
              Continue shopping
            </span>

            <span className="mt-1 block text-xs leading-5 text-[#B8B8B8]">
              Browse the NEXA marketplace.
            </span>
          </span>

          <ArrowRight className="h-4 w-4 shrink-0 text-[#D4AF63]" />
        </Link>
      </section>

      <p className="pb-2 text-center text-xs text-[#AFAFAF]">
        NEXA TRADE MART · Shop More. Save More. Get Rewarded.
      </p>
    </div>
  );
}
