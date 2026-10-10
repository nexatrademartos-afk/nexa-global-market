import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, PREVIEW_PRODUCTS, paginate } from "@/lib/preview-data";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState, PreviewNotice } from "@/components/states";

type Search = { category?: string; q?: string; page: number };

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s.category === "string" ? s.category : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
    page: Number(s.page) > 0 ? Number(s.page) : 1,
  }),
  head: () => ({
    meta: [
      { title: "Shop — NEXA Trade Mart" },
      { name: "description", content: "Browse fashion, home, beauty, electronics, groceries and crafts on NEXA Trade Mart." },
      { property: "og:title", content: "Shop — NEXA Trade Mart" },
      { property: "og:description", content: "Browse categories across the NEXA marketplace." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category, q, page } = Route.useSearch();
  const filtered = PREVIEW_PRODUCTS.filter(
    (p) => (!category || p.category === category) && (!q || p.name.toLowerCase().includes(q.toLowerCase())),
  );
  const pg = paginate(filtered, page);
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <h1 className="text-3xl font-bold">Shop</h1>
      <form action="/shop" className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" className="field" />
        {category && <input type="hidden" name="category" value={category} />}
        <button className="btn btn-primary">Search</button>
      </form>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link to="/shop" search={{ page: 1 }} className={`btn shrink-0 ${!category ? "btn-primary" : "btn-outline"}`}>All</Link>
        {CATEGORIES.map((c) => (
          <Link key={c} to="/shop" search={{ category: c, page: 1 }} className={`btn shrink-0 ${category === c ? "btn-primary" : "btn-outline"}`}>{c}</Link>
        ))}
      </div>
      <PreviewNotice />
      {pg.items.length === 0 ? (
        <EmptyState title="No products found" body="Try a different search or category." action={<Link to="/shop" search={{ page: 1 }} className="btn btn-outline">Clear filters</Link>} />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{pg.items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
      {pg.total > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
          <Link to="/shop" search={{ category, q, page: pg.page - 1 }} disabled={pg.page <= 1} className="btn btn-outline">Previous</Link>
          <span className="text-sm">Page {pg.page} of {pg.total}</span>
          <Link to="/shop" search={{ category, q, page: pg.page + 1 }} disabled={pg.page >= pg.total} className="btn btn-outline">Next</Link>
        </nav>
      )}
    </div>
  );
}
