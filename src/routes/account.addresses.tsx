import { createFileRoute } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { NotConnected } from "@/components/states";

export const Route = createFileRoute("/account/addresses")({
  head: accountHead("Addresses", "Saved delivery addresses."),
  component: () => (
    <AccountPage title="Addresses" intro="Delivery and pickup addresses."><NotConnected what="Your saved addresses" /></AccountPage>
  ),
});
