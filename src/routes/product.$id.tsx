import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { BRAND, brandPageTitle } from "@/lib/brand";
import {
  buildProductWhatsAppMessage,
  openWhatsApp,
} from "@/lib/Whatsapp";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { ProductTile } from "@/components/ProductCard";
import { PlannedBadge } from "@/components/states";
import {
fetchStoreCatalogue,
formatStorePrice,
} from "@/lib/preview-data";
import { useLocalList } from "@/lib/local-list";

export const Route = createFileRoute("/product/$id")({
loader: async ({ params }) => {
const catalogue = await fetchStoreCatalogue();

const product = catalogue.products.find(
  (item) => item.id === params.id,
);

if (!product) {
  throw notFound();
}

const categoryName =
  catalogue.categories.find(
    (category) => category.id === product.category_id,
  )?.name ?? "Marketplace";

return { product, categoryName };

},

head: ({ loaderData }) => {
if (!loaderData) {
return {
meta: [
{ title: brandPageTitle("Product not found") },
{ name: "robots", content: "noindex" },
],
};
}

const { product, categoryName } = loaderData;
const title = brandPageTitle(product.name);

return {
  meta: [
    { title },
    {
      name: "description",
      content: `Shop ${product.name} in ${categoryName} at ${BRAND.name}.`,
    },
    { property: "og:title", content: title },
    {
      property: "og:description",
      content: `Explore ${product.name} at ${BRAND.name}.`,
    },
  ],
};

},

notFoundComponent: () => (
<div className="mx-auto max-w-md px-4 py-16 text-center">
<h1 className="text-2xl font-bold">Product not found</h1>
<p className="mt-2 text-sm text-muted-foreground">
This product may no longer be available.
</p>
<Link
to="/shop"
search={{ page: 1 }}
className="btn btn-primary mt-4"
>
Back to shop
</Link>
</div>
),

component: Product,
});

function Product() {
const { product: p, categoryName } = Route.useLoaderData();
const navigate = useNavigate();
const cart = useLocalList("nexa-cart");
const wish = useLocalList("nexa-wishlist");

function addToCart() {
if (p.stock <= 0) return;
cart.add(p.id);
}

function buyNow() {
if (p.stock <= 0) return;
cart.add(p.id);
void navigate({ to: "/cart" });
}

  function orderProductOnWhatsApp() {
  if (p.stock <= 0) return;

  openWhatsApp(buildProductWhatsAppMessage(p, 1));
  }

return (
<div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-2">
<ProductTile
p={p}
className="aspect-square rounded-2xl"
/>

  <div className="space-y-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">
      {categoryName}
    </p>

    <h1 className="text-3xl font-bold">{p.name}</h1>

    <div className="flex flex-wrap items-baseline gap-3">
      <p className="text-xl font-semibold">
        {formatStorePrice(p.price)}
      </p>

      {p.compare_at_price !== null &&
        p.compare_at_price > p.price && (
          <p className="text-sm text-muted-foreground line-through">
            {formatStorePrice(p.compare_at_price)}
          </p>
        )}
    </div>

    <p className="text-sm text-muted-foreground">
      {p.stock > 0
        ? `${p.stock} available`
        : "Currently unavailable"}
    </p>

 <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
  <button
    type="button"
    onClick={addToCart}
    disabled={p.stock <= 0}
    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-gold/60 px-3 py-2 text-sm font-semibold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <ShoppingCart className="h-4 w-4 shrink-0" />
    Add to Cart
  </button>

  <button
    type="button"
    onClick={buyNow}
    disabled={p.stock <= 0}
    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gold px-3 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Zap className="h-4 w-4 shrink-0" />
    Buy Now
  </button>

  <button
    type="button"
    onClick={orderProductOnWhatsApp}
    disabled={p.stock <= 0}
    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1DA851] disabled:cursor-not-allowed disabled:opacity-50"
  >
    <WhatsAppIcon className="h-5 w-5 shrink-0" />
    WhatsApp
  </button>
</div>

    <div className="surface space-y-2 p-4 text-sm">
      <div className="flex items-center justify-between">
        <span>Seller & fulfilment</span>
        <PlannedBadge />
      </div>
      <div className="flex items-center justify-between">
        <span>Delivery estimate</span>
        <PlannedBadge />
      </div>
      <div className="flex items-center justify-between">
        <span>Reviews</span>
        <PlannedBadge />
      </div>
    </div>

    <p className="text-xs text-muted-foreground">
      Checkout and payment are not live yet. Adding items to your cart
      does not place an order.
    </p>

    <Link
      to="/shop"
      search={{ page: 1 }}
      className="inline-flex text-sm text-muted-foreground underline underline-offset-4"
    >
      Continue shopping
    </Link>
  </div>
</div>

);
}
