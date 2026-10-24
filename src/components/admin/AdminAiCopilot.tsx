import { useState, useRef, useEffect } from "react";
import {
  BrainCircuit,
  Sparkles,
  Send,
  RotateCcw,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  Package,
  ShoppingBag,
  Users,
  Headset,
} from "lucide-react";
import { sendAiChatMessage } from "@/lib/ai/server";
import type { ChatMessage as AiChatMessage } from "@/lib/ai/types";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type Order = Tables<"orders">;
type RoleApplication = Tables<"role_applications">;
type ContactMessage = Tables<"contact_messages">;

interface AdminAiCopilotProps {
  products: Product[];
  orders: Order[];
  applications: RoleApplication[];
  messages: ContactMessage[];
  totalRevenue: number;
  paidRevenue: number;
  pendingOrders: number;
  lowStockProducts: Product[];
  currency: (val: number) => string;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

const QUICK_ACTIONS = [
  {
    id: "briefing",
    icon: Sparkles,
    label: "CEO Daily Briefing",
    description: "Summarize today's revenue, order health, and priorities",
    prompt:
      "Please generate a concise executive daily briefing for the CEO. Highlight current revenue metrics, pending orders needing attention, inventory risks, and top 3 immediate action items for today.",
  },
  {
    id: "inventory",
    icon: Package,
    label: "Restock & Inventory Audit",
    description: "Analyze out-of-stock and low-stock items",
    prompt:
      "Audit our current inventory health. Identify products that are at or below stock threshold, calculate estimated restock urgency, and draft a procurement note for our warehouse supplier.",
  },
  {
    id: "orders",
    icon: ShoppingBag,
    label: "Fulfilment & Order Health",
    description: "Check pending, processing, and unpaid orders",
    prompt:
      "Analyze all pending and processing orders. Flag any orders requiring fulfillment action, payment verification, or customer follow-up, and recommend operational steps to expedite delivery.",
  },
  {
    id: "applications",
    icon: Users,
    label: "Review Role Applications",
    description: "Evaluate pending staff and partner submissions",
    prompt:
      "Review the pending staff, supplier, and partner applications. Provide a quick summary of each candidate, evaluating their fit and giving a recommendation (Approve/Reject/Request more info).",
  },
  {
    id: "support",
    icon: Headset,
    label: "Draft Customer Support Replies",
    description: "Auto-draft replies for unread customer inquiries",
    prompt:
      "Review our latest unread customer contact messages. Draft professional, empathetic, and store-accurate replies for each customer enquiry so I can review and send them quickly.",
  },
];

export function AdminAiCopilot({
  products,
  orders,
  applications,
  messages,
  totalRevenue,
  paidRevenue,
  pendingOrders,
  lowStockProducts,
  currency,
}: AdminAiCopilotProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "ai",
      text: "Greetings, Administrator. I am Nexa Intelligence, your operational copilot. I have loaded live records for your products, orders, role applications, and customer messages. Select a quick executive workflow below or ask any operational question.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, loading]);

  function buildLiveContext(): string {
    const topLowStock = lowStockProducts
      .slice(0, 10)
      .map((p) => `${p.name} (Stock: ${p.stock}, SKU: ${p.sku || "N/A"})`)
      .join("; ");

    const recentOrders = orders
      .slice(0, 10)
      .map(
        (o) =>
          `ID: ${o.id.slice(0, 8)} | Customer: ${o.customer_name} | Amount: R${o.total} | Status: ${o.status} | Pay: ${o.payment_status}`
      )
      .join("\n");

    const pendingApps = applications
      .filter((a) => a.status === "pending")
      .slice(0, 5)
      .map((a) => `Role: ${a.requested_role} | Applicant ID: ${a.applicant_id.slice(0, 8)}`)
      .join("; ");

    const unreadMsgs = messages
      .filter((m) => !m.is_read)
      .slice(0, 5)
      .map((m) => `From: ${m.name} (${m.email}) | Subject: ${m.subject || "No subject"} | Msg: ${m.message}`)
      .join("\n");

    return [
      `Total Catalog Products: ${products.length}`,
      `Low / Out of stock Products (${lowStockProducts.length}): ${topLowStock || "None"}`,
      `Total Orders Recorded: ${orders.length}`,
      `Pending Fulfilment / Processing Orders: ${pendingOrders}`,
      `Total Non-cancelled Revenue: ${currency(totalRevenue)}`,
      `Verified Paid Revenue: ${currency(paidRevenue)}`,
      `Pending Role Applications (${applications.filter((a) => a.status === "pending").length}): ${pendingApps || "None"}`,
      `Unread Customer Inquiries (${messages.filter((m) => !m.is_read).length}):\n${unreadMsgs || "None"}`,
      `Recent Orders Sample:\n${recentOrders || "None"}`,
    ].join("\n\n");
  }

  async function handleSend(promptText?: string) {
    const textToSend = (promptText ?? input).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...chatMessages, userMessage];
    setChatMessages(nextMessages);
    if (!promptText) setInput("");
    setLoading(true);

    try {
      const historyPayload: AiChatMessage[] = nextMessages.slice(-6).map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      const contextData = buildLiveContext();

      const response = await sendAiChatMessage({
        data: {
          mode: "admin",
          messages: historyPayload,
          contextData,
        },
      });

      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: response.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      console.error("Copilot error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: `Operational note: ${err?.message || "Could not generate AI report. Please check that GEMINI_API_KEY is configured in your server environment."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(id: string, text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleReset() {
    setChatMessages([
      {
        id: "init",
        sender: "ai",
        text: "Executive session reset. Live records are synchronized. How can I assist with your marketplace operations?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }

  return (
    <div className="space-y-6">
      {/* Header and status banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-gold/40 bg-gold/10 text-gold shadow-sm">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Nexa Intelligence
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                Operational Copilot Active
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Empowering administrators and executives by automating 80% of routine management, analysis, and correspondence.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="btn btn-outline text-xs flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset session
        </button>
      </div>

      {/* Quick 1-Click Executive Action Cards */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Operational Automations
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                disabled={loading}
                onClick={() => void handleSend(action.prompt)}
                className="group flex flex-col items-start rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-gold hover:bg-gold/5 disabled:opacity-50"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="grid h-8 w-8 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold group-hover:scale-105 transition-transform">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    Run →
                  </span>
                </div>
                <h4 className="mt-3 text-sm font-semibold text-foreground group-hover:text-gold transition-colors">
                  {action.label}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive AI Chat & Report Terminal */}
      <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
        {/* Terminal top bar */}
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live Copilot Dialogue
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Model: Provider-Agnostic Engine
          </span>
        </div>

        {/* Message feed */}
        <div className="p-4 space-y-4 max-h-[500px] min-h-[300px] overflow-y-auto">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {msg.sender === "user" ? "Administrator" : "Nexa Intelligence"}
                </span>
                <span className="text-[10px] text-muted-foreground/60">{msg.timestamp}</span>
              </div>

              <div
                className={`relative group max-w-[90%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted/60 text-foreground border border-border/80 rounded-tl-none font-sans"
                }`}
              >
                {msg.text}

                {msg.sender === "ai" && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(msg.id, msg.text)}
                    title="Copy response"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-background/80 p-1.5 text-muted-foreground hover:text-foreground border border-border"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 rounded-2xl rounded-tl-none border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              <span>Nexa Intelligence is analyzing operational records and drafting brief...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="border-t border-border bg-muted/10 p-3 flex gap-2 items-center"
        >
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about inventory, supplier vetting, order trends, revenue analysis, or draft a memo..."
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
