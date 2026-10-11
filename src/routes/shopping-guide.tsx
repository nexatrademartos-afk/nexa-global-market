import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/shopping-guide")({
  component: () => <InfoPage page="shopping" />,
});
