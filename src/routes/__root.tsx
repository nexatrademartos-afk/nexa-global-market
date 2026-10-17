import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import {
  MobileTabBar,
  SiteFooter,
  SiteHeader,
  WelcomeBanner,
} from "@/components/SiteChrome";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary mt-6">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error("NEXA GLOBAL MART route error:", error);

  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn btn-primary"
          >
            Try again
          </button>
          <a href="/" className="btn btn-outline">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route =
  createRootRouteWithContext<{ queryClient: QueryClient }>()({
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { name: "theme-color", content: "#111111" },
        { title: "NEXA GLOBAL MART" },
        {
          name: "description",
          content: "Shop More. Save More. Get Rewarded.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap",
        },
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  });

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  const [signedIn, setSignedIn] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      setSignedIn(!error && Boolean(data.session));
      setSessionReady(true);
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      setSignedIn(Boolean(session));
      setSessionReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAccountPage =
    pathname === "/account" || pathname.startsWith("/account/");

  const isCustomerBrowsePage =
    pathname === "/" ||
    pathname === "/shop" ||
    pathname === "/cart" ||
    pathname === "/wishlist" ||
    pathname === "/support" ||
    pathname.startsWith("/product/");

  const showCustomerQuickNav =
    sessionReady &&
    signedIn &&
    !isAccountPage &&
    isCustomerBrowsePage;

  return (
    <QueryClientProvider client={queryClient}>
      <SiteHeader />
      <WelcomeBanner />

      <main
        className={`min-h-[70vh] ${
          showCustomerQuickNav ? "pb-20 md:pb-0" : ""
        }`}
      >
        <Outlet />
      </main>

      <SiteFooter />
      <MobileTabBar />

      {showCustomerQuickNav && <CustomerQuickNav />}
    </QueryClientProvider>
  );
}

function CustomerQuickNav() {
  return (
    <nav
      aria-label="Customer quick navigation"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-gold/30 bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_20px_rgba(0,0,0,0.3)] backdrop-blur md:hidden"
    >
      <QuickNavItem to="/shop" label="Shop" icon={ShoppingCart} />
      <QuickNavItem
        to="/account/orders"
        label="My Orders"
        icon={Package}
      />
      <QuickNavItem
        to="/account"
        label="Dashboard"
        icon={LayoutGrid}
      />
      <QuickNavItem
        to="/account/settings"
        label="NEXA Wallet"
        icon={Wallet}
      />
      <QuickNavItem
        to="/account/orders"
        label="Delivery"
        icon={Truck}
      />
      <QuickNavItem
        to="/account/profile"
        label="Profile"
        icon={UserRound}
      />
    </nav>
  );
}

function QuickNavItem({
  to,
  label,
  icon: Icon,
}: {
  to:
    | "/shop"
    | "/account"
    | "/account/orders"
    | "/account/settings"
    | "/account/profile";
  label: string;
  icon: typeof ShoppingCart;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      activeProps={{ className: "text-gold" }}
      className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-center text-[9px] leading-tight text-muted-foreground transition-colors hover:text-gold sm:text-[10px]"
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
