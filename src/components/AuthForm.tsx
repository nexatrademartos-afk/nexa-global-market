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
      const normalizedEmail = email.trim().toLowerCase();

      if (withName) {
        if (!fullName.trim()) {
          setError("Please enter your full name.");
          return;
        }

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

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          window.location.assign("/account");
          return;
        }

        setMessage(
          "Registration submitted. Please check your email to confirm your account before signing in, if email confirmation is enabled."
        );

        return;
      }

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (signInError) {
        throw signInError;
      }

      window.location.assign("/account");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-3xl font-bold">{title}</h1>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
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
          Email
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

        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            className="field mt-1"
            autoComplete={withName ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            disabled={loading}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="text-sm">
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
        <p className="mt-3 text-xs text-muted-foreground">
          {note}
        </p>
      )}

      <p className="mt-6 text-sm">{footer}</p>
    </div>
  );
            }
