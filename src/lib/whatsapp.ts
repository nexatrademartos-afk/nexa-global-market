import { BRAND } from "@/lib/brand";

import {
  formatStorePrice,
  type StoreProduct,
} from "@/lib/preview-data";

export const NEXA_WHATSAPP_NUMBER = "27684963972";

export function openWhatsApp(message: string): void {
  const url =
    `https://wa.me/${NEXA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function buildProductWhatsAppMessage(
  product: StoreProduct,
  quantity = 1,
): string {
  const safeQuantity = Math.max(1, Math.floor(quantity));

  return [
    `Hello ${BRAND.name}!`,
    "",
    "I'd like to enquire about this product:",
    `Product: ${product.name}`,
    `Unit price: ${formatStorePrice(product.price)}`,
    `Quantity: ${safeQuantity}`,
    `Subtotal: ${formatStorePrice(product.price * safeQuantity)}`,
    "",
    "Please confirm availability and delivery options.",
  ].join("\n");
}

export interface WhatsAppCartItem {
  product: StoreProduct;
  quantity: number;
}

export function buildCartWhatsAppMessage(
  items: WhatsAppCartItem[],
): string {
  const validItems = items.filter(
    ({ product, quantity }) =>
      Number.isFinite(product.price) &&
      product.price > 0 &&
      Number.isFinite(quantity) &&
      quantity > 0,
  );

  if (validItems.length === 0) {
    return [
      `Hello ${BRAND.name}!`,
      "",
      "I'd like help placing an order.",
      "Please assist me with your available products.",
    ].join("\n");
  }

  const total = validItems.reduce(
    (sum, { product, quantity }) =>
      sum + product.price * quantity,
    0,
  );

  return [
    `Hello ${BRAND.name}!`,
    "",
    "I'd like to place an order for these items:",
    "",
    ...validItems.flatMap(({ product, quantity }, index) => [
      `${index + 1}. ${product.name}`,
      `Unit price: ${formatStorePrice(product.price)}`,
      `Quantity: ${quantity}`,
      `Subtotal: ${formatStorePrice(product.price * quantity)}`,
      "",
    ]),
    `Estimated item total: ${formatStorePrice(total)}`,
    "",
    "Please confirm stock, delivery fees, final total, and payment instructions.",
    "",
    "This message is an order enquiry and does not itself confirm an order.",
  ].join("\n");
}

export const NEXA_QUICK_MESSAGE = [
  `Hello ${BRAND.name}!`,
  "",
  "I'd like help with your products and services.",
].join("\n");
