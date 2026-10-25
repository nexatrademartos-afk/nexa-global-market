import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { NEXA_QUICK_MESSAGE, openWhatsApp } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { FileText, HelpCircle, RotateCcw } from "lucide-react";
import { PlannedBadge } from "@/components/states";

export const Route = createFileRoute("/account/returns")({
  head: accountHead("Help & Support", "Customer support and returns assistance."),
  component: HelpAndReturnsPage,
});

function HelpAndReturnsPage() {
  function handleContactWhatsApp() {
    openWhatsApp(NEXA_QUICK_MESSAGE);
  }

  return (
    <AccountPage
      title="Help, Support & Returns"
      intro="Get assistance with your orders, products, and returns."
    >
      <div className="space-y-4">
        {/* Direct WhatsApp Support */}
        <div className="surface rounded-2xl border border-gold/40 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Contact Customer Support</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Need immediate help with a product enquiry, delivery, or account question? Contact
                our support team directly on WhatsApp.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleContactWhatsApp}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1DA851]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Chat on WhatsApp
            </button>

            <Link to="/support" className="btn border inline-flex items-center gap-2 text-sm">
              <HelpCircle className="h-4 w-4" /> Support Centre
            </Link>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            WhatsApp enquiries connect you directly with a representative. Opening WhatsApp is a
            direct enquiry channel, not an automated support ticket.
          </p>
        </div>

        {/* Returns and Exchanges */}
        <div className="surface rounded-2xl border p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold/40 bg-gold/10 text-gold">
                <RotateCcw className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold">Returns & Exchanges</h3>
                <p className="text-xs text-muted-foreground">
                  Store return policy and instructions
                </p>
              </div>
            </div>
            <PlannedBadge label="Self-service portal planned" />
          </div>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>
              To request a return or report an issue with an item, please contact our team via
              WhatsApp. Please have your Customer ID and item details ready so we can assist you
              quickly.
            </p>
            <p className="text-xs text-muted-foreground/80">
              Technical requirement: An automated self-service return portal requires return ticket
              backend schema and status workflow approval.
            </p>
          </div>

          <div className="mt-4">
            <Link
              to="/policies"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
            >
              <FileText className="h-3.5 w-3.5" /> Read our Returns & Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </AccountPage>
  );
}
