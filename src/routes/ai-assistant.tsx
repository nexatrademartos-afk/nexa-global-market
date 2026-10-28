import { createFileRoute } from "@tanstack/react-router";
import { BRAND, brandPageTitle } from "@/lib/brand";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: brandPageTitle("TJC-OS AI Assistant") },
      {
        name: "description",
        content: `Chat with TJC-OS, the official customer support AI assistant for ${BRAND.name}.`,
      },
    ],
  }),
  component: AiAssistantPage,
});

function AiAssistantPage() {
  return (
    <main
      aria-label="TJC-OS AI Assistant"
      className="fixed inset-0 min-h-[100dvh] bg-[#080808]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
    </main>
  );
}
