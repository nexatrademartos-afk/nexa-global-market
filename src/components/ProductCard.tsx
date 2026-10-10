import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { PreviewProduct } from "@/lib/preview-data";
import { useLocalList } from "@/lib/local-list";

export function ProductTile({ p, className = "" }: { p: PreviewProduct; className?: string }) {
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-ink text-ink-foreground ${className}`}>
      <span className="font-display text-4xl font-bold text-gold/80">{p.name.slice(0, 2).toUpperCase()}</span>
      <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground">PREVIEW</span>
    </div>
  );
}

export function ProductCard({ p }: { p: PreviewProduct }) {
  const wish = useLocalList("nexa-wishlist");
  const saved = wish.has(p.id);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card">
      <Link to="/product/$id" params={{ id: p.id }} className="block">
        <ProductTile p={p} className="aspect-square" />
        <div className="space-y-0.5 p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{p.category} · {p.origin}</p>
          <h3 className="line-clamp-1 font-sans text-sm font-semibold">{p.name}</h3>
          <p className="text-sm text-muted-foreground">{p.priceLabel}</p>
        </div>
      </Link>
      <button
        onClick={() => wish.toggle(p.id)}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={saved}
        className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-background/90"
      >
        <Heart className={`h-5 w-5 ${saved ? "fill-gold text-gold" : ""}`} />
      </button>
    </article>
  );
}
