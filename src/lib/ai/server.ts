import { createServerFn } from "@tanstack/react-start";
import { generateAiResponse } from "./index";
import type { ChatMessage, ChatCompletionResult } from "./types";
import {
  CUSTOMER_SUPPORT_SYSTEM_PROMPT,
  ADMIN_COPILOT_SYSTEM_PROMPT,
} from "./prompts";

export interface SendAiChatPayload {
  mode: "customer" | "admin";
  messages: ChatMessage[];
  contextData?: string;
}

export const sendAiChatMessage = createServerFn({ method: "POST" })
  .validator((raw: unknown): SendAiChatPayload => {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid payload: expected object");
    }
    const data = raw as Record<string, unknown>;
    const mode = data.mode === "admin" ? "admin" : "customer";

    if (!Array.isArray(data.messages)) {
      throw new Error("Messages array is required");
    }

    const messages: ChatMessage[] = data.messages.map((item: any) => {
      const role =
        item.role === "assistant"
          ? "assistant"
          : item.role === "system"
          ? "system"
          : "user";
      const content = String(item.content || "").slice(0, 4000);
      return { role, content };
    });

    const contextData =
      typeof data.contextData === "string"
        ? data.contextData.slice(0, 5000)
        : undefined;

    return { mode, messages, contextData };
  })
  .handler(async ({ data }): Promise<ChatCompletionResult> => {
    const basePrompt =
      data.mode === "admin"
        ? ADMIN_COPILOT_SYSTEM_PROMPT
        : CUSTOMER_SUPPORT_SYSTEM_PROMPT;

    const systemPrompt = data.contextData
      ? `${basePrompt}\n\n--- CURRENT LIVE CONTEXT ---\n${data.contextData}`
      : basePrompt;

    try {
      return await generateAiResponse({
        messages: data.messages,
        systemPrompt,
        temperature: data.mode === "admin" ? 0.3 : 0.7,
        maxTokens: data.mode === "admin" ? 1500 : 1000,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        text:
          data.mode === "admin"
            ? `Admin Notice: AI generation hit a service issue (${errMsg}). Offline operational checks remain active.`
            : "Welcome to Nexa Global Market! Our automated assistant is currently refreshing. You can check our FAQs or contact our team directly on WhatsApp (+27 68 496 3972) for instant support.",
        provider: "gemini",
        model: "gemini-3.5-flash",
        status: "service_unavailable",
        errorDetails: errMsg,
        suggestedAction: "whatsapp",
      };
    }
  });
