
import { createFileRoute } from "@tanstack/react-router";
import { POLICY_REGISTRY } from "@/lib/policies";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Policy Centre — NEXA GLOBAL MART" },
      {
        name: "description",
        content:
          "Review NEXA GLOBAL MART marketplace terms, privacy information and policies.",
      },
    ],
  }),
  component: PolicyCentre,
});

function PolicyCentre() {
  const policies = Object.values(POLICY_REGISTRY);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-gold">
          NEXA GLOBAL MART
        </p>

        <h1 className="text-3xl font-bold">Policy Centre</h1>

        <p className="leading-7 text-muted-foreground">
          These draft policies describe the intended marketplace rules.
          They require legal and business review before final publication.
          Details that have not yet been decided are identified in the
          relevant policy rather than guessed.
        </p>

        <p className="rounded-lg border p-3 text-sm">
          <strong>Draft status:</strong> Do not treat these documents as
          final legal terms. Some marketplace features are still in preview
          and are not active services.
        </p>
      </header>

      <nav
        aria-label="Policies"
        className="grid gap-3 sm:grid-cols-2"
      >
        {policies.map((policy) => (
          <a
            key={policy.id}
            href={`#${policy.id}`}
            className="rounded-xl border p-4 transition-colors hover:bg-muted/50"
          >
            <span className="font-semibold">{policy.title}</span>

            <span className="mt-1 block text-xs text-muted-foreground">
              Version {policy.version} · Draft / review required
            </span>

            <span className="mt-2 block text-sm text-muted-foreground">
              {policy.summary}
            </span>
          </a>
        ))}
      </nav>

      <div className="space-y-8">
        {policies.map((policy) => (
          <article
            id={policy.id}
            key={policy.id}
            className="scroll-mt-24 space-y-4 rounded-xl border p-5"
          >
            <header>
              <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                {policy.id.replaceAll("-", " ")} · Version{" "}
                {policy.version}
              </p>

              <h2 className="mt-1 text-xl font-bold">
                {policy.title}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {policy.summary}
              </p>
            </header>

            <p className="text-xs font-semibold text-amber-700">
              DRAFT — LEGAL/BUSINESS REVIEW REQUIRED
            </p>

            {policy.sections.map((section) => (
              <section
                key={section.heading}
                className="space-y-2"
              >
                <h3 className="font-semibold">
                  {section.heading}
                </h3>

                <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {section.body}
                </p>
              </section>
            ))}
          </article>
        ))}
      </div>

      <p className="border-t pt-4 text-sm text-muted-foreground">
        South African law is the intended starting point, subject to legal
        review and any mandatory laws applicable to the user or transaction.
        This draft is not legal advice.
      </p>
    </main>
  );
}
