export type MessageRole = 'user' | 'assistant' | 'tool';

export interface LogMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  thinking?: string;
  toolName?: string;
  toolResult?: string;
}

export interface Session {
  id: string;
  filename: string;
  modified: string;
  messageCount: number;
}

export interface APIError {
  error: string;
  detail?: string;
}

export interface ChatRequest {
  query: string;
  context?: string;
  /** Optional provider (e.g. "openai-compatible", "anthropic", "google", "grok") */
  provider?: string;
  /** Optional model identifier (e.g. "gpt-4o") */
  model?: string;
}

export interface ChatResponse {
  response: string;
}

export type ChatStreamEvent =
  | { type: 'content'; content: string }
  | { type: 'done' }
  | { type: 'error'; error: string };
