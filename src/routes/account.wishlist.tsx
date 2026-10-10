import { createFileRoute } from "@tanstack/react-router";
import { accountHead } from "@/components/AccountPage";
import { WishlistView } from "./wishlist";

export const Route = createFileRoute("/account/wishlist")({
  head: accountHead("Wishlist", "Your saved items."),
  component: WishlistView,
});
