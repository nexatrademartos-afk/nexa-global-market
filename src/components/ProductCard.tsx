import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import {
  formatStorePrice,
  getStoreImageUrl,
  type PreviewProduct,
  type StoreProduct,
} from "@/lib/preview-data";
import { useLocalList } from "@/lib/local-list";

type ProductCardItem = PreviewProduct | StoreProduct;

function isStoreProduct(p: ProductCardItem): p is StoreProduct {
  return "slug" in p && "price" in p;
}

function productImage(p: ProductCardItem): string | null {
  return isStoreProduct(p) ? getStoreImageUrl(p.image_url) : null;
}

export function ProductTile({
  p,
  className = "",
}: {
  p: ProductCardItem;
  className?: string;
}) {
  const image = productImage(p);

  return (
    <div
      className={`relative grid aspect-square place-items-center overflow-hidden bg-ink text-ink-foreground ${className}`}
    >
      {image ? (
        <img
          src={image}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="font-display text-4xl font-bold text-gold/80">
          {p.name.slice(0, 2).toUpperCase()}
        </span>
      )}

      {!isStoreProduct(p) && (
        <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground">
          PREVIEW
        </span>
      )}
    </div>
  );
}

export function ProductCard({
  p,
  categoryName,
}: {
  p: ProductCardItem;
  categoryName?: string;
}) {
  const wish = useLocalList("nexa-wishlist");
  const saved = wish.has(p.id);
  const liveProduct = isStoreProduct(p);

  const categoryLabel = liveProduct
    ? categoryName || "Marketplace"
    : `${p.category} · ${p.origin}`;

  const priceLabel = liveProduct
    ? formatStorePrice(p.price)
    : p.priceLabel;

  const compareAtPrice =
    liveProduct &&
    p.compare_at_price !== null &&
    p.compare_at_price > p.price
      ? formatStorePrice(p.compare_at_price)
      : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <Link
        to="/product/$id"
        params={{ id: p.id }}
        className="block"
        aria-label={`View ${p.name}`}
      >
        <ProductTile p={p} />

        <div className="space-y-1 p-3">
          <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
            {categoryLabel}
          </p>

          <h3 className="line-clamp-2 min-h-10 font-sans text-sm font-semibold">
            {p.name}
          </h3>

          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-sm font-semibold text-foreground">
              {priceLabel}
            </p>

            {compareAtPrice && (
              <p className="text-xs text-muted-foreground line-through">
                {compareAtPrice}
              </p>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => wish.toggle(p.id)}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={saved}
        className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full border border-border bg-background/90 transition-colors hover:bg-background"
      >
        <Heart
          className={`h-5 w-5 ${
            saved ? "fill-gold text-gold" : "text-foreground"
          }`}
        />
      </button>
    </article>
  );
    }
