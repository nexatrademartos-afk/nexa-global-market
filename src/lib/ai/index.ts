
import type {
  AiAdapter,
  AiProviderType,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "./types";
import { GeminiAdapter } from "./adapters/gemini";
import { OpenAiAdapter } from "./adapters/openai";
import { ClaudeAdapter } from "./adapters/claude";

const adapters: Record<AiProviderType, AiAdapter> = {
  gemini: new GeminiAdapter(),
  openai: new OpenAiAdapter(),
  claude: new ClaudeAdapter(),
};

export function getActiveAiAdapter(): AiAdapter {
  const envProvider = (process.env.AI_PROVIDER || "").toLowerCase().trim();

  if (envProvider === "openai" || envProvider === "chatgpt") {
    return adapters.openai;
  }

  if (envProvider === "claude" || envProvider === "anthropic") {
    return adapters.claude;
  }

  if (envProvider === "gemini" || envProvider === "google") {
    return adapters.gemini;
  }

  // Automatic selection uses server-side credentials only.
  if (process.env.GEMINI_API_KEY) {
    return adapters.gemini;
  }

  if (process.env.OPENAI_API_KEY) {
    return adapters.openai;
  }

  if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY) {
    return adapters.claude;
  }

  return adapters.gemini;
}

export async function generateAiResponse(
  options: ChatCompletionOptions,
): Promise<ChatCompletionResult> {
  const adapter = getActiveAiAdapter();
  return await adapter.generateContent(options);
}
