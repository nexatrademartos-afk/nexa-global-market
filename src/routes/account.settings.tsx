import { createFileRoute } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { PlannedBadge } from "@/components/states";

export const Route = createFileRoute("/account/settings")({
  head: accountHead("Settings & privacy", "Manage preferences, privacy and security."),
  component: () => (
    <AccountPage title="Settings & privacy">
      {["Email & SMS preferences", "Language & currency", "Change password", "Download my data", "Delete account"].map((t) => (
        <div key={t} className="surface flex items-center justify-between p-4"><span className="text-sm font-medium">{t}</span><PlannedBadge /></div>
      ))}
    </AccountPage>
  ),
});
