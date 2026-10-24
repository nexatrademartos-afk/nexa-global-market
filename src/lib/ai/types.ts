export type AiRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: AiRole;
  content: string;
}

export type AiProviderType = "gemini" | "openai" | "claude";

export type AiErrorType =
  | "missing_key"
  | "invalid_key"
  | "rate_limit"
  | "service_unavailable"
  | "network_error"
  | "unknown";

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
  status: "success" | "rate_limited" | "unconfigured" | "invalid_key" | "service_unavailable" | "fallback";
  errorDetails?: string;
  suggestedAction?: "whatsapp" | "retry" | "config_key";
}

export interface AiAdapter {
  provider: AiProviderType;
  generateContent(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
}
