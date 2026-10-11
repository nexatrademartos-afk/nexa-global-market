
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ACCOUNT_NAV } from "./account";

type CustomerProfile = {
  full_name: string | null;
  customer_code: string | null;
};

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Customer Dashboard — NEXA Trade Mart" },
      {
        name: "description",
        content: "Your personal NEXA customer dashboard.",
      },
    ],
  }),
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCustomer() {
      setLoading(true);
      setError("");

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;

        const user = userData.user;

        if (!user) {
          if (active) {
            setSignedIn(false);
            setLoading(false);
          }
          return;
        }

        const metadataName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : "";

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, customer_code")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!active) return;

        setSignedIn(true);
        setEmail(user.email ?? "");
        setFullName(profile?.full_name?.trim() || metadataName.trim());
        setCustomerCode(profile?.customer_code?.trim() || "");
      } catch {
        if (active) {
          setError(
            "We couldn't load your account details. Please refresh the page and try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCustomer();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadCustomer();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const firstName = fullName.trim().split(/\s+/)[0] || "there";

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p role="status" className="text-sm text-muted-foreground">
          Loading your NEXA dashboard...
        </p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="surface p-6 md:p-8">
          <h1 className="text-2xl font-bold">Your NEXA account</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Please sign in to view your customer dashboard, profile and NEXA ID.
          </p>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
          <Link to="/sign-in" className="btn btn-primary mt-5 inline-flex">
            Sign in to your account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section className="surface p-5 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          NEXA Customer Dashboard
        </p>

        <h1 className="mt-3 text-2xl font-bold md:text-3xl">
          Welcome back, {firstName}!
        </h1>

        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          What would you like to order today?
        </p>

        {email && (
          <p className="mt-3 break-all text-sm">
            Signed in as <span className="font-medium">{email}</span>
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-gold/50 bg-gold-soft p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your customer identification
        </p>

        <h2 className="mt-2 text-xl font-bold">Your NEXA ID</h2>

        {customerCode ? (
          <>
            <p className="mt-3 break-all font-mono text-2xl font-bold tracking-wide">
              {customerCode}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep this ID for customer support and account enquiries.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm">
            Your customer ID is not available yet. Please contact NEXA support
            if it continues to be missing.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Your account</h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {ACCOUNT_NAV.slice(1).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="surface flex min-h-20 items-end p-4 font-semibold hover:border-gold"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
