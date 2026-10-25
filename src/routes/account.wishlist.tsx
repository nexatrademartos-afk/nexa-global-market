import { createFileRoute } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { fetchStoreCatalogue } from "@/lib/preview-data";
import { WishlistView } from "./wishlist";

export const Route = createFileRoute("/account/wishlist")({
  loader: () => fetchStoreCatalogue(),
  head: accountHead("Shopping & Savings", "Your saved items."),
  component: AccountWishlistPage,
});

function AccountWishlistPage() {
  const catalogue = Route.useLoaderData();

  return (
    <AccountPage title="Shopping & Savings" intro="Your saved products and items.">
      <WishlistView catalogue={catalogue} />
    </AccountPage>
  );
}
