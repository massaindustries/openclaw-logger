import { create } from 'zustand';
import { Session, LogMessage } from '@/types/log';

interface LogStore {
  sessions: Session[];
  selectedSession: Session | null;
  logs: LogMessage[];
  selectedContextIds: Set<string>;
  chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  isLoading: boolean;
  error: string | null;
  customSessionsPath: string;
  isPathConfigOpen: boolean;

  setSessions: (sessions: Session[]) => void;
  setSelectedSession: (session: Session | null) => void;
  setLogs: (logs: LogMessage[]) => void;
  toggleContextSelection: (id: string) => void;
  clearContextSelection: () => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCustomSessionsPath: (path: string) => void;
  setPathConfigOpen: (open: boolean) => void;
}

export const useLogStore = create<LogStore>((set) => ({
  sessions: [],
  selectedSession: null,
  logs: [],
  selectedContextIds: new Set(),
  chatMessages: [],
  isLoading: false,
  error: null,
  customSessionsPath: '',
  isPathConfigOpen: false,

  setSessions: (sessions) => set({ sessions }),
  setSelectedSession: (session) => set({ selectedSession: session, logs: [] }),
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
    set((state) => ({
      chatMessages: [...state.chatMessages, { role, content }],
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setCustomSessionsPath: (path) => set({ customSessionsPath: path }),
  setPathConfigOpen: (open) => set({ isPathConfigOpen: open }),
}));
