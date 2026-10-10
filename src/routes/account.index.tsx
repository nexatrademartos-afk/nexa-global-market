import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { ACCOUNT_NAV } from "./account";

export const Route = createFileRoute("/account/")({
  head: accountHead("Overview", "Your NEXA customer dashboard."),
  component: () => (
    <AccountPage title="Welcome to NEXA" intro="Everything about your shopping in one place.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {ACCOUNT_NAV.slice(1).map((n) => (
          <Link key={n.to} to={n.to} className="surface flex min-h-20 items-end p-4 font-semibold hover:border-gold">{n.label}</Link>
        ))}
      </div>
    </AccountPage>
  ),
});
