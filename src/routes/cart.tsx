import { createFileRoute, Link } from "@tanstack/react-router";
import { PREVIEW_PRODUCTS } from "@/lib/preview-data";
import { useLocalList } from "@/lib/local-list";
import { EmptyState, PlannedBadge, PreviewNotice, SkeletonGrid } from "@/components/states";
import { ProductTile } from "@/components/ProductCard";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [
    { title: "Your cart — NEXA Trade Mart" }, { name: "description", content: "Review items in your NEXA cart." },
    { property: "og:title", content: "Cart — NEXA Trade Mart" }, { property: "og:description", content: "Your NEXA shopping cart." },
  ] }),
  component: () => <div className="mx-auto max-w-3xl px-4 py-6"><CartView /></div>,
});

export function CartView() {
  const cart = useLocalList("nexa-cart");
  const items = PREVIEW_PRODUCTS.filter((p) => cart.ids.includes(p.id));
  if (!cart.ready) return <SkeletonGrid count={2} />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cart</h1>
      <PreviewNotice>Cart is saved on this device only until accounts are connected.</PreviewNotice>
      {items.length === 0 ? (
        <EmptyState title="Your cart is empty" body="Browse the shop and add items you love." action={<Link to="/shop" search={{ page: 1 }} className="btn btn-primary">Shop now</Link>} />
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((p) => (
              <li key={p.id} className="surface flex items-center gap-3 p-2">
                <ProductTile p={p} className="h-16 w-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{p.name}</p><p className="text-sm text-muted-foreground">{p.priceLabel}</p></div>
                <button onClick={() => cart.remove(p.id)} className="btn btn-outline">Remove</button>
              </li>
            ))}
          </ul>
          <div className="surface flex items-center justify-between gap-3 p-4">
            <div><p className="font-semibold">Checkout</p><p className="text-xs text-muted-foreground">Payments are not live. No order will be placed.</p></div>
            <PlannedBadge label="Coming soon" />
          </div>
        </>
      )}
    </div>
  );
}
