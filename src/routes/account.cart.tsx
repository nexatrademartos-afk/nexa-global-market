import { createFileRoute } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { fetchStoreCatalogue } from "@/lib/preview-data";
import { CartView } from "./cart";

export const Route = createFileRoute("/account/cart")({
  loader: () => fetchStoreCatalogue(),
  head: accountHead("Cart", "Items in your cart."),
  component: AccountCartPage,
});

function AccountCartPage() {
  const catalogue = Route.useLoaderData();

  return (
    <AccountPage
      title="My Cart"
      intro="Review your cart items, quantities, and proceed with WhatsApp enquiry."
    >
      <CartView catalogue={catalogue} />
    </AccountPage>
  );
}
