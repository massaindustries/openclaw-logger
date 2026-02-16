import { Session, LogMessage, ChatRequest, ChatStreamEvent } from '@/types/log';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchSessions(customPath?: string): Promise<Session[]> {
  const url = new URL(`${API_BASE}/api/sessions`);
  if (customPath) {
    url.searchParams.set('path', customPath);
  }
  
  console.log('📤 [API] Fetching sessions:', { url: url.toString() });

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error('❌ [API] Failed to fetch sessions:', res.status, res.statusText);
    throw new Error('Failed to fetch sessions');
  }

  const data = await res.json();
  console.log('✅ [API] Fetched sessions:', { count: data.length });
  return data;
}

export async function fetchLogs(sessionId: string, customPath?: string): Promise<LogMessage[]> {
  const url = new URL(`${API_BASE}/api/logs/${sessionId}`);
  if (customPath) {
    url.searchParams.set('path', customPath);
  }

  console.log('📤 [API] Fetching logs:', { sessionId, url: url.toString() });

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error('❌ [API] Failed to fetch logs:', res.status, res.statusText);
    throw new Error('Failed to fetch logs');
  }

  const data = await res.json();
  console.log('✅ [API] Fetched logs:', { sessionId, count: data.length });
  return data;
}

export async function sendChat(request: ChatRequest): Promise<ChatStreamEvent[]> {
  console.log('📤 [API] Sending chat request:', {
    provider: request.provider,
    model: request.model,
    queryLength: request.query?.length,
    contextLength: request.context?.length,
    hasApiKey: !!request.apiKey,
    hasBaseUrl: !!request.baseUrl,
    fullPayload: request,
  });

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  console.log('📥 [API] Response status:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ [API] Chat request failed:', error);
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
          console.log('📨 [API] Received event:', {
            type: data.type,
            contentLength: data.content?.length,
            data,
          });
          events.push(data);
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  console.log('✅ [API] Chat completed, total events:', events.length);
  return events;
}

export async function fetchModels(provider: string, apiKey?: string, baseUrl?: string): Promise<any[]> {
  console.log('📤 [API] Fetching models:', {
    provider,
    hasApiKey: !!apiKey,
    hasBaseUrl: !!baseUrl,
  });

  try {
    const url = new URL(`${API_BASE}/api/models/${provider}`);
    if (apiKey) url.searchParams.set('apiKey', apiKey);
    if (baseUrl) url.searchParams.set('baseUrl', baseUrl);

    console.log('📥 [API] Calling models endpoint:', url.toString());

    const res = await fetch(url.toString());
    
    if (!res.ok) {
      console.warn(`⚠️ [API] Failed to fetch models for ${provider}:`, {
        status: res.status,
        statusText: res.statusText,
      });
      return [];
    }

    const result = await res.json();
    console.log('✅ [API] Received models:', {
      count: result.length,
      models: result.slice(0, 3), // Show first 3 as preview
    });

    return result;
  } catch (e) {
    console.error('❌ [API] Error fetching models:', e);
    
    // Fallback for Grok provider – use hard‑coded list when the backend is unavailable
    if (provider === 'grok') {
      const hardCoded = [
        "grok-4.1-fast-reasoning",
        "grok-4.1-fast-non-reasoning",
        "grok-code-fast-1",
        "grok-4-fast-reasoning",
        "grok-4-fast-non-reasoning",
        "grok-4-0709",
        "grok-3-mini",
        "grok-3",
        "grok-2-vision-1212",
      ];
      console.log('📌 [API] Using fallback Grok models:', hardCoded.length);
      return hardCoded.map((id) => ({ id, name: id }));
    }
    return [];
  }
}

export async function sendChatStreaming(
  request: ChatRequest,
  onChunk: (event: ChatStreamEvent) => void
): Promise<void> {
  console.log('📤 [API Stream] Starting streaming chat request:', {
    provider: request.provider,
    model: request.model,
    queryLength: request.query?.length,
    contextLength: request.context?.length,
    hasApiKey: !!request.apiKey,
    hasBaseUrl: !!request.baseUrl,
    fullPayload: request,
  });

  const timeStart = performance.now();

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const timeFirstByte = performance.now();
  console.log('📥 [API Stream] First response received:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
    timeToFirstByte: `${(timeFirstByte - timeStart).toFixed(2)}ms`,
    headers: {
      contentType: res.headers.get('content-type'),
      contentLength: res.headers.get('content-length'),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ [API Stream] Request failed:', error);
    throw new Error(error.error || 'Chat request failed');
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    console.warn('⚠️ [API Stream] No reader available');
    return;
  }

  let eventCount = 0;
  let contentLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('✅ [API Stream] Stream completed:', {
        totalEvents: eventCount,
        totalContentLength: contentLength,
        totalTime: `${(performance.now() - timeStart).toFixed(2)}ms`,
      });
      break;
    }

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          
          console.log(`📨 [API Stream] Event #${eventCount + 1}:`, {
            type: data.type,
            contentLength: data.content?.length,
            hasError: !!data.error,
            retryAfter: data.retryAfter,
          });

          if (data.type === 'content' && data.content) {
            contentLength += data.content.length;
          }

          eventCount++;
          onChunk(data);
        } catch (e) {
          console.warn('⚠️ [API Stream] Failed to parse event:', {
            line: line.substring(0, 100),
            error: String(e),
          });
        }
      }
    }
  }
}
