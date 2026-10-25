
import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Clock3,
  Gift,
  History,
  LockKeyhole,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wallet,
  TrendingUp,
  CircleHelp,
} from "lucide-react";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { PlannedBadge } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";

type CustomerWallet = {
  id: string;
  wallet_number: string;
  currency: string;
  status: string;
  created_at: string;
};

export const Route = createFileRoute("/account/wallet")({
  head: accountHead(
    "Identity Brand Wallet",
    "Wallet overview, rewards, payments and transaction history.",
  ),
  component: WalletPage,
});

const navigationItems = [
  {
    label: "Transaction history",
    description: "Deposits, payments and adjustments",
    icon: History,
  },
  {
    label: "Purchases & payments",
    description: "Wallet payments linked to orders",
    icon: ShoppingBag,
  },
  {
    label: "Rewards & Q Points",
    description: "View rewards separately from cash",
    icon: Gift,
  },
  {
    label: "Referrals & commissions",
    description: "Pending and approved rewards",
    icon: Users,
  },
  {
    label: "Wallet transfers",
    description: "Designed now; activation requires approval",
    icon: ArrowLeftRight,
  },
  {
    label: "Deposits & withdrawals",
    description: "Deposit reconciliation and future payouts",
    icon: Banknote,
  },
  {
    label: "Refunds & reversals",
    description: "Refund and correction records",
    icon: ReceiptText,
  },
  {
    label: "Wallet settings & security",
    description: "PIN setup, recovery and security controls",
    icon: Settings,
  },
];

function WalletPage() {
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authData.user) {
        setSignedIn(false);
        setWallet(null);
        return;
      }

      setSignedIn(true);

      const { data, error: walletError } = await supabase
        .from("wallets")
        .select("id, wallet_number, currency, status, created_at")
        .maybeSingle();

      if (walletError) throw walletError;

      setWallet(data);
    } catch (err) {
      console.error("Wallet loading failed:", err);
      setError(
        "We couldn't load your wallet right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  async function registerWallet() {
    if (registering) return;

    setRegistering(true);
    setError("");
    setNotice("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authData.user) {
        setSignedIn(false);
        setError("Please sign in before registering for a wallet.");
        return;
      }

      setSignedIn(true);

      const { error: registerError } = await supabase.rpc(
        "register_my_wallet",
      );

      if (registerError) throw registerError;

      const { data, error: walletError } = await supabase
        .from("wallets")
        .select("id, wallet_number, currency, status, created_at")
        .maybeSingle();

      if (walletError) throw walletError;

      if (!data) {
        throw new Error(
          "Registration returned successfully, but the wallet could not be loaded.",
        );
      }

      setWallet(data);
      setNotice("Your wallet has been registered successfully.");
    } catch (err) {
      console.error("Wallet registration failed:", err);
      setError(
        "We couldn't register your wallet. Please try again. If the problem continues, the database function or permissions may need checking.",
      );
    } finally {
      setRegistering(false);
    }
  }

  const statusLabel = wallet
    ? wallet.status.replaceAll("_", " ")
    : "Not registered";

  return (
    <AccountPage
      title="Identity Brand Wallet"
      intro="Your wallet overview, rewards and financial activity."
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/account"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeftRight className="h-4 w-4 rotate-180" />
            Back to account
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            {loading ? "Checking wallet" : statusLabel}
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadWallet()}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {notice && (
          <p
            role="status"
            className="rounded-xl border border-gold/40 p-3 text-sm"
          >
            {notice}
          </p>
        )}

        <section className="overflow-hidden rounded-3xl border border-gold/30 bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Available wallet balance
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Not available yet
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Your cash balance will appear once the secure wallet ledger
                is implemented. We will not display a guessed or placeholder
                balance.
              </p>
            </div>

            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-gold/40 bg-gold/10 text-gold">
              <Wallet className="h-6 w-6" />
            </span>
          </div>

          {wallet && (
            <div className="mt-5 grid gap-3 rounded-2xl border p-4 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Wallet number</p>
                <p className="mt-1 break-all font-mono text-sm font-semibold">
                  {wallet.wallet_number}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Currency</p>
                <p className="mt-1 text-sm font-semibold">{wallet.currency}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Wallet status</p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {wallet.status.replaceAll("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Registered</p>
                <p className="mt-1 text-sm font-semibold">
                  {new Date(wallet.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <WalletAction
              icon={ArrowDownToLine}
              label="Add money"
              detail="Not activated"
            />
            <WalletAction
              icon={ArrowLeftRight}
              label="Transfer"
              detail="Not activated"
            />
            <WalletAction
              icon={ArrowUpFromLine}
              label="Withdraw"
              detail="Payouts disabled"
            />
          </div>

          <div className="mt-5 rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Wallet enrollment is connected separately from the cash
                ledger. Deposits, transfers and payouts remain disabled until
                their secure flows are approved.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SummaryCard
            icon={Gift}
            title="Q Points"
            value="Not connected"
            detail="Rewards remain separate from cash."
          />
          <SummaryCard
            icon={TrendingUp}
            title="Commissions"
            value="Not connected"
            detail="Pending and approved amounts will be distinguished."
          />
          <SummaryCard
            icon={Clock3}
            title="Pending funds"
            value="Not connected"
            detail="Pending deposits and refunds are not spendable cash."
          />
          <SummaryCard
            icon={LockKeyhole}
            title="Reserved funds"
            value="Not connected"
            detail="Funds held for authorized operations."
          />
        </section>

        <section className="surface rounded-2xl border p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gold/40 bg-gold/10 text-gold">
              <ShieldCheck className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold">
                {wallet ? "Your wallet is registered" : "Register for your wallet"}
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {wallet
                  ? "Your wallet is linked to your signed-in customer account."
                  : "Wallet enrollment is optional and linked securely to your signed-in customer account. Your website account does not automatically create a wallet."}
              </p>

              {!wallet && (
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• South African rand (ZAR) for the first release</li>
                  <li>• Unique wallet account number</li>
                  <li>• Secure six-digit PIN setup will be a separate step</li>
                  <li>• Verification as required before restricted features activate</li>
                </ul>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {loading ? (
                  <span className="text-sm text-muted-foreground">
                    Checking your account…
                  </span>
                ) : wallet ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-3 py-1.5 text-sm font-medium capitalize">
                    <ShieldCheck className="h-4 w-4 text-gold" />
                    {wallet.status.replaceAll("_", " ")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void registerWallet()}
                    disabled={registering || !signedIn}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Wallet className="h-4 w-4" />
                    {registering
                      ? "Registering wallet…"
                      : "Register for my wallet"}
                  </button>
                )}

                {!loading && !signedIn && (
                  <p className="text-xs text-muted-foreground">
                    Sign in to register for a wallet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="surface rounded-2xl border p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Wallet navigation</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Wallet services and account records.
              </p>
            </div>
            <Wallet className="h-5 w-5 text-gold" />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-x-5 sm:grid-cols-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex min-w-0 items-start gap-3 border-b py-4 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                    <span className="mt-2 inline-block">
                      <PlannedBadge label="Not activated" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface rounded-2xl border p-5">
          <div className="flex items-start gap-3">
            <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <h2 className="font-semibold">Need help?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Contact support if wallet registration fails or you need help
                with your account.
              </p>
              <Link
                to="/account/returns"
                className="mt-3 inline-flex text-sm font-semibold text-gold hover:underline"
              >
                Open customer support
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AccountPage>
  );
}

function WalletAction({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof Wallet;
  label: string;
  detail: string;
}) {
  return (
    <div
      aria-disabled="true"
      className="flex min-h-24 items-center gap-3 rounded-2xl border p-4 opacity-60"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold/30 text-gold">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: typeof Wallet;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <section className="surface rounded-2xl border p-5">
      <Icon className="h-5 w-5 text-gold" />
      <h2 className="mt-4 text-sm text-muted-foreground">{title}</h2>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {detail}
      </p>
    </section>
  );
}
