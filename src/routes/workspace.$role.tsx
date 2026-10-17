
import { useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  notFound,
} from "@tanstack/react-router";
import {
  ArrowRight,
  BadgePercent,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Headset,
  LayoutDashboard,
  Package,
  Search,
  ShoppingBag,
  Tags,
  Truck,
  Users,
  Wallet,
  Warehouse,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getWorkspace, type WorkspaceKey } from "@/lib/workspaces";
import { PlannedBadge } from "@/components/states";

type AccessState =
  | { status: "checking" }
  | { status: "signed-out" }
  | { status: "error" }
  | { status: "denied"; roles: WorkspaceKey[] }
  | {
      status: "allowed";
      roles: WorkspaceKey[];
      name: string;
      accountCode: string | null;
    };

const ROLE_LABELS: Record<WorkspaceKey, string> = {
  customer: "Customer",
  partner: "Business Partner",
  delivery: "Delivery",
  commission: "Commission",
  admin: "Admin",
  ceo: "CEO",
  finance: "Finance",
  security: "Security",
};

const ROLE_CODE_PREFIX: Record<WorkspaceKey, string> = {
  customer: "Cust",
  partner: "BP",
  delivery: "Del",
  commission: "Comm",
  admin: "Adm",
  ceo: "CEO",
  finance: "Fin",
  security: "Sec",
};

function roleDisplayCode(
  accountCode: string | null,
  role: WorkspaceKey,
): string | null {
  if (!accountCode) return null;

  const match = accountCode.match(
    /^NTM-(?:Cust|Customer|Adm|Admin|Comm|Del|BP|CEO|Fin|Finance|Sec|Security)-(.+)$/i,
  );

  return match
    ? `NTM-${ROLE_CODE_PREFIX[role]}-${match[1]}`
    : accountCode;
}

const ADMIN_SERVICES = [
  {
    id: "products",
    name: "Products",
    description: "Listings, pricing, publishing and product details.",
    icon: Package,
    live: true,
    keywords: "product items edit add publish price images feature",
    href: "/admin",
  },
  {
    id: "catalogue",
    name: "Catalogue & Categories",
    description: "Organise categories and product collections.",
    icon: Tags,
    live: false,
    keywords: "catalogue catalog categories collections organise",
  },
  {
    id: "orders",
    name: "Orders & Returns",
    description: "Customer orders, returns and order issues.",
    icon: ShoppingBag,
    live: false,
    keywords: "orders returns cancellations refunds customers",
  },
  {
    id: "inventory",
    name: "Inventory & Warehouses",
    description: "Stock visibility and warehouse operations.",
    icon: Warehouse,
    live: false,
    keywords: "inventory stock warehouse warehouses applicants",
  },
  {
    id: "staff",
    name: "Staff & Approvals",
    description: "Eligible staff accounts, applications and access.",
    icon: Users,
    live: false,
    keywords: "staff accounts roles permissions applications approvals suspend",
  },
  {
    id: "suppliers",
    name: "Suppliers & Partners",
    description: "Supplier onboarding and partner relationships.",
    icon: Truck,
    live: false,
    keywords: "suppliers partners businesses onboarding connections",
  },
  {
    id: "marketing",
    name: "Marketing & Campaigns",
    description: "Promotions, banners, discounts and campaigns.",
    icon: BadgePercent,
    live: false,
    keywords: "marketing promotions campaigns banners discounts offers",
  },
  {
    id: "support",
    name: "Support & Policies",
    description: "Customer care, support requests and policies.",
    icon: Headset,
    live: false,
    keywords: "support customer care policies legal help complaints",
  },
  {
    id: "finance",
    name: "Finance & Wallets",
    description: "Wallets, commissions and financial oversight.",
    icon: Wallet,
    live: false,
    keywords: "finance wallet wallets money balances commissions transactions",
  },
  {
    id: "intelligence",
    name: "AI & Intelligence",
    description: "Future AI assistance, alerts and operational insights.",
    icon: BrainCircuit,
    live: false,
    keywords: "AI artificial intelligence assistant insights analytics alerts",
  },
] as const;

const ADMIN_QUICK_LINKS = [
  { id: "home", label: "Home", icon: LayoutDashboard, target: "admin-home" },
  { id: "products", label: "Products", icon: Package, target: "products" },
  {
    id: "approvals",
    label: "Approvals",
    icon: ClipboardCheck,
    target: "staff",
  },
  { id: "orders", label: "Orders", icon: ShoppingBag, target: "orders" },
  { id: "stock", label: "Stock", icon: Warehouse, target: "inventory" },
  { id: "finance", label: "Finance", icon: Wallet, target: "finance" },
] as const;

export const Route = createFileRoute("/workspace/$role")({
  loader: ({ params }) => {
    const workspace = getWorkspace(params.role);

    if (!workspace || workspace.key === "customer") {
      throw notFound();
    }

    return { key: workspace.key };
  },

  head: ({ loaderData }) => {
    const workspace = loaderData && getWorkspace(loaderData.key);

    if (!workspace) {
      return {
        meta: [
          { title: "Workspace not found — NEXA" },
          { name: "robots", content: "noindex" },
        ],
      };
    }

    return {
      meta: [
        { title: `${workspace.name} dashboard — NEXA` },
        { name: "robots", content: "noindex" },
        {
          name: "description",
          content: workspace.description,
        },
      ],
    };
  },

  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Workspace not found</h1>
      <Link to="/account" className="btn btn-primary mt-4">
        Go to my account
      </Link>
    </div>
  ),

  component: WorkspacePage,
});

function WorkspacePage() {
  const workspace = getWorkspace(Route.useLoaderData().key)!;

  const [access, setAccess] = useState<AccessState>({
    status: "checking",
  });

  const [showAdminApplicationNotice, setShowAdminApplicationNotice] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      setAccess({ status: "checking" });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        setAccess({ status: "signed-out" });
        return;
      }

      const [rolesResult, profileResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id),

        supabase
          .from("profiles")
          .select("full_name, customer_code")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (!active) return;

      if (rolesResult.error || !rolesResult.data) {
        console.error(
          "Workspace role verification failed:",
          rolesResult.error,
        );
        setAccess({ status: "error" });
        return;
      }

      const assignedRoles = [
        ...new Set(rolesResult.data.map((row) => row.role)),
      ].filter((role): role is WorkspaceKey =>
        Object.prototype.hasOwnProperty.call(ROLE_LABELS, role),
      );

      if (!assignedRoles.includes(workspace.key)) {
        setAccess({
          status: "denied",
          roles: assignedRoles,
        });
        return;
      }

      if (profileResult.error) {
        console.error(
          "Workspace profile lookup failed:",
          profileResult.error,
        );
      }

      const profile = profileResult.data;

      setAccess({
        status: "allowed",
        roles: assignedRoles,
        name:
          profile?.full_name?.trim() ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "NEXA member",
        accountCode: profile?.customer_code ?? null,
      });
    }

    void verifyAccess();

    return () => {
      active = false;
    };
  }, [workspace.key]);

  return (
    <main
      className={`mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-9 ${
        workspace.key === "admin" ? "pb-24 md:pb-9" : ""
      }`}
    >
      {access.status === "checking" && (
        <section className="surface rounded-2xl p-6" role="status">
          Verifying your account and approved workspace…
        </section>
      )}

      {access.status === "signed-out" && (
        <section className="surface rounded-2xl border border-gold/30 p-6">
          <h1 className="text-2xl font-bold">Sign in to continue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to the account approved for the {workspace.name} workspace.
          </p>
          <Link to="/sign-in" className="btn btn-primary mt-4">
            Sign in
          </Link>
        </section>
      )}

      {access.status === "error" && (
        <section className="surface rounded-2xl border border-red-500/30 p-6">
          <h1 className="text-xl font-bold">
            We couldn't verify your access
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your workspace has not been opened. Refresh and try again. If
            the problem continues, the role lookup or account permissions
            need investigation.
          </p>
          <button
            type="button"
            className="btn btn-outline mt-4"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </section>
      )}

      {access.status === "denied" && (
        <section className="surface rounded-2xl border border-gold/30 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            NEXA · Protected workspace
          </p>

          {showAdminApplicationNotice && workspace.key === "admin" ? (
            <>
              <h1 className="mt-2 text-2xl font-bold">
                Admin Applications — Coming Soon
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                The Admin application process is not available yet. When it
                launches, applications will be handled separately from the
                customer dashboard's existing role applications. This notice
                does not grant workspace access.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAdminApplicationNotice(false)}
                >
                  Back
                </button>
                <Link to="/account" className="btn btn-primary">
                  Return to Customer Dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-2 text-2xl font-bold">
                Your account is not authorised to access this workspace
              </h1>

              <p className="mt-3 text-sm text-muted-foreground">
                Your account does not have the approved role required to
                access the {workspace.name} workspace. Access is granted only
                after the appropriate authorisation.
              </p>

              {access.roles.length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Your currently assigned role
                  {access.roles.length === 1 ? " is " : "s are "}
                  <strong className="text-foreground">
                    {access.roles.map((role) => ROLE_LABELS[role]).join(", ")}
                  </strong>.
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                {access.roles.map((role) =>
                  role === "customer" ? (
                    <Link
                      key={role}
                      to="/account"
                      className="btn btn-outline"
                    >
                      Open Customer Dashboard
                    </Link>
                  ) : (
                    <a
                      key={role}
                      href={`/workspace/${role}`}
                      className="btn btn-outline"
                    >
                      Open {ROLE_LABELS[role]}
                    </a>
                  ),
                )}

                {workspace.key === "admin" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowAdminApplicationNotice(true)}
                  >
                    Apply for Admin Access
                  </button>
                )}

                <Link to="/account" className="btn btn-outline">
                  Return to Customer Dashboard
                </Link>
              </div>
            </>
          )}
        </section>
      )}

      {access.status === "allowed" && (
        <>
          {workspace.key === "admin" ? (
            <AdminDashboard
              name={access.name}
              accountCode={roleDisplayCode(access.accountCode, "admin")}
              roles={access.roles}
            />
          ) : (
            <StandardWorkspace
              workspace={workspace}
              access={access}
            />
          )}
        </>
      )}
    </main>
  );
}

function AdminDashboard({
  name,
  accountCode,
  roles,
}: {
  name: string;
  accountCode: string | null;
  roles: WorkspaceKey[];
}) {
  const [search, setSearch] = useState("");

  const firstName = name.trim().split(/\s+/)[0] || "Admin";

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return ADMIN_SERVICES;

    return ADMIN_SERVICES.filter((service) =>
      `${service.name} ${service.description} ${service.keywords}`
        .toLowerCase()
        .includes(query),
    );
  }, [search]);

  function goToSection(target: string) {
    if (target === "admin-home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    document.getElementById(`admin-service-${target}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  return (
    <>
      <header
        id="admin-home"
        className="overflow-hidden rounded-3xl border border-gold/40 bg-ink p-5 text-ink-foreground shadow-[0_8px_30px_rgba(0,0,0,0.18)] sm:p-7 md:p-8"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold sm:text-xs">
          NEXA GLOBAL MART · ADMINISTRATION
        </p>

        <h1 className="mt-3 text-2xl font-bold sm:text-3xl md:text-4xl">
          Welcome back, {firstName}
        </h1>

        <p className="mt-2 text-sm text-ink-foreground/70">
          Administration Dashboard
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="min-w-0 rounded-xl border border-white/15 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-ink-foreground/60">
              Admin ID
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-gold">
              {accountCode ?? "Account ID unavailable"}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium">Admin workspace</span>
          </div>
        </div>
      </header>

      <section aria-labelledby="admin-services-title" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="admin-services-title" className="text-xl font-bold">
              Administration Services
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Find the tools you need.
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {filteredServices.length} services
          </span>
        </div>

        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-background px-4 focus-within:border-gold">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search services…"
            aria-label="Search administration services"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear service search"
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredServices.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.id}
                  id={`admin-service-${service.id}`}
                  className={`group flex min-h-36 flex-col rounded-2xl border border-border bg-card p-3 transition-colors sm:min-h-40 sm:p-4 ${
                    service.live
                      ? "hover:border-gold/70 hover:shadow-[0_4px_20px_rgba(212,175,55,0.08)]"
                      : "opacity-90"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gold/10 text-gold sm:h-11 sm:w-11">
                      <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                    </div>

                    {service.live ? (
                      <span className="rounded-full border border-emerald-500/30 px-2 py-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                        Available
                      </span>
                    ) : (
                      <PlannedBadge label="Coming soon" />
                    )}
                  </div>

                  <h3 className="mt-3 text-sm font-semibold leading-snug sm:text-base">
                    {service.name}
                  </h3>

                  <p className="mt-1 flex-1 text-xs leading-5 text-muted-foreground">
                    {service.description}
                  </p>

                  {service.live && (
                    <a
                      href={service.href}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
                    >
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="surface rounded-xl border p-6 text-center">
            <Search className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 font-semibold">No matching services</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another search term.
            </p>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="btn btn-outline mt-4"
            >
              Clear search
            </button>
          </div>
        )}
      </section>

      <section className="surface rounded-2xl border p-4 sm:p-5">
        <h2 className="font-semibold">Workspace</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {roles
            .filter((role) => role !== "admin")
            .map((role) =>
              role === "customer" ? (
                <Link
                  key={role}
                  to="/account"
                  className="btn btn-outline text-sm"
                >
                  Open Customer
                </Link>
              ) : (
                <a
                  key={role}
                  href={`/workspace/${role}`}
                  className="btn btn-outline text-sm"
                >
                  Open {ROLE_LABELS[role]}
                </a>
              ),
            )}

          <a href="/shop" className="btn btn-outline text-sm">
            Browse marketplace
          </a>
        </div>
      </section>

      <nav
        aria-label="Admin quick navigation"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-gold/30 bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_20px_rgba(0,0,0,0.2)] backdrop-blur md:hidden"
      >
        {ADMIN_QUICK_LINKS.map(({ id, label, icon: Icon, target }) => (
          <button
            key={id}
            type="button"
            onClick={() => goToSection(target)}
            className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-muted-foreground transition-colors hover:text-gold"
            aria-label={`Go to ${label}`}
          >
            <Icon className="h-5 w-5" />
            <span className="max-w-full truncate text-[9px] font-medium sm:text-[10px]">
              {label}
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}

function StandardWorkspace({
  workspace,
  access,
}: {
  workspace: NonNullable<ReturnType<typeof getWorkspace>>;
  access: Extract<AccessState, { status: "allowed" }>;
}) {
  return (
    <>
      <header className="overflow-hidden rounded-3xl border border-gold/40 bg-ink p-6 text-ink-foreground md:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
          NEXA · {workspace.short} workspace
        </p>

        <h1 className="mt-3 text-3xl font-bold md:text-4xl">
          Welcome back, {access.name.trim().split(/\s+/)[0]}
        </h1>

        <p className="mt-3 text-sm leading-6 text-ink-foreground/75">
          Hello, {access.name}. You are in your authorised{" "}
          {workspace.name} workspace. Your NEXA account and shared
          platform connection remain the same.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-white/15 px-4 py-3">
            <p className="text-xs text-ink-foreground/65">
              Your {ROLE_LABELS[workspace.key]} ID
            </p>
            <p className="mt-1 font-semibold text-gold">
              {roleDisplayCode(access.accountCode, workspace.key) ??
                "Existing account ID not available"}
            </p>
          </div>

          <div className="rounded-xl border border-white/15 px-4 py-3">
            <p className="text-xs text-ink-foreground/65">
              Verified workspace
            </p>
            <p className="mt-1 font-semibold">
              {ROLE_LABELS[workspace.key]}
            </p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-xl font-bold">
          Your {workspace.name} workspace
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Your workspace is connected to the same NEXA platform. Modules
          marked Coming soon are not yet operational.
        </p>

        {workspace.modules.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {workspace.modules.map((module) => (
              <li
                key={module.name}
                className="surface flex items-start justify-between gap-3 rounded-xl border p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{module.name}</p>
                  {module.note && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {module.note}
                    </p>
                  )}
                </div>
                <PlannedBadge label="Coming soon" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="surface rounded-xl border p-5">
            <p className="font-semibold">Workspace ready</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your authorised workspace is open.
            </p>
          </div>
        )}
      </section>

      <section className="surface rounded-2xl border p-5">
        <h2 className="font-bold">Switch workspace</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Move to another workspace assigned to this same account without
          signing out.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {access.roles.map((role) =>
            role === workspace.key ? null : role === "customer" ? (
              <Link
                key={role}
                to="/account"
                className="btn btn-outline"
              >
                Open Customer
              </Link>
            ) : (
              <a
                key={role}
                href={`/workspace/${role}`}
                className="btn btn-outline"
              >
                Open {ROLE_LABELS[role]}
              </a>
            ),
          )}

          <a href="/shop" className="btn btn-outline">
            Browse marketplace
          </a>
        </div>
      </section>
    </>
  );
}
