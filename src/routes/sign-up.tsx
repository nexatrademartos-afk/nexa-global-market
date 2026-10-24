import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND, brandPageTitle } from "@/lib/brand";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/sign-up")({
  head: () => ({ meta: [
    { title: brandPageTitle("Create account") }, { name: "description", content: `Create a free ${BRAND.shortName} customer account.` },
    { property: "og:title", content: `Join ${BRAND.shortName}` }, { property: "og:description", content: BRAND.tagline },
  ] }),
  component: () => (
    <AuthForm title="Create your account" cta="Create customer account" withName
      note="New accounts are customer accounts. Partner, delivery and commission roles require a separate approved application."
      footer={<>Already have an account? <Link to="/sign-in" className="font-semibold underline">Sign in</Link></>} />
  ),
});
