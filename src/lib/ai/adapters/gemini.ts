
import { supabase } from "@/integrations/supabase/client";
import type {
  AiAdapter,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../types";

const DEFAULT_MODEL = "gemini-3.6-flash";

export class GeminiAdapter implements AiAdapter {
  provider = "gemini" as const;

  async generateContent(
    options: ChatCompletionOptions,
  ): Promise<ChatCompletionResult> {
    try {
      const { data, error } =
        await supabase.functions.invoke<ChatCompletionResult>(
          "nexa-gemini-chat",
          {
            body: {
              messages: options.messages,
              systemPrompt: options.systemPrompt,
              temperature: options.temperature ?? 0.7,
              maxTokens: options.maxTokens ?? 1000,
            },
          },
        );

      if (error) {
        return {
          text: "The Gemini connection through Supabase failed. Please try again shortly.",
          provider: "gemini",
          model: DEFAULT_MODEL,
          status: "service_unavailable",
          errorDetails: error.message,
          suggestedAction: "retry",
        };
      }

      if (!data || typeof data.text !== "string") {
        return {
          text: "Gemini returned an unexpected response. Please try again.",
          provider: "gemini",
          model: DEFAULT_MODEL,
          status: "service_unavailable",
          errorDetails: "Supabase returned no valid AI response.",
          suggestedAction: "retry",
        };
      }

      return {
        ...data,
        provider: "gemini",
        model: data.model || DEFAULT_MODEL,
      };
    } catch (error: unknown) {
      return {
        text: "The Gemini connection is temporarily unavailable. Please try again.",
        provider: "gemini",
        model: DEFAULT_MODEL,
        status: "service_unavailable",
        errorDetails:
          error instanceof Error ? error.message : "Unknown connection error.",
        suggestedAction: "retry",
      };
    }
  }
}
