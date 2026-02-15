"use client";

import { useEffect, useCallback, useState } from "react";
import { useLogStore } from "@/store/log-store";
import { fetchSessions, fetchLogs, sendChatStreaming } from "@/lib/api";
import { Session } from "@/types/log";
import { SessionSidebar } from "./session-sidebar";
import { LogPanel } from "./log-panel";
import { ChatPanel } from "../chat/chat-panel";
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export function LogDashboard() {
  const {
    sessions,
    selectedSession,
    logs,
    selectedContextIds,
    chatMessages,
    isLoading,
    customSessionsPath,
    setSessions,
    setSelectedSession,
    setLogs,
    clearContextSelection,
    addChatMessage,
    setLoading,
    selectedProvider,
    selectedModel,
  } = useLogStore();

  const [isStreaming, setIsStreaming] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await fetchSessions(customSessionsPath || undefined);
      setSessions(data);
    } catch {
      toast.error("Error loading sessions");
    }
  }, [setSessions, customSessionsPath]);

  const loadLogs = useCallback(async (session: Session) => {
    setLoading(true);
    try {
      const data = await fetchLogs(session.id, customSessionsPath || undefined);
      setLogs(data);
      clearContextSelection();
    } catch {
      toast.error("Error loading log");
    } finally {
      setLoading(false);
    }
  }, [setLogs, clearContextSelection, setLoading, customSessionsPath]);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  useEffect(() => {
    if (selectedSession) {
      loadLogs(selectedSession);
      const interval = setInterval(() => {
        if (selectedSession) {
          fetchLogs(selectedSession.id, customSessionsPath || undefined)
            .then(setLogs)
            .catch(console.error);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedSession, loadLogs, customSessionsPath]);

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session);
  };

  const handleSendChat = async (message: string) => {
    const contextMessages = logs.filter((log) =>
      selectedContextIds.has(log.id)
    );
    const context = contextMessages
      .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join("\n\n");

    addChatMessage("user", message);
    setIsStreaming(true);

    try {
      await sendChatStreaming(
        { query: message, context: context || undefined, provider: selectedProvider, model: selectedModel },
        (event) => {
if (event.type === "content") {
              // Get the latest chat messages from the store to avoid stale closure
              const currentMessages = useLogStore.getState().chatMessages;
              const lastMsg = currentMessages[currentMessages.length - 1];
              if (lastMsg && lastMsg.role === "assistant") {
                useLogStore.setState((state) => {
                  const latest = state.chatMessages[state.chatMessages.length - 1];
                  if (latest && latest.role === "assistant") {
                    return {
                      chatMessages: [
                        ...state.chatMessages.slice(0, -1),
                        { ...latest, content: latest.content + event.content },
                      ],
                    };
                  }
                  // Fallback: add new assistant message (should not happen)
                  return {
                    chatMessages: [...state.chatMessages, { role: "assistant", content: event.content }],
                  };
                });
              } else {
                // No assistant message yet, add a new one
                addChatMessage("assistant", event.content);
              }
            } else if (event.type === "done") {
              setIsStreaming(false);
            } else if (event.type === "error") {
              toast.error(event.error);
              setIsStreaming(false);
            }
        }
      );
    } catch {
      toast.error("Error in chat");
      setIsStreaming(false);
    }
  };

  const handleClearSelection = () => {
    clearContextSelection();
  };

  const handleRemoveLog = (id: string) => {
    const newSet = new Set(selectedContextIds);
    newSet.delete(id);
    useLogStore.setState({ selectedContextIds: newSet });
  };

  const selectedLogs = logs.filter((log) => selectedContextIds.has(log.id));

  return (
    <div className="h-screen w-full min-w-0">
      <ResizablePanelGroup
        id="dashboard-panel-group"
        className="h-full w-full"
      >
        <ResizablePanel
          id="sidebar-panel"
          defaultSize={25}
          minSize={15}
          className="min-w-[180px]"
        >
          <SessionSidebar
            sessions={sessions}
            selectedSession={selectedSession}
            onSelectSession={handleSelectSession}
            isLoading={isLoading}
            onRefresh={loadSessions}
          />
        </ResizablePanel>

        <ResizableHandle
          id="handle-1"
          withHandle
          className="resizable-handle w-3 hover:w-4 transition-all border-r border-[#222222]"
        />

        <ResizablePanel
          id="log-panel"
          defaultSize={50}
          minSize={25}
          className="min-w-0 bg-[#1a1a1a] overflow-hidden"
        >
          <LogPanel
            logs={logs}
            isLoading={isLoading}
            selectedContextIds={selectedContextIds}
            onToggleContext={(id) => {
              const newSet = new Set(selectedContextIds);
              if (newSet.has(id)) newSet.delete(id);
              else newSet.add(id);
              useLogStore.setState({ selectedContextIds: newSet });
            }}
            onClearSelection={handleClearSelection}
          />
        </ResizablePanel>

        <ResizableHandle
          id="handle-2"
          withHandle
          className="resizable-handle w-3 hover:w-4 transition-all border-l border-[#222222]"
        />

        <ResizablePanel
          id="chat-panel"
          defaultSize={25}
          minSize={15}
          className="min-w-[200px]"
        >
          <ChatPanel
            messages={chatMessages}
            isStreaming={isStreaming}
            onSend={handleSendChat}
            selectedLogs={selectedLogs}
            onRemoveLog={handleRemoveLog}
            onClearSelection={handleClearSelection}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <Toaster />
    </div>
  );
}
