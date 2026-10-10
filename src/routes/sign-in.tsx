import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [
    { title: "Sign in — NEXA Trade Mart" }, { name: "description", content: "Sign in to your NEXA account." },
    { property: "og:title", content: "Sign in — NEXA" }, { property: "og:description", content: "Access your NEXA account." },
  ] }),
  component: () => (
    <AuthForm title="Sign in" cta="Sign in" footer={<>New to NEXA? <Link to="/sign-up" className="font-semibold underline">Create an account</Link></>} />
  ),
});
