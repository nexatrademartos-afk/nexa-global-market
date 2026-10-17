
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

export const Route = createFileRoute("/account/secure-access")({
  head: () => ({
    meta: [
      { title: "Secure Access — NEXA GLOBAL MART" },
      {
        name: "description",
        content: "Continue to an authorised NEXA workspace.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SecureAccessPage,
});

function SecureAccessPage() {
  const [step, setStep] = useState<"notice" | "workspace">("notice");

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <section className="surface rounded-2xl border border-gold/30 p-5 sm:p-8">
        {step === "notice" ? (
          <>
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-gold/40 bg-gold-soft">
              <TriangleAlert
                className="h-6 w-6 text-gold"
                aria-hidden="true"
              />
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              NEXA · Service notice
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              We couldn't find that service
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The item you searched for isn't available in the customer
              services directory. You can return to your dashboard or
              continue if you were looking for an authorised workspace.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/account"
                className="btn btn-outline inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to dashboard
              </Link>

              <button
                type="button"
                className="btn btn-primary inline-flex items-center justify-center gap-2"
                onClick={() => setStep("workspace")}
              >
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-gold/40 bg-gold-soft">
              <ShieldCheck
                className="h-6 w-6 text-gold"
                aria-hidden="true"
              />
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              NEXA · Protected access
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              Which authorised workspace are you trying to access?
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Select your workspace to continue to its existing access
              checks. Your account must already have the corresponding
              approved role. Selecting a workspace does not grant access.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href="/workspace/admin"
                className="group surface flex min-h-28 items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <span>
                  <span className="block font-semibold">Admin</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Administration workspace
                  </span>
                </span>
                <ArrowRight
                  className="h-5 w-5 shrink-0 text-gold transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>

              <a
                href="/workspace/ceo"
                className="group surface flex min-h-28 items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <span>
                  <span className="block font-semibold">CEO</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Executive workspace
                  </span>
                </span>
                <ArrowRight
                  className="h-5 w-5 shrink-0 text-gold transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
            </div>

            <button
              type="button"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-gold"
              onClick={() => setStep("notice")}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>

            <p className="mt-6 rounded-xl border border-border p-3 text-xs leading-5 text-muted-foreground">
              For your security, workspace access is determined by your
              authenticated account and approved permissions, not by this
              selection.
            </p>
          </>
        )}
      </section>
    </main>
  );
      }
