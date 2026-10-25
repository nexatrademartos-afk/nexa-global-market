
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
import { NotConnected, PlannedBadge } from "@/components/states";

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
    planned: true,
  },
  {
    label: "Purchases & payments",
    description: "Wallet payments linked to orders",
    icon: ShoppingBag,
    planned: true,
  },
  {
    label: "Rewards & Q Points",
    description: "View rewards separately from cash",
    icon: Gift,
    planned: true,
  },
  {
    label: "Referrals & commissions",
    description: "Pending and approved rewards",
    icon: Users,
    planned: true,
  },
  {
    label: "NEXA transfers",
    description: "Designed now; activation requires approval",
    icon: ArrowLeftRight,
    planned: true,
  },
  {
    label: "Deposits & withdrawals",
    description: "Deposit reconciliation and future payouts",
    icon: Banknote,
    planned: true,
  },
  {
    label: "Refunds & reversals",
    description: "Refund and correction records",
    icon: ReceiptText,
    planned: true,
  },
  {
    label: "Wallet settings & security",
    description: "PIN setup, recovery and security controls",
    icon: Settings,
    planned: true,
  },
];

function WalletPage() {
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

          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Setup required
          </span>
        </div>

        <section className="overflow-hidden rounded-3xl border border-gold/30 bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Available wallet balance
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Not connected
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Your real ZAR balance will appear here after wallet
                registration and secure backend connection.
              </p>
            </div>

            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-gold/40 bg-gold/10 text-gold">
              <Wallet className="h-6 w-6" />
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <WalletAction
              icon={ArrowDownToLine}
              label="Add money"
              detail="Provider approval required"
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
                This is the wallet interface preview. No wallet balance,
                deposit, transfer or payout is connected or simulated.
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
              <h2 className="font-bold">Register for your wallet</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Wallet enrollment will be optional and linked to your signed-in
                customer account. Your website account does not automatically
                create a wallet.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• South African rand (ZAR) for the first release</li>
                <li>• Six-digit wallet PIN with secure recovery</li>
                <li>• Minimum necessary verification</li>
                <li>• Unique wallet account number</li>
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <PlannedBadge label="Enrollment not connected" />
                <span className="text-xs text-muted-foreground">
                  Registration becomes available after the approved flow is built.
                </span>
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
                      <PlannedBadge label="Planned" />
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
                Wallet support and transaction investigations will be available
                when the wallet service is connected.
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
      className="flex min-h-24 items-center gap-3 rounded-2xl border p-4 opacity-75"
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
          
