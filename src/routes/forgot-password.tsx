import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — NEXA Trade Mart" },
      {
        name: "description",
        content: "Request a secure password reset for your NEXA account.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo,
        });

      if (resetError) throw resetError;

      setMessage(
        "If an account exists for that email, a password reset link has been requested. Check your inbox and spam folder."
      );
    } catch {
      setError(
        "We couldn't request the reset email right now. Check your connection and try again. If the problem continues, check the Supabase redirect URL settings."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-[60vh] max-w-md px-4 py-10">
      <section className="surface rounded-2xl border border-gold/40 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          NEXA · Account recovery
        </p>

        <h1 className="mt-3 text-3xl font-bold">Forgot your password?</h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Enter the email address linked to your NEXA account. We'll request a
          secure reset link if an account can receive one.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email address
            <input
              type="email"
              className="field mt-1"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
            <p role="status" className="rounded-lg border border-gold/30 p-3 text-sm leading-6">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? "Requesting reset..." : "Send password reset email"}
          </button>
        </form>

        <p className="mt-6 text-sm">
          Remembered it?{" "}
          <Link to="/sign-in" className="font-semibold underline">
            Return to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
