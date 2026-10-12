import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getWorkspace } from "@/lib/workspaces";
import { PermissionDenied, PlannedBadge } from "@/components/states";

export const Route = createFileRoute("/workspace/$role")({
  loader: ({ params }) => {
    const ws = getWorkspace(params.role);
    if (!ws || ws.key === "customer") throw notFound();
    return { key: ws.key };
  },
  head: ({ loaderData }) => {
    const ws = loaderData && getWorkspace(loaderData.key);
    if (!ws) return { meta: [{ title: "Workspace not found — NEXA" }, { name: "robots", content: "noindex" }] };
    return { meta: [
      { title: `${ws.name} workspace — NEXA` }, { name: "robots", content: "noindex" },
      { name: "description", content: ws.description },
      { property: "og:title", content: `${ws.name} — NEXA Trade Mart` }, { property: "og:description", content: ws.description },
    ] };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-2xl font-bold">Workspace not found</h1>
      <Link to="/account" className="btn btn-primary mt-4">Go to my account</Link></div>
  ),
  component: WorkspacePage,
});

function WorkspacePage() {
  const ws = getWorkspace(Route.useLoaderData().key)!;
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="rounded-2xl bg-ink p-6 text-ink-foreground">
        <p className="text-xs uppercase tracking-widest text-gold">Workspace · {ws.short}</p>
        <h1 className="mt-1 text-3xl font-bold">{ws.name}</h1>
        <p className="mt-1 text-sm opacity-70">{ws.description}</p>
        <p className="mt-3 text-xs opacity-60">{ws.access}</p>
      </header>
      <PermissionDenied role={ws.name} />
      <section>
        <h2 className="mb-3 text-lg font-bold">Modules in this workspace</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {ws.modules.map((m) => (
            <li key={m.name} className="surface flex items-start justify-between gap-3 p-4">
              <div className="min-w-0"><p className="font-semibold">{m.name}</p>{m.note && <p className="text-sm text-muted-foreground">{m.note}</p>}</div>
              <PlannedBadge />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
