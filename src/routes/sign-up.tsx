import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/sign-up")({
  head: () => ({ meta: [
    { title: "Create account — NEXA Trade Mart" }, { name: "description", content: "Create a free NEXA customer account." },
    { property: "og:title", content: "Join NEXA" }, { property: "og:description", content: "Shop More. Save More. Get Rewarded." },
  ] }),
  component: () => (
    <AuthForm title="Create your account" cta="Create customer account" withName
      note="New accounts are customer accounts. Partner, delivery and commission roles require a separate approved application."
      footer={<>Already have an account? <Link to="/sign-in" className="font-semibold underline">Sign in</Link></>} />
  ),
});
