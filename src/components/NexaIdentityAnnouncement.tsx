import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AnnouncementResult = {
  show_banner: boolean;
  new_identity_code: string | null;
  display_number: number;
  displays_remaining: number;
};

function getLoginEventId(): string {
  const storageKey = "nexa_login_event_id";

  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;

    const eventId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, eventId);
    return eventId;
  } catch {
    return crypto.randomUUID();
  }
}

export function startNexaLoginEvent(): void {
  try {
    sessionStorage.setItem("nexa_login_event_id", crypto.randomUUID());
  } catch {
    // The dashboard will create an event ID if session storage is unavailable.
  }
}

export function NexaIdentityAnnouncement() {
  const [loading, setLoading] = useState(true);
  const [newIdentityCode, setNewIdentityCode] = useState("");
  const [showBanner, setShowBanner] = useState(false);
  const [displayNumber, setDisplayNumber] = useState(0);
  const [displaysRemaining, setDisplaysRemaining] = useState(0);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAnnouncement() {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;
        if (!userData.user) {
          if (active) setLoading(false);
          return;
        }

        const rpc = supabase.rpc.bind(supabase) as unknown as (
          functionName: string,
          args: { p_login_event_id: string }
        ) => Promise<{
          data: AnnouncementResult[] | null;
          error: { message: string } | null;
        }>;

        const { data, error: rpcError } = await rpc(
          "record_nexa_identity_announcement_login",
          { p_login_event_id: getLoginEventId() }
        );

        if (rpcError) throw rpcError;

        const announcement = data?.[0];

        if (active && announcement?.new_identity_code) {
          setNewIdentityCode(announcement.new_identity_code);
          setShowBanner(announcement.show_banner);
          setDisplayNumber(announcement.display_number);
          setDisplaysRemaining(announcement.displays_remaining);

          // Show the notice automatically when this is one of the
          // first three recorded displays.
          setNoticeOpen(announcement.show_banner);
        }
      } catch {
        if (active) {
          setError(
            "Your NEXA ID is still available in your dashboard. We couldn't load the ID-change notice right now."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAnnouncement();

    return () => {
      active = false;
    };
  }, []);

  if (loading || !newIdentityCode) {
    return error ? (
      <p role="status" className="text-sm text-muted-foreground">
        {error}
      </p>
    ) : null;
  }

  return (
    <section
      aria-labelledby="nexa-identity-notice-heading"
      className="space-y-3"
    >
      {showBanner && (
        <div
          role="status"
          className="rounded-2xl border border-gold/60 bg-gold-soft p-4 md:p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-widest">
            Important account update
          </p>

          <h2
            id="nexa-identity-notice-heading"
            className="mt-2 text-lg font-bold"
          >
            Your permanent NEXA ID is here
          </h2>

          <p className="mt-2 text-sm leading-6">
            Your customer ID has been updated to your permanent NEXA identity.
            Your account, orders, referrals and rewards remain linked to the
            same account.
          </p>

          <p className="mt-3 font-mono text-xl font-bold">
            {newIdentityCode}
          </p>

          <p className="mt-2 text-sm">
            Keep this ID for support and future NEXA services. It is an
            identification number, not your password or a payment credential.
          </p>

          <p className="mt-3 text-xs text-muted-foreground">
            Notice {displayNumber} of 3 for this account.
          </p>

          <button
            type="button"
            onClick={() => setNoticeOpen(false)}
            className="mt-3 rounded-lg border px-4 py-2 text-sm font-semibold"
          >
            Dismiss for now
          </button>
        </div>
      )}

      {!noticeOpen && (
        <button
          type="button"
          onClick={() => setNoticeOpen(true)}
          className="rounded-lg border border-gold/60 px-4 py-2 text-sm font-semibold hover:bg-gold-soft"
        >
          Read your NEXA ID update
          {displaysRemaining > 0
            ? ` (${displaysRemaining} notice ${
                displaysRemaining === 1 ? "display" : "displays"
              } remaining)`
            : ""}
        </button>
      )}

      {noticeOpen && !showBanner && (
        <div className="rounded-2xl border border-gold/50 bg-gold-soft p-4">
          <h2 className="font-bold">Your permanent NEXA identity</h2>
          <p className="mt-2 text-sm leading-6">
            Your customer ID has changed to {newIdentityCode}. Your account,
            orders, referrals and rewards remain linked to the same account.
            Use this ID for NEXA support and identification. It is not your
            password or a payment credential.
          </p>
          <button
            type="button"
            onClick={() => setNoticeOpen(false)}
            className="mt-3 rounded-lg border px-4 py-2 text-sm font-semibold"
          >
            Close notice
          </button>
        </div>
      )}

      {error && (
        <p role="status" className="text-sm text-muted-foreground">
          {error}
        </p>
      )}
    </section>
  );
}
