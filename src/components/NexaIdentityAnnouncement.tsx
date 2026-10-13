import { Sparkles } from "lucide-react";

/**
 * Records a successful NEXA login/signup event in the browser.
 * This is a lightweight local event and does not send data to a server.
 */
export function startNexaLoginEvent(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent("nexa:login-success", {
        detail: {
          brand: "NEXA GLOBAL MART",
          timestamp: new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    // Analytics must never interrupt a successful login.
    console.error("Could not dispatch the NEXA login event:", error);
  }
}

export function NexaIdentityAnnouncement() {
  return (
    <aside
      aria-label="NEXA GLOBAL MART announcement"
      className="relative overflow-hidden rounded-2xl border border-gold/50 bg-gold-soft p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold/40 bg-background/60">
          <Sparkles
            className="h-5 w-5 text-gold"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
            Our marketplace identity
          </p>

          <h2 className="mt-1 text-base font-bold sm:text-lg">
            Welcome to NEXA GLOBAL MART
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Shop more, save more, and get rewarded. We are building a
            connected marketplace experience for customers and sellers.
          </p>

          <p className="mt-3 text-xs font-semibold tracking-wide text-foreground">
            Powered by TJC-OS
          </p>
        </div>
      </div>
    </aside>
  );
}
