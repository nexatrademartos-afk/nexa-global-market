
import type {
  AiAdapter,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../types";

const DEFAULT_MODEL = "gemini-3.8-flash";
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_ATTEMPTS = 2;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
};

type GeminiApiError = {
  error?: {
    message?: string;
    status?: string;
  };
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiAdapter implements AiAdapter {
  provider = "gemini" as const;

  async generateContent(
    options: ChatCompletionOptions,
  ): Promise<ChatCompletionResult> {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const model = (
      process.env.GEMINI_MODEL || DEFAULT_MODEL
    ).trim();

    if (!apiKey) {
      return {
        text: "The AI service is not configured yet. The hosting environment is missing GEMINI_API_KEY.",
        provider: "gemini",
        model,
        status: "unconfigured",
        errorDetails:
          "Missing GEMINI_API_KEY in the server environment.",
        suggestedAction: "config_key",
      };
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(model)) {
      return {
        text: "The configured Gemini model name is invalid.",
        provider: "gemini",
        model,
        status: "service_unavailable",
        errorDetails: "GEMINI_MODEL contains unsupported characters.",
        suggestedAction: "config_key",
      };
    }

    const contents: Array<{
      role: "user" | "model";
      parts: Array<{ text: string }>;
    }> = [];

    for (const message of options.messages) {
      // System instructions are sent separately below.
      if (message.role === "system") continue;

      const role = message.role === "assistant" ? "model" : "user";
      const content = String(message.content ?? "");

      if (!content.trim()) continue;

      const previous = contents[contents.length - 1];

      if (previous && previous.role === role) {
        previous.parts[0].text += `\n\n${content}`;
      } else {
        contents.push({
          role,
          parts: [{ text: content }],
        });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "Hello" }],
      });
    } else if (contents[0].role !== "user") {
      contents.unshift({
        role: "user",
        parts: [{ text: "Continue the conversation." }],
      });
    }

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1024,
      },
    };

    if (options.systemPrompt?.trim()) {
      payload.systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${model}:generateContent`;

    let lastNetworkError = "The request did not complete.";
    let response: Response | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (
          attempt < MAX_ATTEMPTS &&
          [429, 500, 502, 503, 504].includes(response.status)
        ) {
          await response.text();
          response = null;
          await delay(800);
          continue;
        }

        break;
      } catch (error: unknown) {
        lastNetworkError =
          error instanceof Error
            ? error.name === "AbortError"
              ? "Gemini request timed out."
              : error.message
            : "Unknown network error.";

        response = null;

        if (attempt < MAX_ATTEMPTS) {
          await delay(800);
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    if (!response) {
      return {
        text: "Gemini could not be reached in time. Please try again shortly.",
        provider: "gemini",
        model,
        status: "service_unavailable",
        errorDetails: lastNetworkError,
        suggestedAction: "retry",
      };
    }

    if (!response.ok) {
      const errorBody = await response.text();
      let apiMessage = `HTTP ${response.status}`;

      try {
        const parsed = JSON.parse(errorBody) as GeminiApiError;
        apiMessage = parsed.error?.message || apiMessage;
      } catch {
        // Keep the safe HTTP status if the error body is not JSON.
      }

      const lowerMessage = apiMessage.toLowerCase();
      const mentionsInvalidKey =
        lowerMessage.includes("api key not valid") ||
        lowerMessage.includes("invalid api key") ||
        lowerMessage.includes("api_key_invalid");

      if (
        response.status === 401 ||
        mentionsInvalidKey ||
        (response.status === 403 &&
          (lowerMessage.includes("api key") ||
            lowerMessage.includes("credential")))
      ) {
        return {
          text: "Gemini authentication failed. Check the server-side API key and its permissions.",
          provider: "gemini",
          model,
          status: "invalid_key",
          errorDetails: `HTTP ${response.status}: ${apiMessage}`,
          suggestedAction: "config_key",
        };
      }

      if (
        response.status === 429 ||
        lowerMessage.includes("resource_exhausted") ||
        lowerMessage.includes("quota exceeded")
      ) {
        return {
          text: "Gemini's quota or rate limit has been reached. Please try again later.",
          provider: "gemini",
          model,
          status: "rate_limited",
          errorDetails: `HTTP ${response.status}: ${apiMessage}`,
          suggestedAction: "retry",
        };
      }

      return {
        text:
          response.status >= 500
            ? "Gemini is temporarily unavailable. Please try again shortly."
            : "Gemini rejected the request. Check the model configuration and API access.",
        provider: "gemini",
        model,
        status: "service_unavailable",
        errorDetails: `HTTP ${response.status}: ${apiMessage}`,
        suggestedAction:
          response.status >= 500 ? "retry" : "config_key",
      };
    }

    try {
      const data = (await response.json()) as GeminiResponse;
      const candidate = data.candidates?.[0];

      const text = (candidate?.content?.parts ?? [])
        .map((part) => part.text ?? "")
        .filter((part) => part.length > 0)
        .join("\n")
        .trim();

      if (!text) {
        const blockReason = data.promptFeedback?.blockReason;

        return {
          text: blockReason
            ? "Gemini could not answer this request because it was blocked by the provider's safety checks."
            : "Gemini returned no text for this request. Please try rephrasing it.",
          provider: "gemini",
          model,
          status: "fallback",
          errorDetails: blockReason
            ? `Prompt blocked: ${blockReason}`
            : "The response contained no text parts.",
          suggestedAction: "retry",
        };
      }

      return {
        text,
        provider: "gemini",
        model,
        status: "success",
      };
    } catch {
      return {
        text: "Gemini responded, but the server could not read the response.",
        provider: "gemini",
        model,
        status: "service_unavailable",
        errorDetails: "Failed to parse the Gemini response JSON.",
        suggestedAction: "retry",
      };
    }
  }
}
