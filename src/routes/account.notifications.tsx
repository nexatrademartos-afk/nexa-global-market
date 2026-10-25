import { createFileRoute } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { Bell } from "lucide-react";
import { PlannedBadge } from "@/components/states";

export const Route = createFileRoute("/account/notifications")({
  head: accountHead("Notifications", "Updates on orders, delivery and announcements."),
  component: AccountNotificationsPage,
});

function AccountNotificationsPage() {
  return (
    <AccountPage
      title="Notifications & Offers"
      intro="Your personal alerts, status changes and promotional updates."
    >
      <div className="surface rounded-2xl border p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-gold/40 bg-gold/10 text-gold">
          <Bell className="h-6 w-6" />
        </span>

        <h2 className="mt-4 text-base font-bold">Personal Notifications</h2>
        <div className="mt-2 inline-block">
          <PlannedBadge label="Customer inbox planned" />
        </div>

        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground leading-relaxed">
          Customer-scoped alert storage is currently planned. Important updates regarding product
          inquiries and delivery are communicated directly via verified WhatsApp channels.
        </p>

        <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground/80">
          Technical note: Personal notifications require a customer-scoped notification schema with
          user-level row security, awaiting owner approval.
        </p>
      </div>
    </AccountPage>
  );
}
