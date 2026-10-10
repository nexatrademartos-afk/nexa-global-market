// PREVIEW DATA ONLY — isolated, labeled sample catalogue for UI layout.
// Not real products, prices or stock. Replace with the owner's backend once connected.
export const IS_PREVIEW_DATA = true;

export interface PreviewProduct {
  id: string;
  name: string;
  category: string;
  priceLabel: string; // display only, not a real price
  origin: string;
}

const CATS = ["Fashion", "Home", "Beauty", "Electronics", "Groceries", "Crafts"];
const NAMES = [
  "Woven Market Basket", "Leather Tote", "Shea Body Butter", "Wireless Headphones",
  "Kente Throw", "Ceramic Pour-over", "Brass Cuff", "Hibiscus Tea",
  "Linen Shirt", "Desk Lamp", "Black Soap Bar", "Smart Speaker",
  "Raffia Sandals", "Clay Planter", "Baobab Oil", "Power Bank",
  "Ankara Scarf", "Wooden Bowl Set", "Coffee Beans", "Phone Stand",
];
const ORIGINS = ["Ghana", "Kenya", "Nigeria", "South Africa", "Senegal", "Global"];

export const PREVIEW_PRODUCTS: PreviewProduct[] = NAMES.map((name, i) => ({
  id: `preview-${i + 1}`,
  name,
  category: CATS[i % CATS.length]!,
  priceLabel: "Price TBC",
  origin: ORIGINS[i % ORIGINS.length]!,
}));

export const CATEGORIES = CATS;

export function paginate<T>(items: T[], page: number, size = 8) {
  const total = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(1, page), total);
  return { items: items.slice((p - 1) * size, p * size), page: p, total };
}
