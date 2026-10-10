import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const ACCOUNT_NAV = [
  { to: "/account", label: "Overview" },
  { to: "/account/profile", label: "Profile" },
  { to: "/account/addresses", label: "Addresses" },
  { to: "/account/orders", label: "Orders" },
  { to: "/account/cart", label: "Cart" },
  { to: "/account/wishlist", label: "Wishlist" },
  { to: "/account/returns", label: "Returns & support" },
  { to: "/account/rewards", label: "Rewards & referrals" },
  { to: "/account/notifications", label: "Notifications" },
  { to: "/account/settings", label: "Settings & privacy" },
  { to: "/account/applications", label: "Role applications" },
] as const;

export const Route = createFileRoute("/account")({ component: AccountLayout });

function AccountLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
      <aside className="mb-4 md:mb-0">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Customer dashboard</p>
        <nav aria-label="Account" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-col md:gap-0 md:px-0">
          {ACCOUNT_NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
              activeProps={{ className: "bg-primary text-primary-foreground md:bg-secondary md:text-foreground md:font-semibold" }}
              className="flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm md:rounded-lg md:border-0 md:px-3">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0"><Outlet /></section>
    </div>
  );
}
