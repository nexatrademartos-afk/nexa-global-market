
import { useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AuthForm({
  title,
  cta,
  footer,
  note,
  withName,
}: {
  title: string;
  cta: string;
  footer: ReactNode;
  note?: string;
  withName?: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (withName && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (withName && password !== confirmPassword) {
      setError("Your passwords do not match. Please check both fields.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    setLoading(true);
    setMessage(
      withName
        ? "Creating your account. Please keep this page open..."
        : "Signing you in. Please keep this page open..."
    );

    try {
      if (withName) {
        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
            },
          });

        if (signUpError) throw signUpError;

        if (data.session) {
          window.location.assign("/account");
          return;
        }

        setConfirmationEmail(normalizedEmail);
        setConfirmationRequired(true);
        setMessage("");
        return;
      }

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (signInError) throw signInError;

      window.location.assign("/account");
    } catch (err) {
      setMessage("");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!confirmationEmail || resending) return;

    setError("");
    setMessage("");
    setResending(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: confirmationEmail,
      });

      if (resendError) throw resendError;

      setMessage(
        "If this account can receive a confirmation email, a new confirmation message has been requested. Please check your inbox and spam folder."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't request another email. Please try again."
      );
    } finally {
      setResending(false);
    }
  }

  if (confirmationRequired) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border p-6 shadow-sm">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-2xl"
            aria-hidden="true"
          >
            ✉
          </div>

          <h1 className="text-2xl font-bold">
            Check your email to confirm your account
          </h1>

          <p className="mt-3 text-sm leading-6">
            Your registration request has been submitted. We have requested
            email confirmation for:
          </p>

          <p className="mt-2 break-all font-semibold">
            {confirmationEmail}
          </p>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6">
            <li>Open your email inbox.</li>
            <li>Find the confirmation email from NEXA or Supabase.</li>
            <li>Open it and tap the confirmation link.</li>
            <li>Return to NEXA and sign in using your email and password.</li>
          </ol>

          <p className="mt-4 text-sm text-muted-foreground">
            If you don't see the email, check your spam or junk folder.
            Email delivery can take a few minutes.
          </p>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="mt-4 text-sm">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resending}
            className="btn btn-primary mt-5 w-full"
          >
            {resending ? "Requesting email..." : "Resend confirmation email"}
          </button>

          <p className="mt-5 text-sm">{footer}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-3xl font-bold">{title}</h1>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        {withName && (
          <label className="block text-sm font-medium">
            Full name
            <input
              type="text"
              className="field mt-1"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              disabled={loading}
            />
          </label>
        )}

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

        <div>
          <label
            htmlFor="nexa-password"
            className="block text-sm font-medium"
          >
            {withName ? "Create password" : "Password"}
          </label>

          <div className="mt-1 flex items-center gap-2">
            <input
              id="nexa-password"
              type={showPassword ? "text" : "password"}
              className="field min-w-0 flex-1"
              autoComplete={withName ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="min-h-11 shrink-0 rounded-lg border px-3 text-sm"
              disabled={loading}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {withName && (
            <p className="mt-1 text-xs text-muted-foreground">
              Use at least 8 characters.
            </p>
          )}
        </div>

        {withName && (
          <div>
            <label
              htmlFor="nexa-confirm-password"
              className="block text-sm font-medium"
            >
              Confirm password
            </label>

            <div className="mt-1 flex items-center gap-2">
              <input
                id="nexa-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className="field min-w-0 flex-1"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
                disabled={loading}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((current) => !current)
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
                aria-pressed={showConfirmPassword}
                className="min-h-11 shrink-0 rounded-lg border px-3 text-sm"
                disabled={loading}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p role="status" aria-live="polite" className="text-sm">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "Please wait..." : cta}
        </button>
      </form>

      {note && (
        <p className="mt-3 text-xs text-muted-foreground">{note}</p>
      )}

      <p className="mt-6 text-sm">{footer}</p>
    </div>
  );
}
