import { Session, LogMessage, ChatRequest, ChatStreamEvent } from '@/types/log';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchSessions(customPath?: string): Promise<Session[]> {
  const url = new URL(`${API_BASE}/api/sessions`);
  if (customPath) {
    url.searchParams.set('path', customPath);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function fetchLogs(sessionId: string, customPath?: string): Promise<LogMessage[]> {
  const url = new URL(`${API_BASE}/api/logs/${sessionId}`);
  if (customPath) {
    url.searchParams.set('path', customPath);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function sendChat(request: ChatRequest): Promise<ChatStreamEvent[]> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Chat request failed');
  }

  const events: ChatStreamEvent[] = [];
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) return events;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          events.push(data);
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  return events;
}

export async function fetchModels(provider: string, apiKey?: string, baseUrl?: string): Promise<any[]> {
  try {
    const url = new URL(`${API_BASE}/api/models/${provider}`);
    if (apiKey) url.searchParams.set('apiKey', apiKey);
    if (baseUrl) url.searchParams.set('baseUrl', baseUrl);
    const res = await fetch(url.toString());
    if (!res.ok) {
      // Return empty list on any HTTP error (e.g., backend not running)
      console.error(`Failed to fetch models for ${provider}: ${res.status} ${res.statusText}`);
      return [];
    }
    return await res.json();
  } catch (e) {
    // Network or other error – log and return empty list
    console.error('Error fetching models:', e);
    return [];
  }
}

export async function sendChatStreaming(
  request: ChatRequest,
  onChunk: (event: ChatStreamEvent) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Chat request failed');
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onChunk(data);
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}
