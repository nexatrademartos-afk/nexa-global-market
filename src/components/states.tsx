import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function PlannedBadge({ label = "Planned" }: { label?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-gold/50 bg-gold-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
      {label}
    </span>
  );
}

export function PreviewNotice({ children }: { children?: ReactNode }) {
  return (
    <p role="note" className="rounded-lg border border-dashed border-gold/60 bg-gold-soft px-3 py-2 text-xs text-accent-foreground">
      {children ?? "Preview data — sample items for layout only. Not real products, prices or stock."}
    </p>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="h-10 w-10 rounded-full border-2 border-gold" aria-hidden />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

export function NotConnected({ what }: { what: string }) {
  return (
    <EmptyState
      title="Not connected yet"
      body={`${what} will appear here once NEXA's secure backend is connected and approved. Nothing is shown until real records exist.`}
    />
  );
}

export function PermissionDenied({ role }: { role: string }) {
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-12 text-center">
      <h3 className="text-lg font-semibold">Access requires approval</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        The {role} workspace is only available to approved accounts. Submitting an application does not grant access.
      </p>
      <Link to="/account/applications" className="btn btn-primary">View role applications</Link>
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
