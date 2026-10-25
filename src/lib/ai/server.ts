
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
  const result = await generateAiResponse({
    messages: data.messages,
    systemPrompt,
    temperature: data.mode === "admin" ? 0.3 : 0.7,
    maxTokens: data.mode === "admin" ? 1500 : 1000,
  });

  // Keep successful AI responses unchanged.
  if (result.status === "success" && result.text.trim()) {
    return result;
  }

  // Give customers useful guidance when the AI provider is unavailable.
  if (data.mode === "customer") {
    const latestQuestion =
      [...data.messages]
        .reverse()
        .find((message) => message.role === "user")
        ?.content.toLowerCase() ?? "";

    const whatsapp =
      "https://wa.me/27684963972";

    let text =
      "I'm having trouble answering that right now. Our support team can help you on WhatsApp: " +
      whatsapp;

    if (
      /whatsapp|place an order|how.*order|order.*product|buy.*product/.test(
        latestQuestion,
      )
    ) {
      text =
        "To ask about ordering, message our team on WhatsApp at " +
        whatsapp +
        ". Send the product name or link, the quantity you want, and your delivery area. Website checkout and order placement are not live in this preview yet.";
    } else if (
      /track|tracking|where.*order|order status|parcel/.test(
        latestQuestion,
      )
    ) {
      text =
        "Live order tracking is not connected to this chat yet. Please contact our team on WhatsApp at " +
        whatsapp +
        " and share your order reference if you have one.";
    } else if (
      /price|how much|cost|in stock|available|sofa|product/.test(
        latestQuestion,
      )
    ) {
      text =
        "I can't confirm live stock or current prices unless that information is available in the product catalogue. Please check the product page or contact our team on WhatsApp: " +
        whatsapp;
    }

    return {
      ...result,
      text,
      suggestedAction: "whatsapp",
    };
  }

  return result;
} catch (err: unknown) {
  const errMsg =
    err instanceof Error ? err.message : String(err);

  return {
    text:
      data.mode === "admin"
        ? "Admin Notice: AI generation is temporarily unavailable. Please retry shortly."
        : "I'm having trouble reaching the AI service right now. For ordering assistance, contact our team on WhatsApp: https://wa.me/27684963972",
    provider: "gemini",
    model: "gemini-3.6-flash",
    status: "service_unavailable",
    errorDetails: errMsg,
    suggestedAction: "whatsapp",
  };
  }
  });
