import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND, brandPageTitle } from "@/lib/brand";
import { PlannedBadge } from "@/components/states";

export const Route = createFileRoute("/sell")({
  head: () => ({ meta: [
    { title: `Sell on ${BRAND.shortName} — Business Partners` }, { name: "description", content: `Apply to sell your shop or brand on ${BRAND.name}.` },
    { property: "og:title", content: `Sell on ${BRAND.name}` }, { property: "og:description", content: `Shops, brands and businesses can apply to become ${BRAND.shortName} Business Partners.` },
  ] }),
  component: Sell,
});

function Sell() {
  const steps = [
    ["Apply", "Submit your business details for review."],
    ["Get approved", `${BRAND.shortName} verifies and approves business accounts.`],
    ["List products", "Each listing is reviewed before going live."],
    ["Choose fulfilment", `Own fulfilment, ${BRAND.shortName} pickup/delivery, ${BRAND.shortName} warehouse or an approved courier.`],
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold">Sell on {BRAND.shortName}</h1>
      <ol className="space-y-2">
        {steps.map(([t, b], i) => (
          <li key={t} className="surface flex gap-3 p-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-bold text-gold">{i + 1}</span>
            <div><p className="font-semibold">{t}</p><p className="text-sm text-muted-foreground">{b}</p></div>
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3"><Link to="/account/applications" className="btn btn-primary">Start application</Link><PlannedBadge label="Applications open soon" /></div>
    </div>
  );
}
