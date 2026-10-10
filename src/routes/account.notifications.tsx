import { createFileRoute } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { EmptyState } from "@/components/states";

export const Route = createFileRoute("/account/notifications")({
  head: accountHead("Notifications", "Updates on orders and offers."),
  component: () => (
    <AccountPage title="Notifications">
      <EmptyState title="No notifications" body="Order, delivery and reward updates will appear here once your account is connected." />
    </AccountPage>
  ),
});
