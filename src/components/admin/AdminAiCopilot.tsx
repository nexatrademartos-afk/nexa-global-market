import { useState, useRef, useEffect } from "react";
import {
  BrainCircuit,
  Sparkles,
  Send,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  TrendingUp,
  Package,
  Clock,
  UserCheck,
  Mail,
  ShieldCheck,
  Info,
  Terminal,
} from "lucide-react";
import { sendAiChatMessage } from "@/lib/ai/server";
import type { ChatMessage as AiChatMessage } from "@/lib/ai/types";

interface Product {
  id: string;
  name: string;
  stock: number;
  sku?: string | null;
  price?: number;
}

interface Order {
  id: string;
  customer_name?: string | null;
  total: number;
  status: string;
  payment_status?: string | null;
  created_at?: string;
}

interface Application {
  id: string;
  status: string;
  requested_role: string;
  applicant_id?: string | null;
  created_at?: string;
}

interface ContactMessage {
  id: string;
  is_read: boolean;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}

interface AdminAiCopilotProps {
  products: Product[];
  orders: Order[];
  applications: Application[];
  messages: ContactMessage[];
  totalRevenue: number;
  paidRevenue: number;
  pendingOrders: number;
  lowStockProducts: Product[];
  currency: (amount: number) => string;
}

interface CopilotMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  isDeterministicFallback?: boolean;
}

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
  const [chatMessages, setChatMessages] = useState<CopilotMessage[]>([
    {
      id: "init",
      sender: "ai",
      text: "NEXA Intelligence Copilot initialized. I have live access to your catalogue, orders, applications, and customer messages. Choose an operational action below or type a query to automate executive tasks.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiStatusBanner, setApiStatusBanner] = useState<{
    type: "info" | "warning" | "error" | "rate_limited";
    message: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, loading]);

  // Deterministic rule-based engines for 100% offline uptime
  function generateRuleBasedBriefing(type: string): string {
    const unreadMessages = messages.filter((m) => !m.is_read).length;
    const pendingApps = applications.filter((a) => a.status === "pending").length;

    switch (type) {
      case "ceo_briefing":
        return `### 📊 CEO Daily Operational Briefing (Live Records)

**1. Revenue & Cash Flow**
- Total potential marketplace revenue: **${currency(totalRevenue)}**
- Verified paid revenue: **${currency(paidRevenue)}**
- Active pipeline orders: **${pendingOrders}** pending fulfilment or payment review.

**2. Supply Chain & Inventory**
- Total catalogue lines: **${products.length}**
- Low / Out of stock items requiring restock: **${lowStockProducts.length}**

**3. Workforce & Growth**
- Role applications awaiting administrative decision: **${pendingApps}**

**4. Customer Care & Sentiment**
- Unread customer inquiries: **${unreadMessages}**

**🎯 Priority Administrative Directive:**
${
  lowStockProducts.length > 0
    ? `• Restock immediate: ${lowStockProducts.slice(0, 3).map((p) => p.name).join(", ")}.\n`
    : "• Stock levels are healthy across primary lines.\n"
}${
  pendingOrders > 0
    ? `• Dispatch or verify payment on ${pendingOrders} awaiting order(s).\n`
    : ""
}${
  pendingApps > 0
    ? `• Review ${pendingApps} pending team / partner application(s).\n`
    : ""
}`;

      case "restock_audit":
        if (lowStockProducts.length === 0) {
          return `### 📦 Restock & Inventory Audit
All ${products.length} products in the catalogue currently meet or exceed minimum stock thresholds. No urgent supplier orders required today.`;
        }
        return `### 📦 Restock & Inventory Audit

The following **${lowStockProducts.length}** item(s) are critically low or out of stock:

${lowStockProducts
  .map(
    (p, i) =>
      `${i + 1}. **${p.name}** (SKU: ${p.sku || "N/A"}) — **${p.stock} units remaining**`
  )
  .join("\n")}

**Recommended Action:**
Contact regional suppliers to place restocking orders for these lines to prevent lost cart conversions.`;

      case "fulfilment_health":
        return `### 🚚 Fulfilment & Order Health Audit

- **Active Pending Orders:** ${pendingOrders}
- **Pipeline Value:** ${currency(totalRevenue - paidRevenue)}
- **Fulfillment Status:**
  ${
    pendingOrders === 0
      ? "All orders have been fulfilled or settled. Zero pending backlog."
      : `Orders require fulfilment team dispatch. Prioritize orders with verified payment status.`
  }`;

      case "review_applications":
        const pendingList = applications.filter((a) => a.status === "pending");
        if (pendingList.length === 0) {
          return `### 👥 Role Applications Audit
There are currently no pending role applications awaiting review. All partner, supplier, and staff applications are settled.`;
        }
        return `### 👥 Role Applications Audit

Found **${pendingList.length}** application(s) awaiting administrative review:

${pendingList
  .slice(0, 5)
  .map(
    (app, i) =>
      `${i + 1}. Role: **${app.requested_role.toUpperCase()}** — ID: \`${app.id.slice(0, 8)}...\` (Submitted: ${app.created_at ? new Date(app.created_at).toLocaleDateString() : "Recent"})`
  )
  .join("\n")}

**Recommendation:**
Open the **Applications** tab to review credentials and approve or decline applicant access.`;

      case "support_replies":
        const unread = messages.filter((m) => !m.is_read);
        if (unread.length === 0) {
          return `### ✉️ Support Inquiries Audit
Zero unread customer messages in the inbox. Customer satisfaction is up to date!`;
        }
        return `### ✉️ Draft Support Replies

Found **${unread.length}** unread message(s):

${unread
  .slice(0, 3)
  .map(
    (msg, i) =>
      `**Customer:** ${msg.name} (${msg.email})\n**Subject:** ${msg.subject || "Order/General enquiry"}\n**Message:** "${msg.message}"\n\n*Suggested Reply:*\n"Dear ${msg.name},\n\nThank you for reaching out to NEXA GLOBAL MART. We have received your inquiry regarding '${msg.subject || "your message"}' and our operations team is reviewing it immediately. You can also reach us directly on WhatsApp at +27 68 496 3972 with your reference number.\n\nWarm regards,\nNEXA Global Mart Care Team"\n`
  )
  .join("\n---\n")}`;

      default:
        return `### Operational Summary
- Catalogue Items: ${products.length}
- Low Stock: ${lowStockProducts.length}
- Pending Orders: ${pendingOrders}
- Total Revenue Potential: ${currency(totalRevenue)}`;
    }
  }

  function buildLiveContext() {
    return [
      `CATALOGUE: Total ${products.length} products. Low stock count (${lowStockProducts.length}): ${lowStockProducts.map((p) => `${p.name} (stock: ${p.stock})`).join(", ") || "None"}.`,
      `ORDERS: Total ${orders.length} orders. Pending orders: ${pendingOrders}. Total pipeline revenue: ${currency(totalRevenue)}. Paid revenue: ${currency(paidRevenue)}.`,
      `APPLICATIONS: Total ${applications.length} applications. Pending review: ${applications.filter((a) => a.status === "pending").length}.`,
      `SUPPORT MESSAGES: Total ${messages.length} messages. Unread count: ${messages.filter((m) => !m.is_read).length}.`,
    ].join("\n");
  }

  async function handleSend(promptText?: string, automationKey?: string) {
    const textToSend = (promptText || input).trim();
    if (!textToSend || loading) return;

    const userMessage: CopilotMessage = {
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

      // Handle unconfigured or rate limited gracefully with deterministic fallback
      if (response.status === "unconfigured") {
        setApiStatusBanner({
          type: "warning",
          message:
            "GEMINI_API_KEY is not configured in server environment variables. Deterministic rule-based analysis is active.",
        });
        const fallbackText = automationKey
          ? generateRuleBasedBriefing(automationKey)
          : `${generateRuleBasedBriefing("general")}\n\n*(Note: To enable custom conversational AI answers, add GEMINI_API_KEY to your server environment variables)*`;

        setChatMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: "ai",
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isDeterministicFallback: true,
          },
        ]);
      } else if (response.status === "rate_limited") {
        setApiStatusBanner({
          type: "rate_limited",
          message: "Google Gemini rate limit (HTTP 429) reached. Running automated rule-based analysis.",
        });
        const fallbackText = automationKey
          ? generateRuleBasedBriefing(automationKey)
          : `⚠️ **Rate Limit Notice**: Google Gemini quota is momentarily exhausted.\n\n${generateRuleBasedBriefing("general")}`;

        setChatMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: "ai",
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isDeterministicFallback: true,
          },
        ]);
      } else if (response.status === "invalid_key") {
        setApiStatusBanner({
          type: "error",
          message: "The configured GEMINI_API_KEY is invalid or rejected by Google AI Studio.",
        });
        const fallbackText = automationKey
          ? generateRuleBasedBriefing(automationKey)
          : generateRuleBasedBriefing("general");

        setChatMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: "ai",
            text: `❌ **Authentication Notice**: Your Gemini API key was rejected by Google.\n\n${fallbackText}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isDeterministicFallback: true,
          },
        ]);
      } else {
        // Successful generation
        setApiStatusBanner(null);
        setChatMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: "ai",
            text: response.text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err: unknown) {
      console.warn("Copilot execution notice:", err);
      const fallbackText = automationKey
        ? generateRuleBasedBriefing(automationKey)
        : generateRuleBasedBriefing("general");

      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isDeterministicFallback: true,
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">NEXA Intelligence Copilot</h2>
              <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold">
                Operations & Executive
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live marketplace automation for inventory, orders, partner approvals, and executive decisions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Session
          </button>
        </div>
      </div>

      {/* Diagnostics / Status Notice */}
      {apiStatusBanner && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 text-xs ${
            apiStatusBanner.type === "error"
              ? "border-red-500/40 bg-red-500/10 text-red-200"
              : apiStatusBanner.type === "rate_limited"
              ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
              : "border-gold/40 bg-gold/10 text-gold"
          }`}
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">System Diagnostics</p>
            <p className="mt-0.5 opacity-90">{apiStatusBanner.message}</p>
          </div>
        </div>
      )}

      {/* 1-Click Executive Action Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            handleSend(
              "Generate an executive CEO daily briefing analyzing our revenue pipeline, inventory risks, pending orders, and immediate priorities.",
              "ceo_briefing"
            )
          }
          className="flex flex-col text-left rounded-2xl border border-border bg-card p-4 transition-all hover:border-gold hover:shadow-md disabled:opacity-50"
        >
          <div className="flex items-center justify-between text-gold">
            <TrendingUp className="h-5 w-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Executive</span>
          </div>
          <p className="mt-2.5 font-bold text-sm text-foreground">CEO Daily Briefing</p>
          <p className="mt-1 text-xs text-muted-foreground">Revenue, order backlog & daily directives.</p>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            handleSend(
              "Perform a comprehensive restock and inventory audit. List items at or below safety stock threshold and calculate restock priority.",
              "restock_audit"
            )
          }
          className="flex flex-col text-left rounded-2xl border border-border bg-card p-4 transition-all hover:border-gold hover:shadow-md disabled:opacity-50"
        >
          <div className="flex items-center justify-between text-amber-400">
            <Package className="h-5 w-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Catalogue</span>
          </div>
          <p className="mt-2.5 font-bold text-sm text-foreground">Restock & Inventory Audit</p>
          <p className="mt-1 text-xs text-muted-foreground">Audit {lowStockProducts.length} low-stock lines.</p>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            handleSend(
              "Audit all pending and processing orders. Flag fulfilment bottlenecks, unpaid orders, and priority dispatches.",
              "fulfilment_health"
            )
          }
          className="flex flex-col text-left rounded-2xl border border-border bg-card p-4 transition-all hover:border-gold hover:shadow-md disabled:opacity-50"
        >
          <div className="flex items-center justify-between text-blue-400">
            <Clock className="h-5 w-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Operations</span>
          </div>
          <p className="mt-2.5 font-bold text-sm text-foreground">Fulfilment Health</p>
          <p className="mt-1 text-xs text-muted-foreground">Check {pendingOrders} pending order(s).</p>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            handleSend(
              "Summarize all pending partner and staff role applications. Provide candidate verification recommendations.",
              "review_applications"
            )
          }
          className="flex flex-col text-left rounded-2xl border border-border bg-card p-4 transition-all hover:border-gold hover:shadow-md disabled:opacity-50"
        >
          <div className="flex items-center justify-between text-purple-400">
            <UserCheck className="h-5 w-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">HR / Roles</span>
          </div>
          <p className="mt-2.5 font-bold text-sm text-foreground">Review Applications</p>
          <p className="mt-1 text-xs text-muted-foreground">Summarize pending applicant reviews.</p>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            handleSend(
              "Review customer contact messages. Draft professional, helpful replies referencing our South African WhatsApp helpline.",
              "support_replies"
            )
          }
          className="flex flex-col text-left rounded-2xl border border-border bg-card p-4 transition-all hover:border-gold hover:shadow-md disabled:opacity-50"
        >
          <div className="flex items-center justify-between text-emerald-400">
            <Mail className="h-5 w-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Support</span>
          </div>
          <p className="mt-2.5 font-bold text-sm text-foreground">Draft Support Replies</p>
          <p className="mt-1 text-xs text-muted-foreground">Draft replies to customer queries.</p>
        </button>
      </div>

      {/* Main Conversation Canvas */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-xs font-semibold text-foreground">Copilot Workspace</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Synchronized with Supabase Database
          </span>
        </div>

        {/* Message feed */}
        <div className="flex h-[420px] flex-col gap-4 overflow-y-auto p-5 text-sm">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1 px-1">
                <span>{msg.sender === "user" ? "Administrator" : "NEXA Copilot"}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {msg.isDeterministicFallback && (
                  <span className="rounded bg-amber-500/15 px-1 py-0.2 text-[10px] font-semibold text-amber-400">
                    Rule-Based Verification
                  </span>
                )}
              </div>

              <div
                className={`group relative max-w-[90%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-gold text-stone-950 font-medium rounded-br-xs"
                    : "bg-muted/60 text-foreground border border-border/80 rounded-bl-xs"
                }`}
              >
                {msg.text}

                {msg.sender === "ai" && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(msg.id, msg.text)}
                    className="absolute top-2 right-2 rounded-lg border border-border/60 bg-background/80 p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
                    title="Copy report to clipboard"
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
            <div className="flex items-center gap-2.5 self-start rounded-2xl border border-border/80 bg-muted/40 px-4 py-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              <span className="text-xs">Analyzing live records and compiling executive briefing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="flex items-center gap-2 border-t border-border bg-card p-3 sm:p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the copilot: e.g. 'Draft an order fulfilment memo' or 'Which category generates highest revenue?'..."
            disabled={loading}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-stone-950 disabled:opacity-40 transition-transform active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
