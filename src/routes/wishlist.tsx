import { createFileRoute, Link } from "@tanstack/react-router";
import { PREVIEW_PRODUCTS } from "@/lib/preview-data";
import { useLocalList } from "@/lib/local-list";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState, PreviewNotice, SkeletonGrid } from "@/components/states";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [
    { title: "Wishlist — NEXA Trade Mart" }, { name: "description", content: "Items you saved on NEXA." },
    { property: "og:title", content: "Wishlist — NEXA Trade Mart" }, { property: "og:description", content: "Your saved NEXA items." },
  ] }),
  component: () => <div className="mx-auto max-w-6xl px-4 py-6"><WishlistView /></div>,
});

export function WishlistView() {
  const wish = useLocalList("nexa-wishlist");
  const items = PREVIEW_PRODUCTS.filter((p) => wish.ids.includes(p.id));
  if (!wish.ready) return <SkeletonGrid />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      <PreviewNotice>Saved on this device only until accounts are connected.</PreviewNotice>
      {items.length === 0
        ? <EmptyState title="Nothing saved yet" body="Tap the heart on any product to save it." action={<Link to="/shop" search={{ page: 1 }} className="btn btn-primary">Browse</Link>} />
        : <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
    </div>
  );
}
