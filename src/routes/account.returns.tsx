import { createFileRoute } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { NotConnected, PlannedBadge } from "@/components/states";

export const Route = createFileRoute("/account/returns")({
  head: accountHead("Returns & support", "Request returns and get help."),
  component: () => (
    <AccountPage title="Returns & support">
      <NotConnected what="Return requests and support tickets" />
      <div className="surface flex items-center justify-between p-4"><span className="text-sm font-medium">Live chat with NEXA support</span><PlannedBadge /></div>
    </AccountPage>
  ),
});
