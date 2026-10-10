import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PREVIEW_PRODUCTS } from "@/lib/preview-data";
import { ProductTile } from "@/components/ProductCard";
import { PlannedBadge, PreviewNotice } from "@/components/states";
import { useLocalList } from "@/lib/local-list";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    const product = PREVIEW_PRODUCTS.find((p) => p.id === params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Product not found — NEXA" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.product.name} — NEXA Trade Mart`;
    return { meta: [
      { title: t }, { name: "description", content: `${loaderData.product.name} from ${loaderData.product.origin}.` },
      { property: "og:title", content: t }, { property: "og:description", content: `${loaderData.product.category} on NEXA Trade Mart.` },
    ] };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Product not found</h1>
      <Link to="/shop" search={{ page: 1 }} className="btn btn-primary mt-4">Back to shop</Link>
    </div>
  ),
  component: Product,
});

function Product() {
  const { product: p } = Route.useLoaderData();
  const cart = useLocalList("nexa-cart");
  const wish = useLocalList("nexa-wishlist");
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-2">
      <ProductTile p={p} className="aspect-square rounded-2xl" />
      <div className="space-y-4">
        <PreviewNotice />
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.category} · {p.origin}</p>
        <h1 className="text-3xl font-bold">{p.name}</h1>
        <p className="text-lg">{p.priceLabel}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => cart.toggle(p.id)} className="btn btn-primary flex-1">{cart.has(p.id) ? "Remove from cart" : "Add to cart"}</button>
          <button onClick={() => wish.toggle(p.id)} className="btn btn-outline">{wish.has(p.id) ? "Saved" : "Save"}</button>
        </div>
        <div className="surface space-y-2 p-4 text-sm">
          <div className="flex items-center justify-between"><span>Seller & fulfilment</span><PlannedBadge /></div>
          <div className="flex items-center justify-between"><span>Delivery estimate</span><PlannedBadge /></div>
          <div className="flex items-center justify-between"><span>Reviews</span><PlannedBadge /></div>
        </div>
      </div>
    </div>
  );
}
