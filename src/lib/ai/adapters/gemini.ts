import type { AiAdapter, ChatCompletionOptions, ChatCompletionResult } from "../types";

export class GeminiAdapter implements AiAdapter {
  provider = "gemini" as const;

  async generateContent(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.AI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured in server environment variables."
      );
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
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

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Gemini API error (status ${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          errMsg = parsed.error.message;
        }
      } catch {
        errMsg = errText || errMsg;
      }
      throw new Error(errMsg);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text =
      candidate?.content?.parts?.[0]?.text ||
      "I am currently processing your request. Please try again in a moment.";

    return {
      text: text.trim(),
      provider: "gemini",
      model,
    };
  }
}
