import type { AiAdapter, ChatCompletionOptions, ChatCompletionResult } from "../types";

export class GeminiAdapter implements AiAdapter {
  provider = "gemini" as const;

  async generateContent(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.AI_API_KEY ||
      ""
    ).trim();

    const model = (process.env.GEMINI_MODEL || "gemini-3.5-flash").trim();

    // 1. Missing Key Handling: Return clean diagnostic instead of hard crash
    if (!apiKey) {
      return {
        text: "AI service is currently unconfigured. GEMINI_API_KEY is not set in the server environment.",
        provider: "gemini",
        model,
        status: "unconfigured",
        errorDetails: "Missing GEMINI_API_KEY in server environment variables.",
        suggestedAction: "config_key",
      };
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    for (const msg of options.messages) {
      if (msg.role === "system") continue;
      const role = msg.role === "assistant" ? "model" : "user";

      const last = contents[contents.length - 1];
      if (last && last.role === role) {
        last.parts[0].text += `\n\n${msg.content}`;
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }

    if (contents.length === 0 || contents[0].role !== "user") {
      contents.unshift({
        role: "user",
        parts: [{ text: "Hello" }],
      });
    }

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1024,
      },
    };

    if (options.systemPrompt) {
      payload.system_instruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    // Helper for fetch with single automatic retry for transient hiccups
    let lastError: Error | null = null;
    let response: Response | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        break; // successfully got HTTP response
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt === 1) {
          // brief pause before retry
          await new Promise((res) => setTimeout(res, 800));
        }
      }
    }

    if (!response) {
      return {
        text: "Could not reach Gemini AI servers. Please check your internet connection or proxy.",
        provider: "gemini",
        model,
        status: "service_unavailable",
        errorDetails: lastError?.message || "Network request failed",
        suggestedAction: "retry",
      };
    }

    // 2. HTTP Error Status Handling
    if (!response.ok) {
      const errText = await response.text();
      let apiMessage = `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          apiMessage = parsed.error.message;
        }
      } catch {
        apiMessage = errText.slice(0, 200) || apiMessage;
      }

      // Invalid Key (400 or 403 with key mention)
      if (
        response.status === 400 &&
        (apiMessage.includes("API_KEY_INVALID") ||
          apiMessage.toLowerCase().includes("api key not valid") ||
          apiMessage.toLowerCase().includes("invalid api key"))
      ) {
        return {
          text: "The configured Gemini API key is invalid or unrecognized by Google AI Studio.",
          provider: "gemini",
          model,
          status: "invalid_key",
          errorDetails: apiMessage,
          suggestedAction: "config_key",
        };
      }

      // Rate Limit / Quota Exceeded (429 or RESOURCE_EXHAUSTED)
      if (
        response.status === 429 ||
        apiMessage.includes("RESOURCE_EXHAUSTED") ||
        apiMessage.toLowerCase().includes("quota exceeded")
      ) {
        return {
          text: "Gemini AI quota or rate limit has been reached. Please wait a few moments before trying again.",
          provider: "gemini",
          model,
          status: "rate_limited",
          errorDetails: apiMessage,
          suggestedAction: "retry",
        };
      }

      // Service Unavailable or Overloaded (503 / 500)
      if (response.status === 503 || response.status === 500) {
        return {
          text: "The Gemini AI model is momentarily overloaded. Please try again shortly.",
          provider: "gemini",
          model,
          status: "service_unavailable",
          errorDetails: apiMessage,
          suggestedAction: "retry",
        };
      }

      // Other API Errors
      return {
        text: `Gemini API returned an error: ${apiMessage}`,
        provider: "gemini",
        model,
        status: "service_unavailable",
        errorDetails: apiMessage,
        suggestedAction: "whatsapp",
      };
    }

    try {
      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text || !text.trim()) {
        return {
          text: "I processed your request, but no text response was returned. How else can I assist?",
          provider: "gemini",
          model,
          status: "fallback",
        };
      }

      return {
        text: text.trim(),
        provider: "gemini",
        model,
        status: "success",
      };
    } catch (parseErr: unknown) {
      return {
        text: "Error reading response from AI provider.",
        provider: "gemini",
        model,
        status: "service_unavailable",
        errorDetails: String(parseErr),
        suggestedAction: "retry",
      };
    }
  }
}
