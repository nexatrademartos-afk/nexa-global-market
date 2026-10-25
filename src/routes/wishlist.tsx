import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND, brandPageTitle } from "@/lib/brand";
import {
  fetchStoreCatalogue,
  PREVIEW_PRODUCTS,
  type StoreCatalogue,
  type StoreProduct,
  type PreviewProduct,
} from "@/lib/preview-data";
import { useLocalList } from "@/lib/local-list";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState, PreviewNotice, SkeletonGrid } from "@/components/states";

export const Route = createFileRoute("/wishlist")({
  loader: () => fetchStoreCatalogue(),
  head: () => ({
    meta: [
      { title: brandPageTitle("Wishlist") },
      {
        name: "description",
        content: `Items you saved on ${BRAND.shortName}.`,
      },
      { property: "og:title", content: brandPageTitle("Wishlist") },
      {
        property: "og:description",
        content: `Your saved ${BRAND.shortName} items.`,
      },
    ],
  }),
  component: WishlistPageComponent,
});

function WishlistPageComponent() {
  const catalogue = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <WishlistView catalogue={catalogue} />
    </div>
  );
}

export function WishlistView({ catalogue }: { catalogue?: StoreCatalogue }) {
  const wish = useLocalList("nexa-wishlist");

  if (!wish.ready || !catalogue) {
    return <SkeletonGrid count={4} />;
  }

  // Find saved items from live catalogue first, with preview products fallback
  const validItems: (StoreProduct | PreviewProduct)[] = [];
  const staleIds: string[] = [];

  for (const id of wish.ids) {
    const liveProd = catalogue.products.find((p) => p.id === id);
    if (liveProd) {
      validItems.push(liveProd);
      continue;
    }

    const previewProd = PREVIEW_PRODUCTS.find((p) => p.id === id);
    if (previewProd) {
      validItems.push(previewProd);
      continue;
    }

    staleIds.push(id);
  }

  function removeStaleItems() {
    for (const staleId of staleIds) {
      wish.remove(staleId);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Shopping & Savings (Wishlist)</h1>
      <PreviewNotice>
        Your wishlist is saved on this device. Live items link directly to current catalogue
        products.
      </PreviewNotice>

      {staleIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <span>{staleIds.length} saved item(s) are no longer available in the catalogue.</span>
          <button
            type="button"
            onClick={removeStaleItems}
            className="font-semibold text-gold underline underline-offset-2 hover:text-gold/80"
          >
            Remove unavailable items
          </button>
        </div>
      )}

      {validItems.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          body="Tap the heart on any product in the shop to save it to your list."
          action={
            <Link to="/shop" search={{ page: 1 }} className="btn btn-primary">
              Browse products
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {validItems.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
