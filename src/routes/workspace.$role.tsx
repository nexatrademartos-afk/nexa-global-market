import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getWorkspace } from "@/lib/workspaces";
import { PlannedBadge } from "@/components/states";

type AccessState =
  | { status: "checking" }
  | { status: "signed-out" }
  | { status: "error" }
  | { status: "denied"; roles: string[] }
  | { status: "allowed"; roles: string[] };

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  partner: "Business Partner",
  delivery: "Delivery",
  commission: "Commission Partner",
  admin: "Administration",
  ceo: "CEO",
  finance: "Finance",
  security: "Security",
};

export const Route = createFileRoute("/workspace/$role")({
  loader: ({ params }) => {
    const ws = getWorkspace(params.role);
    if (!ws || ws.key === "customer") throw notFound();
    return { key: ws.key };
  },
  head: ({ loaderData }) => {
    const ws = loaderData && getWorkspace(loaderData.key);
    if (!ws) {
      return {
        meta: [
          { title: "Workspace not found — NEXA" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: `${ws.name} workspace — NEXA` },
        { name: "robots", content: "noindex" },
        { name: "description", content: ws.description },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Workspace not found</h1>
      <Link to="/account" className="btn btn-primary mt-4">
        Go to my account
      </Link>
    </div>
  ),
  component: WorkspacePage,
});

function WorkspacePage() {
  const ws = getWorkspace(Route.useLoaderData().key)!;
  const [access, setAccess] = useState<AccessState>({ status: "checking" });

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      setAccess({ status: "checking" });

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (userError || !userData.user) {
        setAccess({ status: "signed-out" });
        return;
      }

      const { data: roleRows, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);

      if (!active) return;

      if (roleError || !roleRows) {
        console.error("Workspace role verification failed:", roleError);
        setAccess({ status: "error" });
        return;
      }

      const assignedRoles = [...new Set(roleRows.map((row) => row.role))];

      if (assignedRoles.includes(ws.key)) {
        setAccess({ status: "allowed", roles: assignedRoles });
      } else {
        setAccess({ status: "denied", roles: assignedRoles });
      }
    }

    void verifyAccess();

    return () => {
      active = false;
    };
  }, [ws.key]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="rounded-2xl bg-ink p-6 text-ink-foreground">
        <p className="text-xs uppercase tracking-widest text-gold">
          Workspace · {ws.short}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{ws.name}</h1>
        <p className="mt-1 text-sm opacity-70">{ws.description}</p>
      </header>

      {access.status === "checking" && (
        <section className="surface rounded-2xl p-6" role="status">
          Verifying your signed-in account and approved role...
        </section>
      )}

      {access.status === "signed-out" && (
        <section className="surface rounded-2xl border border-gold/30 p-6">
          <h2 className="text-xl font-bold">Sign in to continue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with the account that was approved for the {ws.name} workspace.
          </p>
          <Link to="/sign-in" className="btn btn-primary mt-4">
            Sign in
          </Link>
        </section>
      )}

      {access.status === "error" && (
        <section className="surface rounded-2xl border border-red-500/30 p-6">
          <h2 className="text-xl font-bold">We couldn't verify your access</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your workspace has not been opened. Please refresh and try again.
            If the problem continues, the role lookup or account permissions need investigation.
          </p>
          <button
            type="button"
            className="btn btn-outline mt-4"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </section>
      )}

      {access.status === "denied" && (
        <section className="surface rounded-2xl border border-gold/30 p-6 md:p-8">
          <h2 className="text-xl font-bold">This account isn't approved for {ws.name}</h2>

          {access.roles.length > 0 ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Your account's assigned role{access.roles.length === 1 ? " is" : "s are"}:{" "}
                <strong className="text-foreground">
                  {access.roles.map((role) => ROLE_LABELS[role] ?? role).join(", ")}
                </strong>
                . Signing in does not grant access to a different workspace.
              </p>
              <p className="mt-3 text-sm">
                Select the workspace matching your approved role, or submit an application for another eligible role.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {access.roles
                  .filter((role) => role !== "customer")
                  .map((role) => (
                    <a key={role} href={`/workspace/${role}`} className="btn btn-outline">
                      Open {ROLE_LABELS[role] ?? role}
                    </a>
                  ))}
                <Link to="/account/applications" className="btn btn-primary">
                  Apply for a role
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                This account has no approved role for this workspace. Applying does not grant access; NEXA must review the application first.
              </p>
              <Link to="/account/applications" className="btn btn-primary mt-4">
                Apply for a role
              </Link>
            </>
          )}
        </section>
      )}

      {access.status === "allowed" && (
        <>
          <section className="surface rounded-2xl border border-gold/30 p-6">
            <p className="font-semibold text-gold">Role verified</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in with an account approved for {ws.name}.
            </p>

            {ws.key === "admin" && (
              <a href="/admin" className="btn btn-primary mt-4">
                Open Product Management
              </a>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Modules in this workspace</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {ws.modules.map((module) => (
                <li
                  key={module.name}
                  className="surface flex items-start justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{module.name}</p>
                    {module.note && (
                      <p className="text-sm text-muted-foreground">{module.note}</p>
                    )}
                  </div>
                  <PlannedBadge label="Coming soon" />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
