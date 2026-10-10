import { createFileRoute } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { PlannedBadge } from "@/components/states";

export const Route = createFileRoute("/account/rewards")({
  head: accountHead("Rewards & referrals", "NEXA Rewards and referral program."),
  component: () => (
    <AccountPage title="Rewards & referrals" intro="Get Rewarded — earn on orders and invites.">
      <div className="rounded-2xl bg-ink p-6 text-ink-foreground">
        <p className="text-xs uppercase tracking-widest text-gold">NEXA Rewards</p>
        <p className="mt-2 font-display text-3xl font-bold">—</p>
        <p className="mt-1 text-sm opacity-70">No balance is shown until the rewards program is live and verified.</p>
      </div>
      {["Points history", "Referral link", "Referral status"].map((t) => (
        <div key={t} className="surface flex items-center justify-between p-4"><span className="text-sm font-medium">{t}</span><PlannedBadge /></div>
      ))}
    </AccountPage>
  ),
});
