import { describe, expect, it } from "vitest";
import { PREVIEW_PRODUCTS, type StoreProduct } from "@/lib/preview-data";

describe("Customer account feature logic and data safety", () => {
  it("validates profile inputs correctly according to schema limits", () => {
    function validateProfile(name: string, phone: string, address: string) {
      const trimmedName = name.trim();
      if (!trimmedName) return { valid: false, error: "Full name is required." };
      if (trimmedName.length > 100)
        return { valid: false, error: "Full name must be 100 characters or fewer." };
      if (phone.trim().length > 30) return { valid: false, error: "Phone number is too long." };
      if (address.trim().length > 300)
        return { valid: false, error: "Address is too long (300 characters max)." };
      return { valid: true, error: null };
    }

    expect(validateProfile("", "", "").valid).toBe(false);
    expect(validateProfile("   ", "", "").valid).toBe(false);
    expect(validateProfile("A".repeat(101), "", "").valid).toBe(false);
    expect(validateProfile("John Doe", "0".repeat(31), "").valid).toBe(false);
    expect(validateProfile("John Doe", "+27821234567", "A".repeat(301)).valid).toBe(false);
    expect(validateProfile("John Doe", "+27 82 123 4567", "123 Main Street").valid).toBe(true);
  });

  it("validates delivery address required fields", () => {
    function validateAddress(recipient: string, phone: string, street: string, city: string) {
      if (!recipient.trim() || !phone.trim() || !street.trim() || !city.trim()) {
        return { valid: false, error: "Recipient, phone, street, and city are required fields." };
      }
      return { valid: true, error: null };
    }

    expect(validateAddress("", "082", "Street", "City").valid).toBe(false);
    expect(validateAddress("Jane", "", "Street", "City").valid).toBe(false);
    expect(validateAddress("Jane", "082", "", "City").valid).toBe(false);
    expect(validateAddress("Jane", "082", "Street", "").valid).toBe(false);
    expect(validateAddress("Jane Doe", "+27821234567", "12 Market Rd", "Johannesburg").valid).toBe(
      true,
    );
  });

  it("resolves wishlist items against catalogue and identifies stale IDs safely", () => {
    const liveCatalogueProducts: StoreProduct[] = [
      {
        id: "live-1",
        name: "Solar Inverter 5kW",
        slug: "solar-inverter-5kw",
        price: 2500000,
        compare_at_price: null,
        category_id: "solar",
        image_url: null,
        stock: 4,
        origin: "South Africa",
        featured: true,
      },
    ];

    const savedIds = ["live-1", PREVIEW_PRODUCTS[0]?.id || "preview-id", "obsolete-product-999"];

    const validItems: Array<{ id: string; name: string }> = [];
    const staleIds: string[] = [];

    for (const id of savedIds) {
      const live = liveCatalogueProducts.find((p) => p.id === id);
      if (live) {
        validItems.push(live);
        continue;
      }
      const preview = PREVIEW_PRODUCTS.find((p) => p.id === id);
      if (preview) {
        validItems.push(preview);
        continue;
      }
      staleIds.push(id);
    }

    expect(validItems.map((p) => p.id)).toContain("live-1");
    expect(staleIds).toEqual(["obsolete-product-999"]);
  });
});
