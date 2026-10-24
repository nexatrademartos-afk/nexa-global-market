import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND, brandPageTitle } from "@/lib/brand";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [
    { title: brandPageTitle("Sign in") }, { name: "description", content: `Sign in to your ${BRAND.shortName} account.` },
    { property: "og:title", content: brandPageTitle("Sign in") }, { property: "og:description", content: `Access your ${BRAND.shortName} account.` },
  ] }),
  component: () => (
    <AuthForm title="Sign in" cta="Sign in" footer={<>New to {BRAND.shortName}? <Link to="/sign-up" className="font-semibold underline">Create an account</Link></>} />
  ),
});
