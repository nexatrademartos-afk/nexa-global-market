
import { useEffect, useState } from "react";
import { Bot, X } from "lucide-react";
import { useLocalList } from "@/lib/local-list";
import { fetchStoreCatalogue } from "@/lib/preview-data";
import {
  buildCartWhatsAppMessage,
  NEXA_QUICK_MESSAGE,
  openWhatsApp,
} from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

export function FloatingSupportButtons() {
  const cart = useLocalList("nexa-cart");
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [products, setProducts] = useState<
    Awaited<ReturnType<typeof fetchStoreCatalogue>>["products"]
  >([]);

  useEffect(() => {
    let active = true;

    void fetchStoreCatalogue()
      .then((catalogue) => {
        if (active) setProducts(catalogue.products);
      })
      .catch((error) => {
        console.error("Unable to load WhatsApp cart catalogue:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  function orderCartOnWhatsApp() {
    const items = cart.ids.flatMap((id) => {
      const product = products.find((item) => item.id === id);
      if (!product) return [];

      return [{
        product,
        quantity: cart.quantities[id] ?? 1,
      }];
    });

    openWhatsApp(buildCartWhatsAppMessage(items));
    setMenuOpen(false);
  }

  return (
    <>
      <div
        className="fixed bottom-24 right-3 z-[60] flex flex-col items-center gap-2 sm:bottom-6 sm:right-5"
        aria-label="NEXA customer support"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="WhatsApp support options"
            aria-expanded={menuOpen}
            className="grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lg ring-1 ring-white/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <WhatsAppIcon className="h-6 w-6" />
            )}
          </button>

          {menuOpen && (
            <div className="absolute bottom-0 right-14 w-52 rounded-xl border border-border bg-background p-2 shadow-xl">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                WHATSAPP SUPPORT
              </p>

              <button
                type="button"
                onClick={() => {
                  openWhatsApp(NEXA_QUICK_MESSAGE);
                  setMenuOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-muted"
              >
                Quick Message
              </button>

              <button
                type="button"
                onClick={orderCartOnWhatsApp}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-muted"
              >
                Order My Cart
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            setAiOpen(true);
          }}
          aria-label="Nexa AI support — coming soon"
          className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-background text-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/30"
        >
          <Bot className="h-6 w-6 text-gold" />
        </button>
        <span className="sr-only">Nexa AI, coming soon</span>
      </div>

      {aiOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setAiOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="nexa-ai-title"
            className="w-full max-w-sm rounded-2xl border border-gold/30 bg-background p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/10">
                <Bot className="h-6 w-6 text-gold" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 id="nexa-ai-title" className="text-lg font-bold">
                  Nexa AI Support
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Coming soon! Our AI support assistant is being prepared
                  to help with product questions and customer support.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAiOpen(false)}
                aria-label="Close Nexa AI notice"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAiOpen(false)}
              className="btn btn-primary mt-5 w-full"
            >
              Got it
            </button>
          </section>
        </div>
      )}
    </>
  );
      }
            
