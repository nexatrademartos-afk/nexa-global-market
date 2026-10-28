
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

    let text =
      "I'm having trouble retrieving a live answer right now. Our customer support team is available on WhatsApp to assist you directly.";

    if (
      /whatsapp|place an order|how.*order|order.*product|buy.*product/.test(
        latestQuestion,
      )
    ) {
      text =
        "To arrange an order, message our support team on WhatsApp. Share the product name or link, the quantity you need, and your delivery area. Website checkout is currently in preview.";
    } else if (
      /didn'?t receive|missing.*order|never received|not arrived|where.*order|track|tracking|order status|parcel/.test(
        latestQuestion,
      )
    ) {
      text =
        "Live order tracking is not connected to this chat yet. If you have an enquiry or haven't received your delivery, please message our support team on WhatsApp with your order reference so we can investigate immediately.";
    } else if (
      /account|register|sign\s*up|sign\s*in|login|how.*(?:set|create).*account/.test(
        latestQuestion,
      )
    ) {
      text =
        "Create a customer account at /sign-up with your name, email, and a password of at least 8 characters. Existing customers can sign in at /sign-in, and password recovery is available at /forgot-password.";
    } else if (
      /delivery|shipping|courier|how long.*deliver/.test(
        latestQuestion,
      )
    ) {
      text =
        "Delivery availability and fees depend on your area. Please contact our support team on WhatsApp with your town or suburb so they can confirm the available option and fee.";
    } else if (
      /price|how much|cost|in stock|available|sofa|product/.test(
        latestQuestion,
      )
    ) {
      text =
        "Live stock and pricing must be verified directly against our catalogue or with our support team on WhatsApp.";
    }

    console.warn("TJC-OS provider returned a non-success result", {
      mode: data.mode,
      provider: result.provider,
      model: result.model,
      status: result.status,
    });

    const { errorDetails: _providerDetails, ...safeResult } = result;
    return {
      ...safeResult,
      text,
      suggestedAction: "whatsapp",
    };
  }

  if (result.status !== "success") {
    console.warn("TJC-OS provider returned a non-success result", {
      mode: data.mode,
      provider: result.provider,
      model: result.model,
      status: result.status,
    });
    const { errorDetails: _providerDetails, ...safeResult } = result;
    return safeResult;
  }

  return result;
} catch (err: unknown) {
  console.warn("TJC-OS AI request failed", {
    mode: data.mode,
    errorName: err instanceof Error ? err.name : "UnknownError",
  });

  return {
    text:
      data.mode === "admin"
        ? "Admin Notice: AI generation is temporarily unavailable. Please retry shortly."
        : "I'm having trouble reaching the AI service right now. Please use the support button below to chat directly with our team.",
    provider: "gemini",
    model: "gemini-3.6-flash",
    status: "service_unavailable",
    suggestedAction: "whatsapp",
  };
  }
  });
