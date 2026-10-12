
import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";
import { supabase } from "@/integrations/supabase/client";
import { WORKSPACES } from "@/lib/workspaces";

type ApplyableRole = "partner" | "delivery" | "commission";
type ApplicationStatus = "pending" | "approved" | "rejected";

type RoleApplication = {
  id: string;
  requested_role: ApplyableRole;
  application_message: string | null;
  status: ApplicationStatus;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

const APPLYABLE: ApplyableRole[] = ["partner", "delivery", "commission"];

const ROLE_LABELS: Record<ApplyableRole, string> = {
  partner: "Business Partner",
  delivery: "Delivery",
  commission: "Commission Partner",
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Not approved",
};

export const Route = createFileRoute("/account/applications")({
  head: accountHead(
    "Role applications",
    "Apply to become a NEXA business partner, delivery partner or commission partner.",
  ),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [applications, setApplications] = useState<RoleApplication[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<ApplyableRole | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setUserId(null);
      setRoles([]);
      setApplications([]);
      setLoading(false);
      return;
    }

    const currentUserId = authData.user.id;
    setUserId(currentUserId);

    const [rolesResult, applicationsResult] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUserId),
      supabase
        .from("role_applications")
        .select(
          "id, requested_role, application_message, status, review_notes, created_at, reviewed_at",
        )
        .eq("applicant_id", currentUserId)
        .order("created_at", { ascending: false }),
    ]);

    if (rolesResult.error || applicationsResult.error) {
      console.error("Role application loading failed:", {
        rolesError: rolesResult.error,
        applicationsError: applicationsResult.error,
      });
      setError(
        "We couldn't load your role information. Please try again. If this continues, contact NEXA support.",
      );
      setLoading(false);
      return;
    }

    setRoles([...new Set((rolesResult.data ?? []).map((item) => item.role))]);
    setApplications((applicationsResult.data ?? []) as RoleApplication[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  async function applyForRole(role: ApplyableRole) {
    setError("");
    setNotice("");

    if (!userId) {
      setError("Please sign in to apply for a NEXA role.");
      return;
    }

    // Existing approved access must never be mistaken for a new application.
    if (roles.includes(role)) {
      setNotice(`Your account already has the ${ROLE_LABELS[role]} role.`);
      return;
    }

    // Never submit a second application for a role that is still pending.
    const pending = applications.find(
      (application) =>
        application.requested_role === role &&
        application.status === "pending",
    );

    if (pending) {
      setNotice(`Your ${ROLE_LABELS[role]} application is already awaiting review.`);
      return;
    }

    setSubmitting(role);

    const { error: insertError } = await supabase
      .from("role_applications")
      .insert({
        applicant_id: userId,
        requested_role: role,
        application_message: message.trim() || null,
        status: "pending",
      });

    if (insertError) {
      console.error("Role application submission failed:", insertError);

      if (insertError.code === "23505") {
        setError(
          "An application for this role already exists. Refresh your application list to see its status.",
        );
      } else if (insertError.code === "42501") {
        setError(
          "Your account isn't permitted to submit this application. Make sure you're signed in with a customer account.",
        );
      } else {
        setError(
          "Your application could not be submitted. Please try again. If this continues, contact NEXA support.",
        );
      }

      setSubmitting(null);
      return;
    }

    setMessage("");
    setNotice(`Your ${ROLE_LABELS[role]} application was submitted for review. Access is not granted until approval.`);
    setSubmitting(null);
    await loadApplications();
  }

  const latestForRole = (role: ApplyableRole) =>
    applications.find((application) => application.requested_role === role);

  return (
    <AccountPage
      title="Role applications"
      intro="Apply for an eligible NEXA role. Every application is reviewed, and applying does not grant access."
    >
      {!userId && !loading && (
        <section className="surface rounded-xl border border-gold/30 p-5">
          <h2 className="font-semibold">Sign in to apply</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You need to sign in before submitting or viewing your applications.
          </p>
          <Link to="/sign-in" className="btn btn-primary mt-4">
            Sign in
          </Link>
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 p-3 text-sm"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-gold/40 p-3 text-sm"
        >
          {notice}
        </div>
      )}

      {userId && (
        <section className="surface space-y-3 rounded-xl p-4">
          <label htmlFor="application-message" className="font-semibold">
            Message to the NEXA review team (optional)
          </label>
          <p className="text-sm text-muted-foreground">
            Briefly explain your experience or why you want this role.
          </p>
          <textarea
            id="application-message"
            className="field min-h-24 w-full"
            maxLength={1000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write your application message..."
            disabled={loading || submitting !== null}
          />
          <p className="text-right text-xs text-muted-foreground">
            {message.length}/1000
          </p>
        </section>
      )}

      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading your account roles and applications...
        </p>
      )}

      {WORKSPACES.filter((workspace) =>
        APPLYABLE.includes(workspace.key as ApplyableRole),
      ).map((workspace) => {
        const role = workspace.key as ApplyableRole;
        const assigned = roles.includes(role);
        const application = latestForRole(role);
        const pending = application?.status === "pending";
        const approved = application?.status === "approved";
        const rejected = application?.status === "rejected";

        return (
          <section
            key={role}
            className="surface flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{workspace.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {workspace.description}
              </p>

              {assigned && (
                <p className="mt-3 text-sm font-semibold text-gold">
                  Your account already has this role.
                </p>
              )}

              {!assigned && pending && (
                <p className="mt-3 text-sm">
                  <strong>Awaiting review.</strong> Your application was
                  submitted on{" "}
                  {new Date(application.created_at).toLocaleDateString()}.
                </p>
              )}

              {!assigned && approved && (
                <p className="mt-3 text-sm">
                  Your application was marked approved. If the role is not
                  appearing in your account, contact NEXA support so the
                  assigned role can be checked.
                </p>
              )}

              {!assigned && rejected && (
                <div className="mt-3 text-sm">
                  <p>
                    Your previous application was not approved. You may submit
                    a new application if you wish.
                  </p>
                  {application.review_notes && (
                    <p className="mt-1 text-muted-foreground">
                      Review note: {application.review_notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              {assigned ? (
                <Link
                  to="/workspace/$role"
                  params={{ role }}
                  className="btn btn-primary"
                >
                  Open workspace
                </Link>
              ) : pending ? (
                <span className="rounded-full border border-gold/40 px-3 py-2 text-sm">
                  Awaiting review
                </span>
              ) : approved ? (
                <span className="rounded-full border border-gold/40 px-3 py-2 text-sm">
                  Approved — role check needed
                </span>
              ) : userId ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={loading || submitting !== null}
                  onClick={() => void applyForRole(role)}
                >
                  {submitting === role
                    ? "Submitting..."
                    : rejected
                      ? "Apply again"
                      : "Apply"}
                </button>
              ) : (
                <Link to="/sign-in" className="btn btn-outline">
                  Sign in to apply
                </Link>
              )}

              {application && (
                <span className="text-xs text-muted-foreground">
                  Latest status: {STATUS_LABELS[application.status]}
                </span>
              )}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-muted-foreground">
        Administration, CEO, Finance and Security roles are assigned by NEXA
        leadership and cannot be requested through this form. An approved
        application is not, by itself, a login permission: your assigned role
        must also be present in the access-control records.
      </p>

      <button
        type="button"
        className="btn btn-outline"
        onClick={() => void loadApplications()}
        disabled={loading || submitting !== null}
      >
        Refresh application status
      </button>
    </AccountPage>
  );
}
