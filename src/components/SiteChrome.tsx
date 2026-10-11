
import { Link } from "@tanstack/react-router";
import {
  Heart,
  Home,
  Search,
  ShoppingBag,
  User,
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  Clock,
  FileText,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useLocalList } from "@/lib/local-list";

export function Logo() {
  return (
    <Link
      to="/"
      className="flex items-baseline gap-1 font-display text-lg font-bold tracking-tight"
    >
      NEXA<span className="text-gold">·</span>
      <span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
        TRADE MART
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const cart = useLocalList("nexa-cart");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center gap-6">
          <Logo />
          <nav className="hidden gap-5 text-sm md:flex" aria-label="Main navigation">
            <Link to="/" activeOptions={{ exact: true }}>Home</Link>
            <Link to="/shop" activeProps={{ className: "font-semibold" }}>Shop</Link>
            <Link to="/account" activeProps={{ className: "font-semibold" }}>Account</Link>
            <Link to="/sell">Sell on NEXA</Link>
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="hidden h-11 w-11 place-items-center rounded-full md:grid"
          >
            <Heart className="h-5 w-5" />
          </Link>

          <Link
            to="/cart"
            aria-label="Cart"
            className="relative grid h-11 w-11 place-items-center rounded-full"
          >
            <ShoppingBag className="h-5 w-5" />
            {cart.ids.length > 0 && (
              <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                {cart.ids.length}
              </span>
            )}
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
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background md:hidden"
    >
      {items.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/" }}
          activeProps={{ className: "text-foreground" }}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground"
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-ink pb-24 text-ink-foreground md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">
          <section>
            <p className="font-display text-xl font-bold">
              NEXA <span className="text-gold">TRADE MART</span>
            </p>
            <p className="mt-2 text-sm opacity-75">
              Shop More. Save More. Get Rewarded.
            </p>
            <p className="mt-3 text-sm leading-6 opacity-65">
              An African-rooted marketplace built to make shopping simpler,
              more accessible and rewarding.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              About & information
            </h2>
            <nav className="mt-4 grid gap-3 text-sm opacity-80">
              <Link to="/about" className="hover:text-gold">About NEXA</Link>
              <Link to="/contact" className="hover:text-gold">Contact Us</Link>
              <Link to="/trust" className="hover:text-gold">Trust & Safety</Link>
              <Link to="/faq" className="hover:text-gold">Help & FAQs</Link>
            </nav>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Policies & guidance
            </h2>
            <nav className="mt-4 grid gap-3 text-sm opacity-80">
              <Link to="/terms" className="hover:text-gold">Terms & Conditions</Link>
              <Link to="/privacy" className="hover:text-gold">Privacy Policy</Link>
              <Link to="/delivery" className="hover:text-gold">Delivery Policy</Link>
              <Link to="/returns-policy" className="hover:text-gold">Returns & Refunds</Link>
              <Link to="/shopping-guide" className="hover:text-gold">Shopping Guide</Link>
            </nav>
          </section>
        </div>

        <div className="my-8 h-px bg-white/10" />

        <section aria-labelledby="nexa-contact-heading">
          <h2
            id="nexa-contact-heading"
            className="text-xs font-bold uppercase tracking-[0.2em] text-gold"
          >
            Contact NEXA
          </h2>

          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="mailto:nexatrademart@gmail.com"
              className="flex items-start gap-3 hover:text-gold"
            >
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>nexatrademart@gmail.com</span>
            </a>

            <a
              href="https://wa.me/27684963972"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 hover:text-gold"
            >
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>WhatsApp: +27 68 496 3972</span>
            </a>

            <a
              href="tel:+27656191335"
              className="flex items-start gap-3 hover:text-gold"
            >
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>Support: 065 619 1335</span>
            </a>

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>Port Elizabeth / Gqeberha, South Africa</span>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>Monday–Saturday, 08:00–18:00</span>
            </div>
          </div>
        </section>

        <div className="my-8 h-px bg-white/10" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Powered by <span className="text-gold">TJC-OS</span>
            </p>
            <p className="mt-2 text-xs opacity-60">
              Intelligent commerce. Built for global opportunity.
            </p>
          </div>

          <p className="text-xs opacity-50">
            © {new Date().getFullYear()} NEXA TRADE MART. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
