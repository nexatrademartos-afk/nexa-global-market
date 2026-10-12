import type { ReactNode } from "react";

export function AuthForm({ title, cta, footer, note, withName }: { title: string; cta: string; footer: ReactNode; note?: string; withName?: boolean }) {
  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p role="status" className="mt-3 rounded-lg border border-dashed border-gold/60 bg-gold-soft px-3 py-2 text-xs text-accent-foreground">
        Sign-in is not connected yet. It will be enabled once NEXA's secure backend is connected and approved.
      </p>
      <form className="mt-5 space-y-3" onSubmit={(e) => e.preventDefault()}>
        {withName && <label className="block text-sm font-medium">Full name<input disabled className="field mt-1" autoComplete="name" /></label>}
        <label className="block text-sm font-medium">Email<input disabled type="email" className="field mt-1" autoComplete="email" /></label>
        <label className="block text-sm font-medium">Password<input disabled type="password" className="field mt-1" /></label>
        <button disabled className="btn btn-primary w-full">{cta}</button>
      </form>
      {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
      <p className="mt-6 text-sm">{footer}</p>
    </div>
  );
}
