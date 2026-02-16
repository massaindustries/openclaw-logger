import { create } from 'zustand';
import { Session, LogMessage } from '@/types/log';

// Helper to get storage key for chat messages
const getChatStorageKey = (filename: string | null) => {
  if (!filename) return null;
  return `chat_messages_${filename}`;
};

// Helper to load chat messages from localStorage
const loadPersistedChat = (filename: string | null): Array<{ role: 'user' | 'assistant'; content: string }> => {
  if (typeof window === 'undefined' || !filename) return [];
  const key = getChatStorageKey(filename);
  if (!key) return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save chat messages to localStorage
const savePersistedChat = (filename: string | null, messages: Array<{ role: 'user' | 'assistant'; content: string }>) => {
  if (typeof window === 'undefined' || !filename) return;
  const key = getChatStorageKey(filename);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(messages));
};

// Helper to clear chat messages from localStorage
const clearPersistedChat = (filename: string | null) => {
  if (typeof window === 'undefined' || !filename) return;
  const key = getChatStorageKey(filename);
  if (!key) return;
  localStorage.removeItem(key);
};

interface LogStore {
  apiKeys: Record<string, string>; // provider -> API key
  setApiKey: (provider: string, key: string) => void;
  resetApiKeys: () => void;
  sessions: Session[];
  selectedSession: Session | null;
  logs: LogMessage[];
  selectedContextIds: Set<string>;
  chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  isLoading: boolean;
  error: string | null;
  customSessionsPath: string;
  isPathConfigOpen: boolean;
    /** Currently selected provider */
    selectedProvider: string;
    /** Currently selected model */
    selectedModel: string;
    /** Custom base URL for OpenAI-compatible provider */
    openAIBaseUrl: string;


  setSessions: (sessions: Session[]) => void;
  setSelectedSession: (session: Session | null) => void;
  setLogs: (logs: LogMessage[]) => void;
  toggleContextSelection: (id: string) => void;
  clearContextSelection: () => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  clearChatMessages: () => void;
  updateLastAssistantMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCustomSessionsPath: (path: string) => void;
  setPathConfigOpen: (open: boolean) => void;
  /** Set currently selected provider */
  setProvider: (provider: string) => void;
   /** Set currently selected model */
   setModel: (model: string) => void;
   /** Set custom OpenAI base URL */
   setOpenAIBaseUrl: (url: string) => void;

}

const DEFAULT_MODELS: Record<string, string> = {
  "regolo": "gpt-oss-120b",
  "openai-compatible": "gpt-4o",
  "anthropic": "claude-3-5-sonnet-20241022",
  "google": "gemini-1.5-pro",
  "grok": "grok-beta",
};

export const useLogStore = create<LogStore>((set) => ({
  sessions: [],
  selectedSession: null,
  logs: [],
  selectedContextIds: new Set(),
  chatMessages: [],
  isLoading: false,
  error: null,
  customSessionsPath: typeof window !== 'undefined' ? (localStorage.getItem('customSessionsPath') ?? '') : '',
  isPathConfigOpen: false,
  selectedProvider: typeof window !== 'undefined' ? (localStorage.getItem('selectedProvider') ?? 'openai-compatible') : 'openai-compatible',
  selectedModel: typeof window !== 'undefined' ? (localStorage.getItem('selectedModel') ?? 'gpt-oss-120b') : 'gpt-oss-120b',
  apiKeys: typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('apiKeys') ?? '{}')) : {},
  openAIBaseUrl: typeof window !== 'undefined' ? (localStorage.getItem('openAIBaseUrl') ?? '') : '',

  setSessions: (sessions) => set({ sessions }),
  setSelectedSession: (session) => {
    const chatMessages = loadPersistedChat(session?.filename ?? null);
    set({ selectedSession: session, logs: [], chatMessages });
  },
  setLogs: (logs) => set({ logs }),
  toggleContextSelection: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedContextIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedContextIds: newSet };
    }),
  clearContextSelection: () => set({ selectedContextIds: new Set() }),
  addChatMessage: (role, content) =>
    set((state) => {
      const newMessages = [...state.chatMessages, { role, content }];
      savePersistedChat(state.selectedSession?.filename ?? null, newMessages);
      return { chatMessages: newMessages };
    }),
  clearChatMessages: () =>
    set((state) => {
      clearPersistedChat(state.selectedSession?.filename ?? null);
      return { chatMessages: [] };
    }),
  updateLastAssistantMessage: (content: string) =>
    set((state) => {
      const lastIndex = state.chatMessages.length - 1;
      if (lastIndex >= 0 && state.chatMessages[lastIndex].role === 'assistant') {
        const newMessages = [...state.chatMessages];
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          content: newMessages[lastIndex].content + content,
        };
        savePersistedChat(state.selectedSession?.filename ?? null, newMessages);
        return { chatMessages: newMessages };
      }
      return state;
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setCustomSessionsPath: (path) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('customSessionsPath', path);
        }
        set({ customSessionsPath: path });
      },
  setPathConfigOpen: (open) => set({ isPathConfigOpen: open }),
  setProvider: (provider) => {
    const defaultModel = DEFAULT_MODELS[provider] || "gpt-4o";
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedProvider', provider);
      localStorage.setItem('selectedModel', defaultModel);
    }
    set({ selectedProvider: provider, selectedModel: defaultModel });
  },
  setModel: (model) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedModel', model);
    }
    set({ selectedModel: model });
  },
  // Store API key for a specific provider
  setApiKey: (provider, key) => {
    // Load existing keys
    const current = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('apiKeys') ?? '{}') : {};
    const newKeys = { ...current, [provider]: key };
    if (typeof window !== 'undefined') {
      localStorage.setItem('apiKeys', JSON.stringify(newKeys));
    }
    set({ apiKeys: newKeys });
  },

  // Set custom OpenAI base URL
  setOpenAIBaseUrl: (url) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('openAIBaseUrl', url);
    }
    set({ openAIBaseUrl: url });
  },
  // Reset all stored API keys
  resetApiKeys: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('apiKeys');
    }
    set({ apiKeys: {} });
  },
}));
