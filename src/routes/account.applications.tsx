import { createFileRoute } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { PlannedBadge } from "@/components/states";
import { WORKSPACES } from "@/lib/workspaces";

const APPLYABLE = ["partner", "delivery", "commission"];

export const Route = createFileRoute("/account/applications")({
  head: accountHead("Role applications", "Apply to become a NEXA partner, delivery or commission partner."),
  component: () => (
    <AccountPage title="Role applications" intro="Applying does not grant access. NEXA reviews every application before any role is enabled.">
      {WORKSPACES.filter((w) => APPLYABLE.includes(w.key)).map((w) => (
        <div key={w.key} className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><p className="font-semibold">{w.name}</p><p className="text-sm text-muted-foreground">{w.description}</p></div>
          <div className="flex items-center gap-2"><PlannedBadge label="Opens soon" /><button disabled className="btn btn-outline">Apply</button></div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Staff roles (Administration, CEO, Finance, Security) are assigned by NEXA leadership and cannot be applied for.</p>
    </AccountPage>
  ),
});
