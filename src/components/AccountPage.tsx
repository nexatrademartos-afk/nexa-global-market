import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function AccountPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {intro && <p className="text-sm text-muted-foreground">{intro}</p>}
      </div>
      <SignedOutBanner />
      {children}
    </div>
  );
}

export function SignedOutBanner() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-gold/60 bg-gold-soft px-3 py-2 text-xs text-accent-foreground">
      <span>You're viewing the account layout. Sign-in isn't connected yet, so no personal data is shown.</span>
      <Link to="/sign-in" className="font-semibold underline">Sign in</Link>
    </div>
  );
}

export const accountHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — NEXA Account` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — NEXA Trade Mart` },
    { property: "og:description", content: description },
  ],
});
