
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ai-assistant")({
  component: AiAssistantPage,
});

function AiAssistantPage() {
  return (
    <main
      aria-label="AI assistant"
      className="fixed inset-0 min-h-[100dvh] bg-[#080808]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
    </main>
  );
}
