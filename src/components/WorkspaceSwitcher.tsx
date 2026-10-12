import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutGrid, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WORKSPACES, type WorkspaceKey } from "@/lib/workspaces";

type RoleState =
  | { status: "loading"; roles: WorkspaceKey[] }
  | { status: "signed-out"; roles: WorkspaceKey[] }
  | { status: "error"; roles: WorkspaceKey[] }
  | { status: "ready"; roles: WorkspaceKey[] };

const VALID_ROLES = new Set<string>(
  WORKSPACES.map((workspace) => workspace.key),
);

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [roleState, setRoleState] = useState<RoleState>({
    status: "loading",
    roles: [],
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function loadRoles() {
      const { data: userResult, error: userError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (userError || !userResult.user) {
        setRoleState({ status: "signed-out", roles: [] });
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userResult.user.id);

      if (!active) return;

      if (error || !data) {
        console.error("Could not load NEXA workspace roles:", error);
        setRoleState({ status: "error", roles: [] });
        return;
      }

      const roles = [...new Set(data.map((row) => row.role))].filter(
        (role): role is WorkspaceKey => VALID_ROLES.has(role),
      );

      setRoleState({ status: "ready", roles });
    }

    void loadRoles();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const allowedWorkspaces =
    roleState.status === "ready"
      ? WORKSPACES.filter((workspace) =>
          roleState.roles.includes(workspace.key),
        )
      : [];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="Switch NEXA workspace"
        className="grid h-11 w-11 place-items-center rounded-full border border-gold/30 transition hover:bg-gold-soft"
      >
        <LayoutGrid className="h-5 w-5" />
      </button>

      {open && (
        <div className="surface absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-gold/30 p-2 shadow-xl">
          <div className="border-b border-border px-3 pb-3 pt-2">
            <p className="text-sm font-bold">Your NEXA workspaces</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Switch areas without signing out. Access is based on your
              assigned roles.
            </p>
          </div>

          {roleState.status === "loading" && (
            <p className="p-3 text-sm text-muted-foreground" role="status">
              Checking your approved workspaces…
            </p>
          )}

          {roleState.status === "signed-out" && (
            <div className="p-3">
              <p className="text-sm">
                Sign in to see your available workspaces.
              </p>
              <Link
                to="/sign-in"
                onClick={() => setOpen(false)}
                className="btn btn-primary mt-3 inline-flex"
              >
                Sign in
              </Link>
            </div>
          )}

          {roleState.status === "error" && (
            <div className="flex gap-2 p-3 text-sm" role="alert">
              <ShieldAlert className="h-5 w-5 shrink-0 text-gold" />
              <span>
                We couldn't verify your roles. Refresh and try again. No
                workspace links are shown until access can be checked.
              </span>
            </div>
          )}

          {roleState.status === "ready" &&
            allowedWorkspaces.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                No assigned workspace was found for this account. Contact
                NEXA support if this seems wrong.
              </p>
            )}

          {roleState.status === "ready" &&
            allowedWorkspaces.length > 0 && (
              <ul className="grid gap-1 pt-2">
                {allowedWorkspaces.map((workspace) => (
                  <li key={workspace.key}>
                    {workspace.key === "customer" ? (
                      <Link
                        to="/account"
                        onClick={() => setOpen(false)}
                        className="flex min-h-12 items-center gap-3 rounded-lg px-2 hover:bg-secondary"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink text-[11px] font-bold text-gold">
                          {workspace.short}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            {workspace.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {workspace.description}
                          </span>
                        </span>
                      </Link>
                    ) : (
                      <a
                        href={`/workspace/${workspace.key}`}
                        onClick={() => setOpen(false)}
                        className="flex min-h-12 items-center gap-3 rounded-lg px-2 hover:bg-secondary"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink text-[11px] font-bold text-gold">
                          {workspace.short}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            {workspace.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {workspace.description}
                          </span>
                        </span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}

          <div className="mt-2 border-t border-border px-3 py-2">
            <a
              href="/shop"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold underline underline-offset-4"
            >
              Return to marketplace
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
