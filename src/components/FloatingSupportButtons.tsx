import { BRAND } from "@/lib/brand";
import { useEffect, useState, useRef } from "react";
import { Bot, MessageCircle, Send, X, RotateCcw, Loader2, Sparkles, ExternalLink, HelpCircle } from "lucide-react";
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
  action?: {
    type: "whatsapp" | "faq" | "retry";
    label: string;
  };
}

const STORE_FAQS: Record<string, string> = {
  whatsapp:
    "You can chat with our South African team directly on WhatsApp at +27 68 496 3972 for instant order assistance, tracking, and custom inquiries.",
  order:
    "To place an order, simply add products to your cart and tap 'Order My Cart' via WhatsApp, or proceed through our secure online checkout.",
  delivery:
    "We provide nationwide door-to-door courier delivery across South Africa. Standard delivery takes 2 to 5 business days.",
  shipping:
    "Standard shipping takes 2-5 business days across South Africa. Tracking information is provided once your parcel is dispatched.",
  return:
    "We offer a 7-day hassle-free return window for items in their original condition and packaging. Reach out on WhatsApp to initiate a return.",
  payment:
    "We support secure online payments as well as direct EFT / WhatsApp order confirmation.",
  contact:
    "You can contact NEXA GLOBAL MART directly on WhatsApp (+27 68 496 3972) or via our Contact Us page.",
  price:
    "All prices shown on NEXA GLOBAL MART are in South African Rands (ZAR / R) including all applicable taxes.",
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
      text: `Hello! Welcome to ${BRAND.name}. I am your 24/7 shopping concierge. Ask me about products, pricing in Rands, shipping across South Africa, or ordering via WhatsApp!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStoreCatalogue()
      .then((data) => {
        setProducts(data.products || []);
      })
      .catch((error) => {
        console.warn("Unable to load catalogue context:", error);
      });
  }, []);

  useEffect(() => {
    if (aiOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, aiOpen, isThinking]);

  function findFaqAnswer(queryText: string): string | null {
    const lower = queryText.toLowerCase();
    for (const [keyword, answer] of Object.entries(STORE_FAQS)) {
      if (lower.includes(keyword)) {
        return answer;
      }
    }
    // Check if asking about products in store
    const matchedProduct = products.find((p) =>
      lower.includes(p.name.toLowerCase())
    );
    if (matchedProduct) {
      return `We carry ${matchedProduct.name} for R${matchedProduct.price}! You can add it to your cart or order it directly through WhatsApp at +27 68 496 3972.`;
    }
    return null;
  }

  async function handleSend(customText?: string) {
    const query = (customText || input).trim();
    if (!query || isThinking) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: query,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    if (!customText) setInput("");
    setIsThinking(true);

    try {
      const historyPayload: AiChatMessage[] = nextMessages
        .slice(-6)
        .map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        }));

      const productSample = products
        .slice(0, 10)
        .map((p) => `${p.name} (R${p.price})`)
        .join(", ");

      const contextData = productSample
        ? `Featured Store Products: ${productSample}. Total catalogue items: ${products.length}. WhatsApp: +27 68 496 3972.`
        : `WhatsApp: +27 68 496 3972. Nationwide delivery across South Africa (2-5 business days).`;

      const response = await sendAiChatMessage({
        data: {
          mode: "customer",
          messages: historyPayload,
          contextData,
        },
      });

      // Handle response gracefully according to status
      if (response.status === "rate_limited") {
        const faqAnswer = findFaqAnswer(query);
        const replyText = faqAnswer
          ? `${faqAnswer}\n\n(Our AI is experiencing high demand right now, but our team is also standing by on WhatsApp!)`
          : "We are currently experiencing a brief surge in AI traffic! For immediate one-on-one help, please chat with our customer team directly on WhatsApp (+27 68 496 3972).";

        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: "ai",
            text: replyText,
            action: { type: "whatsapp", label: "Message on WhatsApp" },
          },
        ]);
      } else if (response.status === "unconfigured" || response.status === "invalid_key") {
        // Transparent fallback to store knowledge
        const faqAnswer = findFaqAnswer(query);
        const replyText =
          faqAnswer ||
          `Thank you for asking! For custom orders, product sizing, or instant quotes, our South African customer support team is available 24/7 directly on WhatsApp at +27 68 496 3972.`;

        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: "ai",
            text: replyText,
            action: { type: "whatsapp", label: "Chat on WhatsApp (+27 68 496 3972)" },
          },
        ]);
      } else {
        // Successful generation
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: "ai",
            text: response.text,
          },
        ]);
      }
    } catch (error) {
      console.warn("AI generation fallback:", error);
      const faqAnswer = findFaqAnswer(query);
      const replyText =
        faqAnswer ||
        "Thank you for contacting NEXA GLOBAL MART. Our team is available on WhatsApp (+27 68 496 3972) to assist you immediately with pricing, orders, and delivery.";

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: replyText,
          action: { type: "whatsapp", label: "Open WhatsApp Chat" },
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleReset() {
    setMessages([
      {
        id: "welcome-reset",
        sender: "ai",
        text: `Conversation restarted! How can I help you today with ${BRAND.name}? Ask me about products, shipping across South Africa, or ordering via WhatsApp!`,
      },
    ]);
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
            <WhatsAppIcon className="h-6 w-6 fill-current" />
          </button>

          {menuOpen && (
            <div className="absolute bottom-14 right-0 w-64 rounded-2xl border border-border bg-card p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <p className="text-xs font-semibold text-foreground">WhatsApp Support</p>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    openWhatsApp(NEXA_QUICK_MESSAGE);
                    setMenuOpen(false);
                  }}
                  className="w-full rounded-xl bg-muted/60 px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-[#25D366]/15 hover:text-[#128C7E]"
                >
                  Chat with Customer Support
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const message = buildCartWhatsAppMessage(cart.items);
                    openWhatsApp(message);
                    setMenuOpen(false);
                  }}
                  className="w-full rounded-xl bg-[#25D366]/15 px-3 py-2 text-left text-xs font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/25"
                >
                  Order My Cart ({cart.items.length}{" "}
                  {cart.items.length === 1 ? "item" : "items"})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating AI Button */}
        <button
          type="button"
          onClick={() => {
            setAiOpen((prev) => !prev);
            setMenuOpen(false);
          }}
          aria-label="Open AI customer concierge"
          aria-expanded={aiOpen}
          className="relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-tr from-amber-600 via-gold to-yellow-300 text-stone-950 shadow-lg ring-1 ring-white/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          </span>
        </button>
      </div>

      {/* AI Customer Concierge Drawer / Modal */}
      {aiOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${BRAND.shortName} AI Concierge`}
          className="fixed bottom-24 right-3 z-[70] flex w-[calc(100vw-24px)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gold/40 bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:bottom-6 sm:right-20"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-card via-card to-gold/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gold/20 text-gold shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  {BRAND.name} Concierge
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    24/7 Live
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Shop assistance, tracking & FAQs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Restart conversation"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                title="Close chat"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Guidance Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/60 bg-muted/20 px-3 py-2 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => handleSend("What are your delivery times across South Africa?")}
              className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-gold hover:text-foreground transition-colors"
            >
              📦 Delivery Times
            </button>
            <button
              type="button"
              onClick={() => handleSend("How can I place an order via WhatsApp?")}
              className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-gold hover:text-foreground transition-colors"
            >
              🛒 Order via WhatsApp
            </button>
            <button
              type="button"
              onClick={() => handleSend("What is your returns policy?")}
              className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-gold hover:text-foreground transition-colors"
            >
              🔄 Returns
            </button>
          </div>

          {/* Messages */}
          <div className="flex h-80 flex-col gap-3 overflow-y-auto p-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm whitespace-pre-wrap ${
                    m.sender === "user"
                      ? "bg-gold text-stone-950 font-medium rounded-br-xs"
                      : "bg-muted/80 text-foreground border border-border/80 rounded-bl-xs"
                  }`}
                >
                  {m.text}
                </div>

                {m.action?.type === "whatsapp" && (
                  <button
                    type="button"
                    onClick={() => openWhatsApp(NEXA_QUICK_MESSAGE)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#25D366]/15 px-3 py-1.5 text-[11px] font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/25"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5 fill-current" />
                    {m.action.label}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 self-start rounded-2xl border border-border/80 bg-muted/60 px-3.5 py-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                <span className="text-[11px]">Nexa Concierge is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about our products or orders..."
              disabled={isThinking}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="grid h-8 w-8 place-items-center rounded-xl bg-gold text-stone-950 disabled:opacity-40 transition-transform active:scale-95"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
