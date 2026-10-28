import { describe, expect, it } from "vitest";
import { cleanAiResponseText, getDeterministicLocalResponse } from "@/components/FloatingSupportButtons";
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
    expect(res?.text).toContain("depend on your area");
    expect(res?.text).toContain("town or suburb");
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
    expect(res?.text).toContain("six-digit PIN");
    expect(res?.text).toContain("disabled");
    expect(res?.text).toContain("Never disclose your wallet PIN");
    expect(res?.actions?.some((action) => action.type === "whatsapp")).toBe(true);
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


import {
  SUPPORT_CATEGORIES,
  checkContainsSecrets,
  isCaseInitiationQuery,
  parseSupportContact,
} from "@/components/FloatingSupportButtons";

describe("TJC-OS Guided Support Case Safeguards & Validation", () => {
  it("defines standard support categories with accurate priorities", () => {
    expect(SUPPORT_CATEGORIES.length).toBeGreaterThanOrEqual(5);

    const fraudCategory = SUPPORT_CATEGORIES.find((c) => c.id === "fraud");
    expect(fraudCategory).toBeDefined();
    expect(fraudCategory?.priority).toBe("HIGH");

    const orderCategory = SUPPORT_CATEGORIES.find((c) => c.id === "order");
    expect(orderCategory).toBeDefined();
    expect(orderCategory?.priority).toBe("NORMAL");
  });

  it("detects sensitive secrets (PINs, passwords, OTPs, CVVs, card numbers) accurately", () => {
    expect(checkContainsSecrets("My PIN is 123456")).toBe(true);
    expect(checkContainsSecrets("Password is secret123")).toBe(true);
    expect(checkContainsSecrets("My OTP code was 4591")).toBe(true);
    expect(checkContainsSecrets("Card CVV is 998")).toBe(true);
    expect(checkContainsSecrets("4532-1234-5678-9012")).toBe(true);

    // Normal safe descriptions should NOT trigger secrets
    expect(checkContainsSecrets("I received the wrong item in my delivery")).toBe(false);
    expect(checkContainsSecrets("Looking for a gold watch model 2026")).toBe(false);
    expect(checkContainsSecrets("How do I update my profile address?")).toBe(false);
  });

  it("recognizes case and ticket initiation phrases", () => {
    expect(isCaseInitiationQuery("I want to open a support ticket")).toBe(true);
    expect(isCaseInitiationQuery("open a ticket")).toBe(true);
    expect(isCaseInitiationQuery("submit a support case")).toBe(true);
    expect(isCaseInitiationQuery("report an issue with my order")).toBe(true);
    expect(isCaseInitiationQuery("file a complaint")).toBe(true);
    expect(isCaseInitiationQuery("create a ticket")).toBe(true);

    // Regular queries should not trigger
    expect(isCaseInitiationQuery("What is the price of this phone?")).toBe(false);
    expect(isCaseInitiationQuery("Hello there")).toBe(false);
  });

  it("parses customer contact information reliably", () => {
    const contact = parseSupportContact(
      "Sipho Dlamini, sipho@example.co.za, 071 234 5678"
    );
    expect(contact.email).toBe("sipho@example.co.za");
    expect(contact.phone).toBe("0712345678");
    expect(contact.name).toBe("Sipho Dlamini");

    const emailOnly = parseSupportContact("thabo@example.com");
    expect(emailOnly.email).toBe("thabo@example.com");
    expect(emailOnly.phone).toBeNull();
  });
});


describe("TJC-OS targeted customer-support repairs", () => {
  it("cleans missing or raw WhatsApp links without leaving blank contact wording", () => {
    const examples = [
      "Please reach out to support on WhatsApp at https://wa.me/27684963972 for assistance.",
      "Please reach out to support on WhatsApp at [blank] for assistance.",
      "Contact our team on WhatsApp: https://wa.me/27684963972",
    ];
    for (const example of examples) {
      const result = cleanAiResponseText(example);
      expect(result).not.toContain("https://wa.me");
      expect(result).not.toMatch(/\bat\s*(?:for|$)/i);
      expect(result).not.toContain("[blank]");
    }
  });

  it("answers missing-order reports locally with honest limitations and working WhatsApp action", () => {
    const result = getDeterministicLocalResponse("I didn't receive my order", mockProducts);
    expect(result?.text).toContain("Live courier tracking is not connected");
    expect(result?.actions?.some((action) => action.type === "whatsapp")).toBe(true);
    expect(result?.text).not.toContain("https://");
  });

  it("offers the existing account routes for account setup questions", () => {
    const result = getDeterministicLocalResponse("How can I set an account?", mockProducts);
    expect(result?.actions?.map((action) => action.payload)).toContain("/sign-up");
    expect(result?.actions?.map((action) => action.payload)).toContain("/sign-in");
    expect(result?.actions?.map((action) => action.payload)).toContain("/forgot-password");
  });

  it("uses truthful area-specific delivery guidance and an enquiry action", () => {
    const result = getDeterministicLocalResponse("What are delivery fees?", mockProducts);
    expect(result?.text).toContain("depend on your area");
    expect(result?.actions?.[0].type).toBe("whatsapp");
  });

  it("answers weather queries without claiming live forecast access", () => {
    const result = getDeterministicLocalResponse("What is the weather today?", mockProducts);
    expect(result?.text).toContain("don’t have live weather data");
    expect(result?.actions?.[0].payload).toBe("/shop");
  });
});
