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

    return await generateAiResponse({
      messages: data.messages,
      systemPrompt,
      temperature: data.mode === "admin" ? 0.3 : 0.7,
      maxTokens: data.mode === "admin" ? 1500 : 1000,
    });
  });
