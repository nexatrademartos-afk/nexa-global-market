import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — NEXA Trade Mart" },
      {
        name: "description",
        content: "Set a new password for your NEXA account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" || session?.user) {
        setReady(true);
      }

      if (!session?.user) {
        setReady(false);
      }

      setChecking(false);
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;

      if (sessionError) {
        setError("We couldn't verify your reset session. Request a new link.");
      }

      if (data.session?.user) {
        setReady(true);
      }

      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match. Please check both fields.");
      return;
    }

    if (!ready) {
      setError("Your reset session is not active. Request a fresh reset email.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setMessage("Your password has been updated. Signing you out securely...");

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        window.location.assign("/sign-in");
        return;
      }

      window.location.assign("/sign-in");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't update your password. Request a fresh reset link and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-[60vh] max-w-md px-4 py-10">
      <section className="surface rounded-2xl border border-gold/40 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          NEXA · Secure account recovery
        </p>

        <h1 className="mt-3 text-3xl font-bold">Set a new password</h1>

        {checking ? (
          <p role="status" className="mt-4 text-sm">
            Verifying your secure reset link...
          </p>
        ) : !ready ? (
          <>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              This reset session is missing or has expired. Request a new reset
              link and open the latest email on this device.
            </p>
            <Link
              to="/forgot-password"
              className="btn btn-primary mt-5 block w-full text-center"
            >
              Request a new reset link
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Choose a new password for your account. Use at least 8 characters.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                New password
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="field min-w-0 flex-1"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="min-h-11 shrink-0 rounded-lg border px-3 text-sm"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="block text-sm font-medium">
                Confirm new password
                <input
                  type={showPassword ? "text" : "password"}
                  className="field mt-1"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  disabled={loading}
                />
              </label>

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              {message && (
                <p role="status" className="rounded-lg border border-gold/30 p-3 text-sm">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? "Updating password..." : "Save new password"}
              </button>
            </form>
          </>
        )}

        {error && !ready && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="mt-6 text-sm">
          <Link to="/sign-in" className="font-semibold underline">
            Return to sign in
          </Link>
        </p>
      </section>
    </main>
  );
    }
