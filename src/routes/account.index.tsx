import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Copy,
  Gift,
  Heart,
  Info,
  LockKeyhole,
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

type CustomerProfile = {
  full_name: string | null;
  customer_code: string | null;
  phone: string | null;
};

type IdentityAnnouncement = {
  show_banner: boolean;
  new_identity_code: string | null;
  display_number: number;
  displays_remaining: number;
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
    description: "View order history, delivery progress and tracking.",
    to: "/account/orders",
    icon: Package,
    status: "planned",
  },
  {
    title: "My wishlist",
    description: "Return to products you have saved.",
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
    description: "Review your name and contact details.",
    to: "/account/profile",
    icon: UserRound,
    status: "planned",
  },
  {
    title: "Delivery addresses",
    description: "Manage saved delivery locations.",
    to: "/account/addresses",
    icon: MapPin,
    status: "planned",
  },
  {
    title: "Q Points & rewards",
    description: "Points balance, reward history and benefits.",
    to: "/account/rewards",
    icon: Gift,
    status: "planned",
  },
  {
    title: "Coupons & offers",
    description: "Discover promotions and discount codes.",
    to: "/account/rewards",
    icon: TicketPercent,
    status: "planned",
  },
  {
    title: "Referrals",
    description: "Invite friends and track referral rewards.",
    to: "/account/rewards",
    icon: Sparkles,
    status: "planned",
  },
  {
    title: "Notifications",
    description: "Account and marketplace updates.",
    to: "/account/notifications",
    icon: Bell,
    status: "planned",
  },
  {
    title: "Help & support",
    description: "Open the current support information page.",
    to: "/account/returns",
    icon: CircleHelp,
    status: "available",
  },
  {
    title: "NEXA AI assistant",
    description: "Shopping assistance and guided help.",
    to: "/account/returns",
    icon: MessageCircle,
    status: "planned",
  },
  {
    title: "NEXA Pay & wallet",
    description: "Future payment and wallet services.",
    to: "/account/settings",
    icon: Wallet,
    status: "planned",
  },
  {
    title: "Account security",
    description: "Review privacy and account-security information.",
    to: "/account/settings",
    icon: ShieldCheck,
    status: "planned",
  },
  {
    title: "My activity",
    description: "A summary of your customer activity.",
    to: "/account/orders",
    icon: ClipboardList,
    status: "planned",
  },
] as const;

const POLICY_GUIDES = [
  {
    title: "Privacy & personal information",
    summary: "Keep your account details private.",
    body: "This dashboard can display profile details associated with the signed-in account. Never share your password, one-time sign-in codes, or payment credentials in a support message. The full, approved NEXA privacy-policy document is not present in the current source tree, so this note is guidance rather than the official legal policy.",
  },
  {
    title: "Orders, payments & delivery",
    summary: "Check order confirmations and final terms before paying.",
    body: "Order history, delivery tracking, and payment services must be connected to live records before they can be relied on. This dashboard does not confirm an order, payment, stock level, delivery date, or fee by itself. Review the confirmed checkout and order details for any transaction.",
  },
  {
    title: "Returns, refunds & customer support",
    summary: "Request confirmation before assuming a return is approved.",
    body: "This dashboard does not submit a return or refund request. Return eligibility, deadlines, and refund methods must be stated in NEXA's approved and published returns policy. The current support route is a placeholder, so do not treat this card as a submitted ticket or a confirmed refund.",
  },
  {
    title: "Account security & access",
    summary: "Keep your sign-in credentials secure.",
    body: "A customer dashboard does not grant administration or staff permissions. Restricted workspaces must continue to use server-backed role checks and approval rules. Do not expose passwords, private keys, or service-role secrets in frontend code.",
  },
] as const;

function createLoginEventId(): string {
  try {
    const savedId = window.sessionStorage.getItem("nexa_login_event_id");
    if (savedId) return savedId;

    const newId = window.crypto.randomUUID();
    window.sessionStorage.setItem("nexa_login_event_id", newId);
    return newId;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function GlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#C6A45B]/60 bg-[#090909] text-[#D5D5D5] shadow-[0_0_14px_rgba(198,164,91,0.12)] transition duration-200 hover:border-[#E0BD70] hover:shadow-[0_0_22px_rgba(198,164,91,0.22)] ${className}`}
    >
      {children}
    </div>
  );
}

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
  const [phone, setPhone] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [announcement, setAnnouncement] =
    useState<IdentityAnnouncement | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(false);

    useEffect(() => {
    let active = true;

    async function loadCustomerProfile() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const user = authData.user;
        if (!user) {
          if (active) {
            setFullName("");
            setEmail("");
            setPhone("");
            setCustomerCode("");
          }
          return;
        }

        const metadataName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : typeof user.user_metadata?.first_name === "string"
                ? user.user_metadata.first_name
                : "";

        if (active) {
          setEmail(user.email ?? "");
          setFullName(metadataName.trim());
        }

        const { data, error: profileReadError } = await supabase
          .from("profiles")
          .select("full_name, customer_code, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (profileReadError) throw profileReadError;
        if (!active) return;

        const profile = data as CustomerProfile | null;
        setFullName(profile?.full_name?.trim() || metadataName.trim());
        setPhone(profile?.phone?.trim() || "");
        setCustomerCode(profile?.customer_code?.trim() || "");
      } catch {
        if (active) {
          setProfileError(
            "Some profile details could not be loaded. Your signed-in session has not been changed; refresh and try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    async function loadIdentityAnnouncement() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) return;

        const { data, error: rpcError } = await supabase.rpc(
          "record_nexa_identity_announcement_login",
          { p_login_event_id: createLoginEventId() },
        );
        if (rpcError) throw rpcError;
        if (!active) return;

        const result = data?.[0];
        if (result?.new_identity_code) {
          setAnnouncement(result as IdentityAnnouncement);
          setAnnouncementOpen(Boolean(result.show_banner));
        }
      } catch {
        if (active) {
          setAnnouncementError(
            "The NEXA ID update notice could not be loaded right now. Your account details remain available where shown below.",
          );
        }
      }
    }

    void loadCustomerProfile();
    void loadIdentityAnnouncement();

    return () => {
      active = false;
    };
  }, []);

  const firstName = fullName.trim().split(/\s+/)[0] || "there";
  const visibleServices = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return SERVICES;
    return SERVICES.filter(
      (service) =>
        service.title.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term),
    );
  }, [search]);

  const displayCustomerCode =
    announcement?.new_identity_code || customerCode || "ID unavailable";

  async function copyCustomerCode() {
    if (!announcement?.new_identity_code && !customerCode) return;
    const code = announcement?.new_identity_code || customerCode;

    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 1800);
    } catch {
      setCopiedId(false);
    }
  }

  return (
    <div className="-mx-2 -my-2 min-w-0 space-y-5 bg-[#050505] px-2 py-3 text-[#D5D5D5] sm:-mx-3 sm:px-3 md:space-y-6 md:py-5">
      <section className="relative isolate overflow-hidden rounded-2xl border border-[#C6A45B]/70 bg-[radial-gradient(ellipse_at_top_right,rgba(198,164,91,0.15),transparent_48%),linear-gradient(135deg,#101010_0%,#050505_72%)] text-[#D5D5D5] shadow-[0_0_24px_rgba(198,164,91,0.16)]">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border border-[#C6A45B]/25 blur-sm" aria-hidden="true" />
        <div className="absolute -right-4 -top-6 h-24 w-24 rounded-full border border-[#C6A45B]/20" aria-hidden="true" />

        <div className="relative p-5 sm:p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C6A45B]/50 bg-black/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E0BD70] sm:text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Customer command centre
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#C4C4C4] sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF63]" /> NEXA account
            </span>
          </div>

          <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight text-[#E0BD70] sm:text-3xl md:text-4xl">
            {loading ? "Welcome to NEXA" : `Welcome back, ${firstName}!`}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#C4C4C4] sm:text-base">
            Your shopping, customer identity, account guidance and services — together in one place.
          </p>

          {email && (
            <p className="mt-4 inline-flex max-w-full flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-[#BEBEBE]">
              <UserRound className="h-4 w-4 shrink-0 text-[#D4AF63]" />
              <span className="break-all">Signed in as {email}</span>
            </p>
          )}
        </div>

        <div className="relative grid gap-3 border-t border-[#C6A45B]/25 bg-black/35 p-4 sm:grid-cols-2 sm:p-5 md:p-6">
          <div className="min-w-0 rounded-xl border border-[#C6A45B]/45 bg-[#090909]/90 p-4 shadow-[0_0_16px_rgba(198,164,91,0.08)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A75F] sm:text-xs">
                  Customer identification
                </p>
                <p className="mt-2 text-xs text-[#B8B8B8]">Your NEXA customer ID</p>
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#C6A45B]/45 bg-[#17130B]">
                <ShieldCheck className="h-5 w-5 text-[#D4AF63]" />
              </span>
            </div>
            <p className="mt-2 break-all font-mono text-xl font-extrabold tracking-wide text-[#E0BD70] sm:text-2xl">
              {loading ? "Loading ID…" : displayCustomerCode}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(announcement?.new_identity_code || customerCode) && (
                <button
                  type="button"
                  onClick={() => void copyCustomerCode()}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#C6A45B]/45 px-3 py-2 text-xs font-semibold text-[#E0BD70] transition hover:bg-[#C6A45B]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0BD70]"
                >
                  {copiedId ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedId ? "Copied" : "Copy customer ID"}
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-[#BEBEBE]">
                <LockKeyhole className="h-3.5 w-3.5 text-[#D4AF63]" /> Identification only
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#AFAFAF]">
              Use this ID for identification when speaking with NEXA. It is not your password or a payment credential.
            </p>
          </div>

          <div className="min-w-0 rounded-xl border border-white/15 bg-[#0C0C0C]/90 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#BFC0C2] sm:text-xs">
              Account snapshot
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#C6A45B]/45 bg-[#17130B] text-sm font-bold text-[#E0BD70]">
                {(firstName === "there" ? "N" : firstName.charAt(0).toUpperCase())}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#E0BD70]">
                  {loading ? "Loading profile…" : fullName.trim() || "NEXA customer"}
                </p>
                <p className="mt-0.5 text-xs text-[#B8B8B8]">Customer account</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/10 bg-black/35 p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#969696]">Profile phone</p>
                <p className="mt-1 break-words text-xs font-semibold text-[#D5D5D5]">{phone || "Not on file"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/35 p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#969696]">Account status</p>
                <p className="mt-1 text-xs font-semibold text-[#D4AF63]">{email ? "Signed in" : loading ? "Checking…" : "Sign-in needed"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {profileError && (
        <p role="alert" className="rounded-xl border border-[#A8A8A8]/30 bg-[#111111] p-3 text-sm text-[#D5D5D5]">
          <Info className="mr-2 inline h-4 w-4 text-[#D4AF63]" />{profileError}
        </p>
      )}
        {announcement && (
        <section className="rounded-2xl border border-[#C6A45B]/70 bg-[linear-gradient(135deg,rgba(198,164,91,0.12),rgba(8,8,8,1)_60%)] p-4 shadow-[0_0_18px_rgba(198,164,91,0.14)] sm:p-5">
          {announcementOpen ? (
            <div role="status" aria-live="polite">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C6A45B]/55 bg-black/60">
                  <Sparkles className="h-5 w-5 text-[#E0BD70]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF63] sm:text-xs">{announcement.show_banner ? "Important account update" : "NEXA identity information"}</p>
                  <h2 className="mt-1 text-lg font-bold text-[#E0BD70] sm:text-xl">{announcement.show_banner ? "Your permanent NEXA ID is here" : "Your permanent NEXA identity"}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#C4C4C4]">
                    Your customer identity is shown below. Your account remains the account you signed in to; this notice does not create a new account.
                  </p>
                  <p className="mt-3 break-all font-mono text-xl font-extrabold text-[#E0BD70] sm:text-2xl">{announcement.new_identity_code}</p>
                  <p className="mt-2 text-xs leading-5 text-[#B8B8B8]">{announcement.show_banner ? `Notice ${announcement.display_number} of 3. ` : ""}Keep this ID for NEXA identification. It is not a password or payment credential.</p>
                  <button type="button" onClick={() => setAnnouncementOpen(false)} className="mt-4 min-h-10 rounded-lg border border-[#C6A45B]/55 px-4 py-2 text-xs font-semibold text-[#E0BD70] transition hover:bg-[#C6A45B]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0BD70]">Dismiss for now</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF63]">NEXA identity notice</p>
                <p className="mt-1 text-sm text-[#C4C4C4]">Your permanent customer ID is available.</p>
              </div>
              <button type="button" onClick={() => setAnnouncementOpen(true)} className="min-h-10 rounded-lg border border-[#C6A45B]/55 px-4 py-2 text-xs font-semibold text-[#E0BD70] transition hover:bg-[#C6A45B]/10">View notice</button>
            </div>
          )}
        </section>
      )}

      {announcementError && (
        <p role="status" className="rounded-xl border border-white/15 bg-[#101010] p-3 text-xs leading-5 text-[#BEBEBE]">
          <Info className="mr-2 inline h-4 w-4 text-[#D4AF63]" />{announcementError}
        </p>
      )}

      <section className="space-y-4" aria-labelledby="services-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B8B8B8] sm:text-xs">Your NEXA tools</p>
            <h2 id="services-heading" className="mt-1 font-display text-xl font-bold text-[#E0BD70] sm:text-2xl">Customer services</h2>
            <p className="mt-1 text-sm leading-5 text-[#B8B8B8]">Find your account tools and shopping services.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Search customer services</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A8A8]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search services…"
              className="min-h-11 w-full rounded-xl border border-[#C6A45B]/35 bg-[#090909] py-2 pl-9 pr-3 text-sm text-[#D5D5D5] outline-none placeholder:text-[#777777] focus:border-[#E0BD70] focus:ring-2 focus:ring-[#C6A45B]/20"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleServices.map((service) => {
            const Icon = service.icon;
            const card = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C6A45B]/50 bg-[#15120B] sm:h-11 sm:w-11">
                    <Icon className="h-5 w-5 text-[#D4AF63]" />
                  </span>
                  <span className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wide sm:text-[10px] ${service.status === "available" ? "border-[#C6A45B]/55 text-[#E0BD70]" : "border-white/15 text-[#AFAFAF]"}`}>
                    {service.status === "available" ? "Available" : "Coming soon"}
                  </span>
                </div>
                <span className="mt-3 text-sm font-bold leading-5 text-[#E0BD70] sm:text-base">{service.title}</span>
                <span className="mt-1 text-xs leading-5 text-[#B8B8B8]">{service.description}</span>
                <span className="mt-auto flex items-center gap-1 pt-4 text-xs font-semibold text-[#D4AF63]">
                  {service.status === "available" ? "Open service" : "In development"}
                  {service.status === "available" && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />}
                </span>
              </>
            );

            return service.status === "available" ? (
              <Link
                key={service.title}
                to={service.to}
                className="group flex min-h-40 flex-col rounded-xl border border-[#C6A45B]/55 bg-[radial-gradient(ellipse_at_top_left,rgba(198,164,91,0.075),transparent_52%),#090909] p-3 text-[#D5D5D5] shadow-[0_0_12px_rgba(198,164,91,0.09)] transition duration-200 hover:-translate-y-0.5 hover:border-[#E0BD70] hover:shadow-[0_0_22px_rgba(198,164,91,0.23)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0BD70] sm:min-h-44 sm:p-4"
              >
                {card}
              </Link>
            ) : (
              <div key={service.title} aria-label={`${service.title}, coming soon`} className="flex min-h-40 cursor-not-allowed flex-col rounded-xl border border-white/10 bg-[#080808] p-3 opacity-85 sm:min-h-44 sm:p-4">
                {card}
              </div>
            );
          })}
        </div>

        {visibleServices.length === 0 && (
          <div className="rounded-xl border border-[#C6A45B]/35 bg-[#090909] p-6 text-center">
            <p className="font-semibold text-[#E0BD70]">No services found</p>
            <p className="mt-1 text-sm text-[#B8B8B8]">Try another search term.</p>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link to="/shop" className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#C6A45B]/50 bg-[#090909] p-4 text-[#D5D5D5] shadow-[0_0_12px_rgba(198,164,91,0.08)] transition hover:border-[#E0BD70] hover:shadow-[0_0_18px_rgba(198,164,91,0.17)]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C6A45B]/45 bg-[#15120B]"><ShoppingBag className="h-5 w-5 text-[#D4AF63]" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#E0BD70]">Continue shopping</span><span className="mt-1 block text-xs leading-5 text-[#B8B8B8]">Browse the NEXA marketplace.</span></span>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#D4AF63] transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link to="/account/returns" className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#C6A45B]/50 bg-[#090909] p-4 text-[#D5D5D5] shadow-[0_0_12px_rgba(198,164,91,0.08)] transition hover:border-[#E0BD70] hover:shadow-[0_0_18px_rgba(198,164,91,0.17)]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C6A45B]/45 bg-[#15120B]"><CircleHelp className="h-5 w-5 text-[#D4AF63]" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#E0BD70]">Help & support</span><span className="mt-1 block text-xs leading-5 text-[#B8B8B8]">Open support information. The current support route may still be a placeholder.</span></span>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#D4AF63] transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>

      <section className="space-y-3" aria-labelledby="policy-heading">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B8B8B8] sm:text-xs">Customer information</p>
          <h2 id="policy-heading" className="mt-1 font-display text-xl font-bold text-[#E0BD70] sm:text-2xl">Policies & important guidance</h2>
          <p className="mt-1 text-sm leading-5 text-[#B8B8B8]">Open a panel to read the current dashboard guidance.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {POLICY_GUIDES.map((policy) => (
            <details key={policy.title} className="group rounded-xl border border-[#C6A45B]/40 bg-[#090909] p-4 shadow-[0_0_10px_rgba(198,164,91,0.07)] open:border-[#C6A45B]/70 open:shadow-[0_0_18px_rgba(198,164,91,0.14)]">
              <summary className="cursor-pointer list-none text-sm font-bold text-[#E0BD70] outline-none focus-visible:ring-2 focus-visible:ring-[#E0BD70]">
                <span className="flex items-start gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#C6A45B]/40 bg-[#15120B]"><ShieldCheck className="h-4 w-4 text-[#D4AF63]" /></span><span className="min-w-0 flex-1">{policy.title}<span className="mt-1 block text-xs font-normal leading-5 text-[#B8B8B8]">{policy.summary}</span></span><span className="ml-1 text-lg text-[#D4AF63] transition-transform group-open:rotate-45">+</span></span>
              </summary>
              <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-6 text-[#C4C4C4]">{policy.body}</p>
            </details>
          ))}
        </div>
        <p className="rounded-lg border border-white/10 bg-[#0A0A0A] p-3 text-[11px] leading-5 text-[#969696]">
          Important: the current repository does not contain the full approved NEXA legal-policy pages or verified company support phone/email details. These dashboard panels are honest guidance, not a substitute for the official policy documents. No phone number, email address, refund promise, or delivery commitment has been invented here.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <GlowCard className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C6A45B]/45 bg-[#15120B]"><UserRound className="h-5 w-5 text-[#D4AF63]" /></span>
            <div className="min-w-0">
              <h2 className="font-bold text-[#E0BD70]">Your contact details</h2>
              <p className="mt-1 text-xs leading-5 text-[#B8B8B8]">Details read from your own customer profile.</p>
            </div>
          </div>
          <dl className="mt-4 space-y-3 text-xs">
            <div><dt className="text-[#909090]">Account email</dt><dd className="mt-1 break-all text-[#D5D5D5]">{email || (loading ? "Loading…" : "Not available")}</dd></div>
            <div><dt className="text-[#909090]">Profile phone</dt><dd className="mt-1 break-words text-[#D5D5D5]">{phone || "No phone number saved on this profile"}</dd></div>
          </dl>
          <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-[#969696]">These are your personal details, not NEXA's company support contacts.</p>
        </GlowCard>

        <GlowCard className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C6A45B]/45 bg-[#15120B]"><Info className="h-5 w-5 text-[#D4AF63]" /></span>
            <div className="min-w-0">
              <h2 className="font-bold text-[#E0BD70]">NEXA contact centre</h2>
              <p className="mt-1 text-xs leading-5 text-[#B8B8B8]">Support details are not published in the current source files.</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-6 text-[#C4C4C4]">The support page can be opened from this dashboard, but the current source shows that its live support tools are still planned. We need the verified NEXA support phone number and email address before displaying company contact details here.</p>
          <Link to="/account/returns" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#C6A45B]/50 px-3 py-2 text-xs font-semibold text-[#E0BD70] transition hover:bg-[#C6A45B]/10">Open support page <ArrowRight className="h-3.5 w-3.5" /></Link>
        </GlowCard>
      </section>

      <footer className="rounded-2xl border border-[#C6A45B]/35 bg-[linear-gradient(110deg,#0D0D0D,#050505)] px-4 py-5 text-center shadow-[0_0_16px_rgba(198,164,91,0.08)] sm:px-6">
        <p className="font-display text-sm font-extrabold tracking-[0.16em] text-[#E0BD70] sm:text-base">NEXA TRADE MART</p>
        <p className="mt-2 text-xs font-semibold tracking-wide text-[#C4C4C4]">Shop More. Save More. Get Rewarded.</p>
        <div className="mx-auto my-4 h-px max-w-xs bg-gradient-to-r from-transparent via-[#C6A45B]/80 to-transparent" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF63] sm:text-xs">Powered by TJC-OS</p>
        <p className="mt-2 text-[10px] leading-5 text-[#858585]">A customer dashboard view. Access permissions, payments, order records and support tools must be verified by their connected services.</p>
      </footer>
    </div>
  );
}
