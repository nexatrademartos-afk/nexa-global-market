import { describe, expect, it } from "vitest";
import { getDeterministicLocalResponse } from "@/components/FloatingSupportButtons";
import { BRAND } from "@/lib/brand";
import type { StoreProduct } from "@/lib/preview-data";

const mockProducts: StoreProduct[] = [
  {
    id: "prod-1",
    name: "Luxury Velvet Sofa",
    slug: "luxury-velvet-sofa",
    price: 850000,
    compare_at_price: null,
    category_id: "cat-1",
    image_url: null,
    stock: 5,
    origin: "South Africa",
    featured: true,
  },
];

describe("TJC-OS Deterministic Local Assistant Logic", () => {
  it("provides an immediate safe greeting for greetings without network dependencies", () => {
    const greetings = ["Hi", "hi", "Hello", "hello", "Hey", "Good morning", "good day"];

    for (const greeting of greetings) {
      const res = getDeterministicLocalResponse(greeting, mockProducts);
      expect(res).not.toBeNull();
      expect(res?.text).toContain("TJC-OS");
      expect(res?.text).toContain(BRAND.name);
      // No raw URLs in message text
      expect(res?.text).not.toContain("https://");
    }
  });

  it("handles agent and human support requests with structured WhatsApp actions", () => {
    const queries = [
      "I want to speak to an agent",
      "let me speak to someone",
      "can I talk to customer support?",
      "human agent please",
    ];

    for (const query of queries) {
      const res = getDeterministicLocalResponse(query, mockProducts);
      expect(res).not.toBeNull();
      expect(res?.actions).toBeDefined();
      expect(res?.actions?.[0].type).toBe("whatsapp");
      expect(res?.actions?.[0].label).toContain("WhatsApp");
      expect(res?.text).not.toContain("https://wa.me");
    }
  });

  it("handles delivery queries with South African shipping facts and structured actions", () => {
    const res = getDeterministicLocalResponse("What are your delivery times across South Africa?", mockProducts);
    expect(res).not.toBeNull();
    expect(res?.text).toContain("South Africa");
    expect(res?.text).toContain("3 to 5 business days");
    expect(res?.actions?.[0].type).toBe("whatsapp");
    expect(res?.text).not.toContain("https://");
  });

  it("handles returns queries accurately with structured action", () => {
    const res = getDeterministicLocalResponse("What is your returns policy?", mockProducts);
    expect(res).not.toBeNull();
    expect(res?.text).toContain("return");
    expect(res?.actions?.[0].type).toBe("whatsapp");
    expect(res?.text).not.toContain("https://");
  });

  it("handles wallet inquiries with approved facts only (ZAR, 6-digit PIN, disabled operations)", () => {
    const res = getDeterministicLocalResponse("How does the wallet PIN and balance work?", mockProducts);
    expect(res).not.toBeNull();
    expect(res?.text).toContain("ZAR");
    expect(res?.text).toContain("6-digit PIN");
    expect(res?.text).toContain("disabled");
    expect(res?.text).toContain("Never disclose your wallet PIN");
    expect(res?.actions?.[0].type).toBe("whatsapp");
  });

  it("provides calm fraud and security safeguards with bank escalation and support actions", () => {
    const res = getDeterministicLocalResponse("I suspect someone is trying to scam me or stole my bank card", mockProducts);
    expect(res).not.toBeNull();
    expect(res?.text).toContain("Security Alert");
    expect(res?.text).toContain("contact your bank immediately");
    expect(res?.text).toContain("Never disclose your wallet PIN");
    expect(res?.actions?.[0].type).toBe("whatsapp");
    expect(res?.actions?.[0].label).toContain("Report Security Concern");
  });

  it("matches specific catalogue products with snapshot disclaimer and enquiry action", () => {
    const res = getDeterministicLocalResponse("Do you have the Luxury Velvet Sofa available?", mockProducts);
    expect(res).not.toBeNull();
    expect(res?.text).toContain("Luxury Velvet Sofa");
    expect(res?.text).toContain("R8500");
    expect(res?.text).toContain("may not reflect current stock");
    expect(res?.actions?.[0].type).toBe("whatsapp");
    expect(res?.actions?.[0].label).toContain("Luxury Velvet Sofa");
  });

  it("returns null for arbitrary queries so they can be routed to the AI model", () => {
    const res = getDeterministicLocalResponse("What is the history of interior architecture?", mockProducts);
    expect(res).toBeNull();
  });
});
