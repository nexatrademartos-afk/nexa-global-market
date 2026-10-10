import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { WORKSPACES } from "@/lib/workspaces";

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Switch workspace"
        className="grid h-11 w-11 place-items-center rounded-full border"
      >
        <LayoutGrid className="h-5 w-5" />
      </button>
      {open && (
        <div className="surface absolute right-0 z-50 mt-2 w-72 p-2">
          <p className="px-2 pb-2 pt-1 text-[11px] text-muted-foreground">
            Workspaces · preview navigation. Access will be role-gated once sign-in is connected.
          </p>
          <ul>
            {WORKSPACES.map((w) => (
              <li key={w.key}>
                <Link
                  to={w.key === "customer" ? "/account" : "/workspace/$role"}
                  params={w.key === "customer" ? undefined : { role: w.key }}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-secondary"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink text-[11px] font-bold text-gold">{w.short}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{w.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{w.access}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
