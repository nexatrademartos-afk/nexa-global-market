import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/returns-policy")({
  component: () => <InfoPage page="returns" />,
});
