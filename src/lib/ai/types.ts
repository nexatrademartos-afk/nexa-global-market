export type AiRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: AiRole;
  const string;
}

export type AiProviderType = "gemini" | "openai" | "claude";

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResult {
  text: string;
  provider: AiProviderType;
  model: string;
}

export interface AiAdapter {
  provider: AiProviderType;
  generateContent(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
}
