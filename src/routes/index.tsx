import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import { CATEGORIES, PREVIEW_PRODUCTS } from "@/lib/preview-data";
import { ProductCard } from "@/components/ProductCard";
import { PlannedBadge, PreviewNotice } from "@/components/states";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXA Trade Mart — Shop More. Save More. Get Rewarded." },
      { name: "description", content: "African-rooted global marketplace. Shop curated goods, save more and earn rewards." },
      { property: "og:title", content: "NEXA Trade Mart" },
      { property: "og:description", content: "Shop More. Save More. Get Rewarded. African-rooted, globally minded commerce." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2 md:items-center md:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">African-rooted · Global</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.05] md:text-6xl">
              Shop More.<br />Save More.<br /><span className="text-gold">Get Rewarded.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm opacity-75">Curated goods from makers, shops and brands across Africa and the world — in one trusted marketplace.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/shop" className="btn btn-gold">Start shopping</Link>
              <Link to="/sell" className="btn btn-on-ink">Sell on NEXA</Link>
            </div>
          </div>
          <img src={hero} alt="Woven basket, leather bag, gold jewellery and headphones" width={1280} height={960}
            fetchPriority="high" className="aspect-[4/3] w-full rounded-2xl object-cover" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-xl font-bold">Categories</h2>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2">
          {CATEGORIES.map((c) => (
            <Link key={c} to="/shop" search={{ category: c, page: 1 }} className="btn btn-outline shrink-0">{c}</Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-3 px-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Featured</h2>
          <Link to="/shop" className="text-sm font-semibold underline underline-offset-4">View all</Link>
        </div>
        <PreviewNotice />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PREVIEW_PRODUCTS.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-3 px-4 md:grid-cols-3">
        {[
          ["NEXA Rewards", "Earn on every order."],
          ["Referrals", "Invite friends, get rewarded."],
          ["B2B & wholesale", "Bulk buying for businesses."],
        ].map(([t, b]) => (
          <div key={t} className="surface flex items-start justify-between gap-3 p-5">
            <div><h3 className="font-semibold">{t}</h3><p className="text-sm text-muted-foreground">{b}</p></div>
            <PlannedBadge label="Coming soon" />
          </div>
        ))}
      </section>
    </>
  );
}
