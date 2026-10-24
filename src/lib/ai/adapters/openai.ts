import type { AiAdapter, ChatCompletionOptions, ChatCompletionResult } from "../types";

export class OpenAiAdapter implements AiAdapter {
  provider = "openai" as const;

  async generateContent(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not configured in server environment variables."
      );
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const endpoint = "https://api.openai.com/v1/chat/completions";

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }

    for (const msg of options.messages) {
      messages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    return {
      text: text.trim(),
      provider: "openai",
      model,
    };
  }
}
