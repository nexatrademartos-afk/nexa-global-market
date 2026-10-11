import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/privacy")({
  component: () => <InfoPage page="privacy" />,
});
