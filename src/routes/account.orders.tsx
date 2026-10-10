import { createFileRoute } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { NotConnected } from "@/components/states";

export const Route = createFileRoute("/account/orders")({
  head: accountHead("Orders", "Track your NEXA orders."),
  component: () => (
    <AccountPage title="Orders" intro="Order history and live tracking."><NotConnected what="Your orders" /></AccountPage>
  ),
});
