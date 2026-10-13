import { useEffect, useState } from "react";
import {
  createFileRoute,
  Link,
  notFound,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getWorkspace, type WorkspaceKey } from "@/lib/workspaces";
import { PlannedBadge } from "@/components/states";

type AccessState =
  | { status: "checking" }
  | { status: "signed-out" }
  | { status: "error" }
  | { status: "denied"; roles: WorkspaceKey[] }
  | {
      status: "allowed";
      roles: WorkspaceKey[];
      name: string;
      accountCode: string | null;
    };

const ROLE_LABELS: Record<WorkspaceKey, string> = {
  customer: "Customer",
  partner: "Business Partner",
  delivery: "Delivery",
  commission: "Commission",
  admin: "Admin",
  ceo: "CEO",
  finance: "Finance",
  security: "Security",
};

const ROLE_CODE_PREFIX: Record<WorkspaceKey, string> = {
  customer: "Cust",
  partner: "BP",
  delivery: "Del",
  commission: "Comm",
  admin: "Adm",
  ceo: "CEO",
  finance: "Fin",
  security: "Sec",
};

function roleDisplayCode(
  accountCode: string | null,
  role: WorkspaceKey,
): string | null {
  if (!accountCode) return null;

  const match = accountCode.match(
    /^NTM-(?:Cust|Customer|Adm|Admin|Comm|Del|BP|CEO|Fin|Finance|Sec|Security)-(.+)$/i,
  );

  return match
    ? `NTM-${ROLE_CODE_PREFIX[role]}-${match[1]}`
    : accountCode;
}

export const Route = createFileRoute("/workspace/$role")({
  loader: ({ params }) => {
    const workspace = getWorkspace(params.role);

    if (!workspace || workspace.key === "customer") {
      throw notFound();
    }

    return { key: workspace.key };
  },

  head: ({ loaderData }) => {
    const workspace = loaderData && getWorkspace(loaderData.key);

    if (!workspace) {
      return {
        meta: [
          { title: "Workspace not found — NEXA" },
          { name: "robots", content: "noindex" },
        ],
      };
    }

    return {
      meta: [
        { title: `${workspace.name} dashboard — NEXA` },
        { name: "robots", content: "noindex" },
        {
          name: "description",
          content: workspace.description,
        },
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
  const workspace = getWorkspace(Route.useLoaderData().key)!;

  const [access, setAccess] = useState<AccessState>({
    status: "checking",
  });

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      setAccess({ status: "checking" });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        setAccess({ status: "signed-out" });
        return;
      }

      const [rolesResult, profileResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id),

        supabase
          .from("profiles")
          .select("full_name, customer_code")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (!active) return;

      if (rolesResult.error || !rolesResult.data) {
        console.error(
          "Workspace role verification failed:",
          rolesResult.error,
        );
        setAccess({ status: "error" });
        return;
      }

      const assignedRoles = [
        ...new Set(rolesResult.data.map((row) => row.role)),
      ].filter((role): role is WorkspaceKey =>
        Object.prototype.hasOwnProperty.call(ROLE_LABELS, role),
      );

      if (!assignedRoles.includes(workspace.key)) {
        setAccess({
          status: "denied",
          roles: assignedRoles,
        });
        return;
      }

      if (profileResult.error) {
        console.error(
          "Workspace profile lookup failed:",
          profileResult.error,
        );
      }

      const profile = profileResult.data;

      setAccess({
        status: "allowed",
        roles: assignedRoles,
        name:
          profile?.full_name?.trim() ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "NEXA member",
        accountCode: profile?.customer_code ?? null,
      });
    }

    void verifyAccess();

    return () => {
      active = false;
    };
  }, [workspace.key]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-9">
      {access.status === "checking" && (
        <section className="surface rounded-2xl p-6" role="status">
          Verifying your account and approved workspace…
        </section>
      )}

      {access.status === "signed-out" && (
        <section className="surface rounded-2xl border border-gold/30 p-6">
          <h1 className="text-2xl font-bold">Sign in to continue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to the account approved for the {workspace.name} workspace.
          </p>
          <Link to="/sign-in" className="btn btn-primary mt-4">
            Sign in
          </Link>
        </section>
      )}

      {access.status === "error" && (
        <section className="surface rounded-2xl border border-red-500/30 p-6">
          <h1 className="text-xl font-bold">
            We couldn't verify your access
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your workspace has not been opened. Refresh and try again. If
            the problem continues, the role lookup or account permissions
            need investigation.
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            NEXA · Protected workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold">
            This account isn't approved for {workspace.name}
          </h1>

          {access.roles.length > 0 ? (
            <>
              <p className="mt-3 text-sm text-muted-foreground">
                Your assigned role{access.roles.length === 1 ? " is " : "s are "}
                <strong className="text-foreground">
                  {access.roles.map((role) => ROLE_LABELS[role]).join(", ")}
                </strong>
                . Signing in does not automatically approve another role.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {access.roles.map((role) =>
                  role === "customer" ? (
                    <Link
                      key={role}
                      to="/account"
                      className="btn btn-outline"
                    >
                      Open Customer
                    </Link>
                  ) : (
                    <a
                      key={role}
                      href={`/workspace/${role}`}
                      className="btn btn-outline"
                    >
                      Open {ROLE_LABELS[role]}
                    </a>
                  ),
                )}

                <Link
                  to="/account/applications"
                  className="btn btn-primary"
                >
                  Apply for an eligible role
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground">
                No approved workspace role was found for this account.
                Applying does not grant access; NEXA must review and approve
                the application first.
              </p>
              <Link
                to="/account/applications"
                className="btn btn-primary mt-4"
              >
                View role applications
              </Link>
            </>
          )}
        </section>
      )}

      {access.status === "allowed" && (
        <>
          <header className="overflow-hidden rounded-3xl border border-gold/40 bg-ink p-6 text-ink-foreground md:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              NEXA · {workspace.short} workspace
            </p>

            <h1 className="mt-3 text-3xl font-bold md:text-4xl">
              Welcome back, {ROLE_LABELS[workspace.key]} {access.name}
            </h1>

            <p className="mt-3 text-sm leading-6 text-ink-foreground/75">
              Hello, {access.name}. You are in your authorised{" "}
              {workspace.name} workspace. Your NEXA account and shared
              platform connection remain the same.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/15 px-4 py-3">
                <p className="text-xs text-ink-foreground/65">
                  Your {ROLE_LABELS[workspace.key]} ID
                </p>
                <p className="mt-1 font-semibold text-gold">
                  {roleDisplayCode(access.accountCode, workspace.key) ??
                    "Existing account ID not available"}
                </p>
              </div>

              <div className="rounded-xl border border-white/15 px-4 py-3">
                <p className="text-xs text-ink-foreground/65">
                  Verified workspace
                </p>
                <p className="mt-1 font-semibold">
                  {ROLE_LABELS[workspace.key]}
                </p>
              </div>
            </div>
          </header>

          {workspace.key === "admin" && (
            <section className="surface rounded-2xl border border-gold/30 p-5 md:p-7">
              <h2 className="text-xl font-bold">Administration operations</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage the live product catalogue from the authorised
                administration area.
              </p>
              <a href="/admin" className="btn btn-primary mt-4 inline-flex">
                Open Product Management
              </a>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-xl font-bold">
              Your {workspace.name} workspace
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Your workspace is connected to the same NEXA platform. Modules
              marked Coming soon are not yet operational.
            </p>

            {workspace.modules.length > 0 ? (
              <ul className="grid gap-3 md:grid-cols-2">
                {workspace.modules.map((module) => (
                  <li
                    key={module.name}
                    className="surface flex items-start justify-between gap-3 rounded-xl border p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{module.name}</p>
                      {module.note && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {module.note}
                        </p>
                      )}
                    </div>
                    <PlannedBadge label="Coming soon" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="surface rounded-xl border p-5">
                <p className="font-semibold">Workspace ready</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your authorised workspace is open.
                </p>
              </div>
            )}
          </section>

          <section className="surface rounded-2xl border p-5">
            <h2 className="font-bold">Switch workspace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Move to another workspace assigned to this same account without
              signing out.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {access.roles.map((role) =>
                role === workspace.key ? null : role === "customer" ? (
                  <Link
                    key={role}
                    to="/account"
                    className="btn btn-outline"
                  >
                    Open Customer
                  </Link>
                ) : (
                  <a
                    key={role}
                    href={`/workspace/${role}`}
                    className="btn btn-outline"
                  >
                    Open {ROLE_LABELS[role]}
                  </a>
                ),
              )}

              <a href="/shop" className="btn btn-outline">
                Browse marketplace
              </a>
            </div>
          </section>
        </>
      )}
    </main>
  );
                 }
