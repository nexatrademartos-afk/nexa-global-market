import type { AiAdapter, ChatCompletionOptions, ChatCompletionResult } from "../types";

export class ClaudeAdapter implements AiAdapter {
  provider = "claude" as const;

  async generateContent(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const apiKey =
      process.env.ANTHROPIC_API_KEY ||
      process.env.CLAUDE_API_KEY ||
      process.env.AI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured in server environment variables."
      );
    }

    const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
    const endpoint = "https://api.anthropic.com/v1/messages";

    const messages = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
        content: m.content,
      }));

    if (messages.length === 0 || messages[0].role !== "user") {
      messages.unshift({ role: "user", content: "Hello" });
    }

    const payload: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens ?? 1024,
      messages,
      temperature: options.temperature ?? 0.7,
    };

    if (options.systemPrompt) {
      payload.system = options.systemPrompt;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    return {
      text: text.trim(),
      provider: "claude",
      model,
    };
  }
}
