import { BRAND } from "@/lib/brand";
import { useEffect, useState, useRef } from "react";
import { Bot, MessageCircle, Send, X, RotateCcw, Loader2 } from "lucide-react";
import { useLocalList } from "@/lib/local-list";
import { fetchStoreCatalogue } from "@/lib/preview-data";
import {
  buildCartWhatsAppMessage,
  NEXA_QUICK_MESSAGE,
  openWhatsApp,
} from "@/lib/Whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { sendAiChatMessage } from "@/lib/ai/server";
import type { ChatMessage as AiChatMessage } from "@/lib/ai/types";

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
}

const FALLBACK_FAQ: Record<string, string> = {
  whatsapp:
    "You can order directly via WhatsApp or chat with our team at +27 68 496 3972. Use the WhatsApp button on the bottom right to send your cart or quick enquiry!",
  order:
    "To order, browse products, add them to your cart, and either checkout online or tap 'Order My Cart' from the WhatsApp floating button!",
  delivery:
    "We offer reliable nationwide shipping across South Africa. Standard delivery takes 2-5 business days.",
  shipping:
    "We offer reliable nationwide shipping across South Africa. Standard delivery takes 2-5 business days.",
  return:
    "We accept returns on eligible items within 7 days of receipt in original condition and packaging.",
  contact:
    "You can reach Nexa Global Market directly on WhatsApp at +27 68 496 3972.",
};

export function FloatingSupportButtons() {
  const cart = useLocalList("nexa-cart");
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [products, setProducts] = useState<
    Awaited<ReturnType<typeof fetchStoreCatalogue>>["products"]
  >([]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Hello! Welcome to ${BRAND.name}. I am your 24/7 shopping concierge. How can I help you today? Ask me about products, orders, delivery, or ordering via WhatsApp!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (aiOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, aiOpen, isThinking]);

  function orderCartOnWhatsApp() {
    const items = cart.ids.flatMap((id) => {
      const product = products.find((item) => item.id === id);
      if (!product) return [];

      return [
        {
          product,
          quantity: cart.quantities[id] ?? 1,
        },
      ];
    });

    openWhatsApp(buildCartWhatsAppMessage(items));
    setMenuOpen(false);
  }

  function handleResetChat() {
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: `Hello! Welcome to ${BRAND.name}. How can I assist you with your shopping or order today?`,
      },
    ]);
  }

  async function handleSend(userText?: string) {
    const query = (userText ?? input).trim();
    if (!query || isThinking) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: query,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!userText) setInput("");
    setIsThinking(true);

    try {
      // Build lightweight conversation history for the server function
      const historyPayload: AiChatMessage[] = nextMessages
        .slice(-6)
        .map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        }));

      // Build catalog context so AI knows currently active items
      const productSample = products
        .slice(0, 10)
        .map((p) => `${p.name} (R${p.price})`)
        .join(", ");

      const contextData = productSample
        ? `Featured Store Products: ${productSample}. Total catalogue items: ${products.length}. Support WhatsApp: +27 68 496 3972.`
        : `Support WhatsApp: +27 68 496 3972. Nationwide delivery across South Africa.`;

      const response = await sendAiChatMessage({
        data: {
          mode: "customer",
          messages: historyPayload,
          contextData,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: response.text,
        },
      ]);
    } catch (error) {
      console.warn("AI generation fallback:", error);

      // Graceful rule-based fallback if offline or API key pending
      const lower = query.toLowerCase();
      let fallbackText =
        "Thank you for asking! For immediate support, custom product orders, or direct quotes, our customer care team is available directly on WhatsApp at +27 68 496 3972.";

      for (const [key, val] of Object.entries(FALLBACK_FAQ)) {
        if (lower.includes(key)) {
          fallbackText = val;
          break;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: fallbackText,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <>
      <div
        className="fixed bottom-24 right-3 z-[60] flex flex-col items-center gap-2 sm:bottom-6 sm:right-5"
        aria-label={`${BRAND.shortName} customer support`}
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
          aria-label={`${BRAND.shortName} AI assistant`}
          className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-background text-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/30"
        >
          <Bot className="h-6 w-6 text-gold" />
        </button>
        <span className="sr-only">{BRAND.shortName} AI Support Assistant</span>
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
            className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border border-gold/30 bg-background shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 bg-gold/10">
                  <Bot className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h2 id="nexa-ai-title" className="text-base font-bold leading-tight">
                    {BRAND.shortName} AI Concierge
                  </h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online • 24/7 Intelligent Shopping
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAiOpen(false)}
                  aria-label={`Close ${BRAND.shortName} AI`}
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick action chips */}
            <div className="flex gap-1.5 overflow-x-auto p-3 border-b border-border/50 text-xs">
              {[
                "How to order on WhatsApp?",
                "Delivery & Shipping times",
                "What products are on sale?",
                "Return & refund policy",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={isThinking}
                  onClick={() => handleSend(chip)}
                  className="shrink-0 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 text-foreground hover:bg-gold/15 transition-colors disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat message list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[240px] max-h-[360px]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-foreground border border-border/60 rounded-tl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-border/60 bg-muted px-3.5 py-2.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                    <span>Nexa AI is typing...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Bottom Input & Quick WhatsApp button */}
            <div className="border-t border-border p-3 space-y-2 bg-muted/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  disabled={isThinking}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about products, orders, delivery..."
                  className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isThinking || !input.trim()}
                  aria-label="Send message"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold text-black hover:opacity-90 transition-opacity font-semibold disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  openWhatsApp(NEXA_QUICK_MESSAGE);
                  setAiOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 py-1.5 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Need Human Support? Chat on WhatsApp
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
