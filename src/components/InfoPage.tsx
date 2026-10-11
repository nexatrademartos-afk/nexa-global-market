import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

export type InfoPageKey =
  | "about"
  | "contact"
  | "trust"
  | "faq"
  | "terms"
  | "privacy"
  | "delivery"
  | "returns"
  | "shopping";

const pages: Record<
  InfoPageKey,
  {
    title: string;
    intro: string;
    sections: { heading: string; body: string[] }[];
  }
> = {
  about: {
    title: "About NEXA TRADE MART",
    intro:
      "Building Africa’s Intelligent Commerce Platform. NEXA aims to make shopping simpler, more accessible and rewarding.",
    sections: [
      {
        heading: "Our vision",
        body: [
          "We are building an African-rooted marketplace with the ambition to connect customers with products and opportunities across a growing commerce ecosystem.",
          "Our vision is to make digital commerce easier to navigate while building toward a more connected shopping experience.",
        ],
      },
      {
        heading: "Our promise",
        body: [
          "Shop More. Save More. Get Rewarded.",
          "We aim to build customer trust through clear information, helpful support and a shopping experience that continues to improve.",
        ],
      },
      {
        heading: "Powered by TJC-OS",
        body: [
          "NEXA TRADE MART is powered by TJC-OS, the technology and operating vision behind the platform.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact Us",
    intro:
      "Need help with NEXA? Use the contact options below. For account or order enquiries, please avoid sending passwords or payment PINs.",
    sections: [
      {
        heading: "Email",
        body: ["nexatrademart@gmail.com"],
      },
      {
        heading: "WhatsApp",
        body: ["+27 68 496 3972"],
      },
      {
        heading: "Telephone",
        body: ["065 619 1335"],
      },
      {
        heading: "Location and hours",
        body: [
          "Port Elizabeth / Gqeberha, South Africa.",
          "Listed support hours: Monday–Saturday, 08:00–18:00. Please confirm current availability before relying on these hours.",
        ],
      },
    ],
  },
  trust: {
    title: "Trust & Safety",
    intro:
      "A safer marketplace depends on clear information, careful account protection and customers knowing how to report concerns.",
    sections: [
      {
        heading: "Protect your account",
        body: [
          "Use a strong, unique password. Never share your password, one-time verification codes or payment PIN with anyone claiming to be support.",
        ],
      },
      {
        heading: "Before you buy",
        body: [
          "Review the product description, price, options and any delivery information displayed before placing an order.",
          "Keep order confirmations and relevant messages so you can refer to them if you need assistance.",
        ],
      },
      {
        heading: "Report a concern",
        body: [
          "Contact NEXA using the details on this page if you notice suspicious activity, misleading product information or a possible account-security issue.",
          "Reporting a concern does not guarantee a particular outcome; the details will need to be reviewed.",
        ],
      },
    ],
  },
  faq: {
    title: "Help & FAQs",
    intro:
      "Quick answers to common questions about using NEXA TRADE MART.",
    sections: [
      {
        heading: "Do I need an account to browse?",
        body: [
          "No. Select “Continue browsing as a guest” to visit the marketplace. Some account features may require you to sign in.",
        ],
      },
      {
        heading: "How do I create an account?",
        body: [
          "Open the Account page and select “Create a customer account”. Follow the instructions shown on the sign-up screen.",
        ],
      },
      {
        heading: "How can I get help?",
        body: [
          "Email nexatrademart@gmail.com or use the listed WhatsApp contact. Never send your password or verification codes.",
        ],
      },
      {
        heading: "Are all NEXA services available?",
        body: [
          "Some dashboard services are still being developed. A feature marked “Coming soon” should not be treated as an active service.",
        ],
      },
      {
        heading: "Where can I find delivery and refund information?",
        body: [
          "Read the Delivery Policy and Returns & Refunds pages. Any details that have not yet been confirmed by NEXA are identified as requiring confirmation.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro:
      "This page provides preliminary information for customers. It is not a substitute for a complete, reviewed set of contractual terms.",
    sections: [
      {
        heading: "Using the marketplace",
        body: [
          "Please use the website lawfully, provide accurate information when creating an account and do not attempt to disrupt or misuse the platform.",
        ],
      },
      {
        heading: "Product information",
        body: [
          "Customers should review product details, displayed prices, available options and applicable conditions before ordering. Product availability and information may change.",
        ],
      },
      {
        heading: "Orders and payments",
        body: [
          "The final order, payment, cancellation and fulfilment rules must be clearly displayed and confirmed before transactions are treated as binding.",
        ],
      },
      {
        heading: "Important notice",
        body: [
          "Governing law, formal consumer terms, liability provisions and other contractual requirements need to be reviewed and approved for NEXA’s actual operations before this page is treated as final legal terms.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "NEXA should explain clearly how customer information is collected, used, protected and retained. This preliminary page must be reviewed against the platform’s actual data practices before publication as a final policy.",
    sections: [
      {
        heading: "Information you provide",
        body: [
          "Depending on the features you use, you may provide account details, contact information, delivery details and information relating to your orders or support requests.",
        ],
      },
      {
        heading: "How information may be used",
        body: [
          "Information may be needed to operate accounts, provide requested services, support orders, address enquiries and protect the platform.",
        ],
      },
      {
        heading: "Security and sharing",
        body: [
          "Access to personal information should be limited to legitimate operational needs and protected with appropriate safeguards. Any third-party sharing must be accurately disclosed in the final policy.",
        ],
      },
      {
        heading: "Your privacy rights",
        body: [
          "Contact NEXA to ask a privacy question or make a request about your personal information. Applicable rights and response procedures must be confirmed against the laws and practices that apply to NEXA.",
          "The final policy must identify the responsible operator, retention practices, relevant service providers and an appropriate privacy contact.",
        ],
      },
    ],
  },
  delivery: {
    title: "Delivery Policy",
    intro:
      "Delivery options, availability and timing can depend on the product, destination and fulfilment arrangements. Please check the details shown for your order.",
    sections: [
      {
        heading: "Delivery coverage",
        body: [
          "The areas NEXA can serve and any delivery restrictions must be confirmed before an order is accepted.",
        ],
      },
      {
        heading: "Delivery times and fees",
        body: [
          "Applicable delivery fees and estimated delivery times should be displayed or communicated before checkout is completed.",
          "No fixed delivery timeframe or fee is promised by this preliminary page.",
        ],
      },
      {
        heading: "Receiving an order",
        body: [
          "Provide accurate delivery details and use the available support contact if your order is delayed, incomplete or appears to have been delivered incorrectly.",
        ],
      },
    ],
  },
  returns: {
    title: "Returns & Refunds",
    intro:
      "If there is a problem with a purchase, contact NEXA with your order details and a description of the issue. Applicable consumer rights are not removed by this preliminary information page.",
    sections: [
      {
        heading: "Requesting assistance",
        body: [
          "Keep your order confirmation and any relevant product photos or correspondence. Contact support so the issue can be assessed.",
        ],
      },
      {
        heading: "Eligibility and process",
        body: [
          "Return eligibility, time limits, product-condition requirements, collection arrangements and refund processing times must be confirmed in NEXA’s final policy.",
          "The applicable legal rights and remedies depend on the transaction and relevant consumer-protection law.",
        ],
      },
      {
        heading: "Refunds",
        body: [
          "A refund should not be considered approved until NEXA has confirmed the outcome and any applicable process directly with the customer.",
        ],
      },
    ],
  },
  shopping: {
    title: "Shopping Guide",
    intro:
      "A simple guide to browsing the NEXA marketplace and getting ready to shop.",
    sections: [
      {
        heading: "1. Browse products",
        body: [
          "Open the Shop page, browse available categories or search for a product.",
        ],
      },
      {
        heading: "2. Review the details",
        body: [
          "Check the product name, description, displayed price, available options and stock or availability information before proceeding.",
        ],
      },
      {
        heading: "3. Use your cart",
        body: [
          "Add products to your cart and review the items and totals shown. Check the delivery and payment details available before confirming an order.",
        ],
      },
      {
        heading: "4. Sign in when needed",
        body: [
          "You can browse as a guest. Sign in or create a customer account when an account-based feature requires it.",
        ],
      },
      {
        heading: "5. Need help?",
        body: [
          "Visit Help & FAQs or contact NEXA using the contact details provided on this website.",
        ],
      },
    ],
  },
};

export function InfoPage({ page }: { page: InfoPageKey }) {
  const content = pages[page];

  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-8 md:py-12">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to NEXA
      </Link>

      <article className="overflow-hidden rounded-3xl border border-gold/30 bg-background shadow-sm">
        <header className="bg-ink p-6 text-ink-foreground md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            NEXA TRADE MART · Information
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-foreground/75 md:text-base">
            {content.intro}
          </p>
        </header>

        <div className="space-y-7 p-5 md:p-8">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-lg font-bold">
                {section.heading}
              </h2>
              <div className="mt-2 space-y-3 text-sm leading-7 text-muted-foreground">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          {page === "contact" && (
            <section className="rounded-2xl border border-gold/30 p-4">
              <h2 className="font-bold">Contact options</h2>
              <div className="mt-4 grid gap-4 text-sm">
                <a
                  href="mailto:nexatrademart@gmail.com"
                  className="flex items-center gap-3 hover:text-gold"
                >
                  <Mail className="h-4 w-4 text-gold" />
                  nexatrademart@gmail.com
                </a>
                <a
                  href="https://wa.me/27684963972"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 hover:text-gold"
                >
                  <MessageCircle className="h-4 w-4 text-gold" />
                  WhatsApp: +27 68 496 3972
                </a>
                <a
                  href="tel:+27656191335"
                  className="flex items-center gap-3 hover:text-gold"
                >
                  <Phone className="h-4 w-4 text-gold" />
                  065 619 1335
                </a>
                <p className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gold" />
                  Port Elizabeth / Gqeberha, South Africa
                </p>
                <p className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gold" />
                  Monday–Saturday, 08:00–18:00 (listed hours; confirm availability)
                </p>
              </div>
            </section>
          )}

          {["terms", "privacy", "delivery", "returns"].includes(page) && (
            <p className="rounded-xl border border-gold/30 p-4 text-xs leading-6 text-muted-foreground">
              Review note: this policy content is preliminary and needs
              confirmation against NEXA’s actual operations and applicable
              legal requirements before being treated as final.
            </p>
          )}

          <div className="flex flex-wrap gap-3 border-t pt-6">
            <Link to="/shop" className="btn btn-primary">
              <BookOpen className="mr-2 inline h-4 w-4" />
              Explore the marketplace
            </Link>
            <Link to="/account" className="btn btn-outline">
              <ShieldCheck className="mr-2 inline h-4 w-4" />
              Customer account
            </Link>
          </div>
        </div>
      </article>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Powered by <span className="font-semibold text-gold">TJC-OS</span>
      </p>
    </main>
  );
}
