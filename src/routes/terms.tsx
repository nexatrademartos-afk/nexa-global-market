import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/terms")({
  component: () => <InfoPage page="terms" />,
});
