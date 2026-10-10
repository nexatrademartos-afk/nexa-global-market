import { createFileRoute } from "@tanstack/react-router";
import { accountHead } from "@/components/AccountPage";
import { CartView } from "./cart";

export const Route = createFileRoute("/account/cart")({
  head: accountHead("Cart", "Items in your cart."),
  component: CartView,
});
