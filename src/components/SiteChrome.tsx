import { Link } from "@tanstack/react-router";
import { Heart, Home, Search, ShoppingBag, User } from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useLocalList } from "@/lib/local-list";

export function Logo() {
  return (
    <Link to="/" className="flex items-baseline gap-1 font-display text-lg font-bold tracking-tight">
      NEXA<span className="text-gold">·</span><span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">TRADE MART</span>
    </Link>
  );
}

export function SiteHeader() {
  const cart = useLocalList("nexa-cart");
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center gap-6">
          <Logo />
          <nav className="hidden gap-5 text-sm md:flex">
            <Link to="/shop" activeProps={{ className: "font-semibold" }}>Shop</Link>
            <Link to="/sell" activeProps={{ className: "font-semibold" }}>Sell on NEXA</Link>
            <Link to="/account" activeProps={{ className: "font-semibold" }}>Account</Link>
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/wishlist" aria-label="Wishlist" className="hidden h-11 w-11 place-items-center rounded-full md:grid"><Heart className="h-5 w-5" /></Link>
          <Link to="/cart" aria-label="Cart" className="relative grid h-11 w-11 place-items-center rounded-full">
            <ShoppingBag className="h-5 w-5" />
            {cart.ids.length > 0 && <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">{cart.ids.length}</span>}
          </Link>
          <WorkspaceSwitcher />
        </div>
      </div>
    </header>
  );
}

export function MobileTabBar() {
  const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/shop", label: "Shop", icon: Search },
    { to: "/wishlist", label: "Saved", icon: Heart },
    { to: "/cart", label: "Cart", icon: ShoppingBag },
    { to: "/account", label: "Account", icon: User },
  ] as const;
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background md:hidden">
      {items.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} activeOptions={{ exact: to === "/" }} activeProps={{ className: "text-foreground" }}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground">
          <Icon className="h-5 w-5" />{label}
        </Link>
      ))}
    </nav>
  );
}


export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink pb-24 text-ink-foreground md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="font-display text-xl font-bold">
          NEXA <span className="text-gold">TRADE MART</span>
        </p>

        <p className="mt-1 text-sm opacity-70">
          Shop More. Save More. Get Rewarded.
        </p>

        <div className="gold-rule my-6" />

        <p className="text-sm font-semibold tracking-wide">
          Powered by <span className="text-gold">TJC-OS</span>
        </p>

        <p className="mt-2 text-xs opacity-60">
          Intelligent commerce. Built for global opportunity.
        </p>

        <p className="mt-5 text-xs opacity-50">
          © {new Date().getFullYear()} NEXA TRADE MART. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

}
