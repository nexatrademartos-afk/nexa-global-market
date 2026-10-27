import { BRAND } from "@/lib/brand";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bot,
  Send,
  X,
  RotateCcw,
  Loader2,
  Sparkles,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { useLocalList } from "@/lib/local-list";
import { fetchStoreCatalogue, type StoreProduct } from "@/lib/preview-data";
import {
  buildCartWhatsAppMessage,
  NEXA_QUICK_MESSAGE,
  openWhatsApp,
} from "@/lib/Whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { sendAiChatMessage } from "@/lib/ai/server";
import type { ChatMessage as AiChatMessage } from "@/lib/ai/types";

export interface ChatAction {
  type: "whatsapp" | "support_escalate" | "link";
  label: string;
  payload?: string;
}

export interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  actions?: ChatAction[];
  action?: {
    type: "whatsapp" | "faq" | "retry";
    label: string;
  };
}

const WHATSAPP_SUPPORT_MESSAGE =
  "Hello, I need help from customer support. Please assist me.";

export function getDeterministicLocalResponse(
  queryText: string,
  products: StoreProduct[] = [],
): { text: string; actions?: ChatAction[] } | null {
  const query = queryText.trim().toLowerCase();
  if (!query) return null;

  // 1. Immediate greetings (safe local greeting, zero network latency)
  if (/^\s*(hi|hello|hey|good\s+(morning|afternoon|evening|day)|greetings|howdy|how\s+are\s+you|what'?s\s+up)\b/i.test(query)) {
    return {
      text: `Hello! Welcome to ${BRAND.name}. I'm TJC-OS, your AI assistant. How can I help you today? You can ask about our catalogue products, store services, or connect with our support team.`,
    };
  }

  // 2. Fraud & Security (calm, explicit safeguards, no secrets, bank escalation)
  if (/\b(fraud|scam|suspicious|hacked|unauthorized|stolen|compromised|bank\s+card)\b/i.test(query)) {
    return {
      text: `Security Alert: We take customer security seriously. Never disclose your wallet PIN, account passwords, or one-time verification codes (OTPs) to anyone. If you suspect your bank card or account has been compromised, please contact your bank immediately.

You can also report urgent security concerns directly to our support team on WhatsApp.`,
      actions: [
        {
          type: "whatsapp",
          label: "Report Security Concern",
          payload: "URGENT: I need to report a security/fraud concern.",
        },
      ],
    };
  }

  // 3. Human agent & Support escalation (clickable action instead of raw URLs)
  if (/\b(speak\s+to\s+(an?\s+)?(agent|human|person|someone)|human\s+agent|talk\s+to\s+(someone|a\s+human|an\s+agent)|customer\s+(care|support|service)|support\s+team|live\s+agent|real\s+person|contact\s+support|help\s+desk)\b/i.test(query)) {
    return {
      text: `I'm happy to connect you directly with our customer support team. Our team is available on WhatsApp to assist you with order enquiries, custom product quotes, and account assistance.`,
      actions: [
        {
          type: "whatsapp",
          label: "Chat on WhatsApp",
          payload: WHATSAPP_SUPPORT_MESSAGE,
        },
      ],
    };
  }

  // 4. Delivery & Shipping
  if (/\b(delivery|shipping|courier|how\s+long.*deliver|deliver.*south\s+africa|delivery\s+times?)\b/i.test(query)) {
    return {
      text: `We deliver across South Africa. Standard delivery typically takes 3 to 5 business days depending on your area. Detailed delivery arrangements and courier options are confirmed when you arrange your order with our team.`,
      actions: [
        {
          type: "whatsapp",
          label: "Enquire About Delivery",
          payload: "Hello, I would like to check delivery options for my area.",
        },
      ],
    };
  }

  // 5. How to order / WhatsApp ordering
  if (/\b(how.*(order|buy|purchase)|order.*whatsapp|place.*order|buy.*product)\b/i.test(query)) {
    return {
      text: `You can place orders directly via WhatsApp with our team! Browse our catalogue, choose the items you'd like, and send us a message. We will confirm stock availability, delivery fees, and final payment details. Website checkout is currently in preview mode.`,
      actions: [
        {
          type: "whatsapp",
          label: "Order via WhatsApp",
          payload: "Hello, I would like to place an order.",
        },
      ],
    };
  }

  // 6. Returns & refunds
  if (/\b(return|refund|exchange|cancel.*order|returns?\s+policy)\b/i.test(query)) {
    return {
      text: `Items in original, unused condition can be returned within our standard return window. For return requests, refunds, or exchanges, please contact our support team with your order reference.`,
      actions: [
        {
          type: "whatsapp",
          label: "Returns Support",
          payload: "Hello, I would like to enquire about returns and refunds.",
        },
      ],
    };
  }

  // 7. Order tracking / status
  if (/\b(track|tracking|where.*order|order\s+status|order\s+reference|parcel\s+status)\b/i.test(query)) {
    return {
      text: `Live automated order tracking is not yet connected to this chat. To check the status of your order, please message our support team on WhatsApp and share your order reference if you have one.`,
      actions: [
        {
          type: "whatsapp",
          label: "Track via WhatsApp",
          payload: "Hello, I'd like to check the status of my order.",
        },
      ],
    };
  }

  // 8. Wallet & PIN facts
  if (/\b(wallet|pin|q\s+points|commissions|promo\s+credit|deposit|withdraw|balance)\b/i.test(query)) {
    return {
      text: `The ${BRAND.shortName} Wallet is currently in preview with South African Rand (ZAR) and a 6-digit PIN. Cash, Q Points, commissions, and promo credits are tracked separately. Deposits, transfers, and withdrawals are currently disabled pending provider activation. Never disclose your wallet PIN to anyone.`,
      actions: [
        {
          type: "whatsapp",
          label: "Ask Support About Wallet",
          payload: "Hello, I have a question regarding the wallet preview.",
        },
      ],
    };
  }

  // 9. Specific catalogue product match
  const matchedProduct = products.find((product) => {
    const productName = product.name?.trim().toLowerCase();
    return Boolean(productName && productName.length > 2 && query.includes(productName));
  });

  if (matchedProduct) {
    return {
      text: `The catalogue lists ${matchedProduct.name} at R${matchedProduct.price}. Note that catalogue snapshots may not reflect current stock or final pricing. Please check the product listing or enquire with our team on WhatsApp for confirmation.`,
      actions: [
        {
          type: "whatsapp",
          label: `Enquire About ${matchedProduct.name}`,
          payload: `Hello, I'd like to enquire about ${matchedProduct.name}.`,
        },
      ],
    };
  }

  return null;
}

function getWelcomeMessage(): ChatMessage {
  return {
    id: "welcome",
    sender: "ai",
    text: `Hello! Welcome to ${BRAND.name}. I'm TJC-OS, your 24/7 AI assistant. How can I help you today?`,
  };
}

export function FloatingSupportButtons() {
  const cart = useLocalList("nexa-cart");
  const navigate = useNavigate();

  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  const pageMode = pathname === "/ai-assistant";

  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const [products, setProducts] = useState<
    Awaited<ReturnType<typeof fetchStoreCatalogue>>["products"]
  >([]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    getWelcomeMessage(),
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetchStoreCatalogue()
      .then((data) => {
        if (active) {
          setProducts(data.products || []);
        }
      })
      .catch((error) => {
        console.warn("Unable to load catalogue context:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (aiOpen || pageMode) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, aiOpen, isThinking, pageMode]);

  async function handleSend(customText?: string) {
    const query = (customText ?? input).trim();

    if (!query || isThinking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      sender: "user",
      text: query,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    if (customText === undefined) {
      setInput("");
    }

    // Check deterministic local intent first (instant, 100% reliable)
    const localMatch = getDeterministicLocalResponse(query, products);
    if (localMatch) {
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant`,
          sender: "ai",
          text: localMatch.text,
          actions: localMatch.actions,
        },
      ]);
      return;
    }

    setIsThinking(true);

    try {
      const historyPayload: AiChatMessage[] = nextMessages
        .slice(-6)
        .map((message) => ({
          role:
            message.sender === "user"
              ? ("user" as const)
              : ("assistant" as const),
          content: message.text,
        }));

      const productSample = products
        .slice(0, 10)
        .map((product) => `${product.name} (R${product.price})`)
        .join(", ");

      const contextData = productSample
        ? [
            `Store brand: ${BRAND.name}.`,
            "Assistant identity: TJC-OS.",
            `Featured catalogue products: ${productSample}.`,
            `Total products in this catalogue snapshot: ${products.length}.`,
            "Catalogue data is not a guarantee of current stock or final pricing.",
            "Do not invent delivery times, returns policies, payment methods, or order status.",
            "Online checkout and payment processing must not be claimed as live unless verified.",
            "Official customer support is available through the WhatsApp action in the chat.",
          ].join(" ")
        : [
            `Store brand: ${BRAND.name}.`,
            "Assistant identity: TJC-OS.",
            "No catalogue products were available in this request.",
            "Do not invent products, prices, stock, delivery times, returns policies, payment methods, or order status.",
            "Official customer support is available through the WhatsApp action in the chat.",
          ].join(" ");

      const response = await sendAiChatMessage({
        data: {
          mode: "customer",
          messages: historyPayload,
          contextData,
        },
      });

      if (response.status === "rate_limited") {
        setMessages((previous) => [
          ...previous,
          {
            id: `${Date.now()}-assistant`,
            sender: "ai",
            text: "The AI assistant is receiving a high volume of requests right now. Please try again shortly or chat with our team on WhatsApp.",
            actions: [
              {
                type: "whatsapp",
                label: "Request Further Support",
                payload: WHATSAPP_SUPPORT_MESSAGE,
              },
            ],
          },
        ]);
      } else if (
        response.status === "unconfigured" ||
        response.status === "invalid_key"
      ) {
        setMessages((previous) => [
          ...previous,
          {
            id: `${Date.now()}-assistant`,
            sender: "ai",
            text: "I'm temporarily unable to access live AI responses. Our customer support team is available on WhatsApp to assist you directly.",
            actions: [
              {
                type: "whatsapp",
                label: "Request Further Support",
                payload: WHATSAPP_SUPPORT_MESSAGE,
              },
            ],
          },
        ]);
      } else if (response.status === "service_unavailable") {
        setMessages((previous) => [
          ...previous,
          {
            id: `${Date.now()}-assistant`,
            sender: "ai",
            text: "I'm temporarily unable to get a reliable answer from the AI service. Our support team is ready to assist you on WhatsApp.",
            actions: [
              {
                type: "whatsapp",
                label: "Request Further Support",
                payload: WHATSAPP_SUPPORT_MESSAGE,
              },
            ],
          },
        ]);
      } else {
        let replyText = response.text?.trim() || "";
        // Clean out raw WhatsApp links from text to ensure structured button presentation
        replyText = replyText
          .replace(/https?:\/\/wa\.me\/\S+/gi, "")
          .replace(/Contact our team on WhatsApp:\s*$/i, "")
          .replace(/at\s*:\s*$/i, "")
          .trim();

        if (!replyText) {
          setMessages((previous) => [
            ...previous,
            {
              id: `${Date.now()}-assistant`,
              sender: "ai",
              text: "I didn't receive a complete answer. Please try again, or contact our customer support team directly.",
              actions: [
                {
                  type: "whatsapp",
                  label: "Request Further Support",
                  payload: WHATSAPP_SUPPORT_MESSAGE,
                },
              ],
            },
          ]);
        } else {
          const actions: ChatAction[] | undefined =
            response.suggestedAction === "whatsapp"
              ? [
                  {
                    type: "whatsapp",
                    label: "Chat on WhatsApp",
                    payload: WHATSAPP_SUPPORT_MESSAGE,
                  },
                ]
              : undefined;

          setMessages((previous) => [
            ...previous,
            {
              id: `${Date.now()}-assistant`,
              sender: "ai",
              text: replyText,
              actions,
            },
          ]);
        }
      }
    } catch (error) {
      console.warn("AI chat request failed:", error);
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant`,
          sender: "ai",
          text: "I'm temporarily unable to connect to the AI service. Our customer support team is available on WhatsApp to help you right away.",
          actions: [
            {
              type: "whatsapp",
              label: "Request Further Support",
              payload: WHATSAPP_SUPPORT_MESSAGE,
            },
          ],
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleReset() {
    setMessages([
      {
        ...getWelcomeMessage(),
        id: `welcome-${Date.now()}`,
        text: `Hello again! I'm TJC-OS, your AI assistant for ${BRAND.name}. How can I help you today?`,
      },
    ]);
    setInput("");
  }

  function handleWhatsAppSupport(payload?: string) {
    openWhatsApp(payload || WHATSAPP_SUPPORT_MESSAGE);
  }

  return (
    <>
      {!pageMode && (
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
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <p className="text-xs font-semibold text-foreground">
                    WhatsApp Support
                  </p>

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

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              void navigate({ to: "/ai-assistant" });
            }}
            aria-label="Open TJC-OS AI assistant"
            aria-expanded={pageMode || aiOpen}
            className="relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-tr from-amber-600 via-gold to-yellow-300 text-stone-950 shadow-lg ring-1 ring-white/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
          >
            <Bot className="h-6 w-6" />

            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            </span>
          </button>
        </div>
      )}

      {(aiOpen || pageMode) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="TJC-OS AI assistant"
          className={
            pageMode
              ? "fixed inset-0 z-[100] flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden border-0 bg-[#080808] text-white shadow-2xl"
              : "fixed bottom-24 right-3 flex w-[calc(100vw-24px)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gold/40 bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 z-[70] sm:bottom-6 sm:right-20"
          }
        >
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-card via-card to-gold/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              {pageMode && (
                <button
                  type="button"
                  onClick={() => void navigate({ to: "/" })}
                  className="mr-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Back to store"
                  aria-label="Back to store"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}

              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gold/20 text-gold shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  TJC-OS
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    AI Assistant
                  </span>
                </p>

                <p className="text-[11px] text-muted-foreground">
                  Powered by TJC-OS · {BRAND.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Restart conversation"
                aria-label="Restart conversation"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pageMode) {
                    void navigate({ to: "/" });
                  } else {
                    setAiOpen(false);
                  }
                }}
                title={pageMode ? "Return to store" : "Close chat"}
                aria-label={pageMode ? "Return to store" : "Close chat"}
                className="flex items-center gap-1 rounded-lg border border-border/40 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {pageMode && <span className="hidden sm:inline font-medium text-[11px]">Exit</span>}
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-b border-border/60 bg-muted/20 px-3 py-2 text-xs">
            <button
              type="button"
              disabled={isThinking}
              onClick={() =>
                void handleSend("What are your delivery times across South Africa?")
              }
              className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-gold hover:text-foreground disabled:opacity-50"
            >
              📦 Delivery Times
            </button>

            <button
              type="button"
              disabled={isThinking}
              onClick={() =>
                void handleSend("How can I place an order via WhatsApp?")
              }
              className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-gold hover:text-foreground disabled:opacity-50"
            >
              🛒 Order via WhatsApp
            </button>

            <button
              type="button"
              disabled={isThinking}
              onClick={() => void handleSend("What is your returns policy?")}
              className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-gold hover:text-foreground disabled:opacity-50"
            >
              🔄 Returns
            </button>

            <button
              type="button"
              disabled={isThinking}
              onClick={() => void handleSend("I would like to speak to an agent")}
              className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-gold hover:text-foreground disabled:opacity-50"
            >
              💬 Human Support
            </button>
          </div>

          <div
            className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 text-xs ${
              pageMode ? "" : "h-80"
            }`}
            aria-live="polite"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                    message.sender === "user"
                      ? "rounded-br-xs bg-gold font-medium text-stone-950"
                      : "rounded-bl-xs border border-border/80 bg-muted/80 text-foreground"
                  }`}
                >
                  {message.text}
                </div>

                {/* Structured action buttons */}
                {((message.actions && message.actions.length > 0) ||
                  message.action?.type === "whatsapp") && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {message.actions?.map((act, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleWhatsAppSupport(act.payload)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366]/15 px-3 py-1.5 text-[11px] font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5 fill-current" />
                        <span>{act.label}</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </button>
                    ))}
                    {!message.actions && message.action?.type === "whatsapp" && (
                      <button
                        type="button"
                        onClick={() => handleWhatsAppSupport()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366]/15 px-3 py-1.5 text-[11px] font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/25"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5 fill-current" />
                        <span>{message.action.label}</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 self-start rounded-2xl border border-border/80 bg-muted/60 px-3.5 py-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                <span className="text-[11px]">TJC-OS is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask TJC-OS about products, orders or support..."
              disabled={isThinking}
              aria-label="Message TJC-OS"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />

            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="grid h-8 w-8 place-items-center rounded-xl bg-gold text-stone-950 transition-transform active:scale-95 disabled:opacity-40"
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
