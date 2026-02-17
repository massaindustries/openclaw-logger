"use client";

import { useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
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
  const [compactSessions, setCompactSessions] = useState(false);
  const [compactChat, setCompactChat] = useState(false);
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
    updateLastAssistantMessage,
    setLoading,
    selectedProvider,
    selectedModel,
    apiKeys,
    openAIBaseUrl,
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
        { 
          query: message, 
          context: context || undefined, 
          provider: selectedProvider, 
          model: selectedModel,
          apiKey: apiKeys[selectedProvider] || undefined,
          baseUrl: openAIBaseUrl || undefined,
        },
          (event) => {
            if (event.type === "content") {
              // Get the latest chat messages from the store to avoid stale closure
              const currentMessages = useLogStore.getState().chatMessages;
              const lastMsg = currentMessages[currentMessages.length - 1];
              if (lastMsg && lastMsg.role === "assistant") {
                // Update existing assistant message (will also persist)
                updateLastAssistantMessage(event.content);
              } else {
                // No assistant message yet, add a new one (will also persist)
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
          {/* Sessions sidebar */}
          {!compactSessions ? (
            <>
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
                  compact={compactSessions}
                  onToggleCompact={() => setCompactSessions(!compactSessions)}
                />
              </ResizablePanel>

              <ResizableHandle
                id="handle-1"
                withHandle
                className="resizable-handle w-3 hover:w-4 transition-all border-r border-[#222222]"
              />
            </>
          ) : (
            // Compact sidebar with only expand button
<ResizablePanel
              id="sidebar-compact"
              defaultSize={2}
              minSize={2}
              className="relative flex flex-col bg-[#1a1a1a]"
            >
{/* Header */}
<div className="p-3 h-14 border-b border-[#222222] bg-[#111111] shrink-0" />
{/* Diagonal strip on right edge - below header */}
<div className="absolute right-0 top-14 h-[calc(100%-3.5rem)] w-3 bg-[repeating-linear-gradient(45deg,rgba(34,34,34,0.5)_0,rgba(34,34,34,0.5)_1px,transparent_1px,transparent_5px)]" />
              <div className="flex-1 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompactSessions(false)}
                  title="Expand Sessions"
                  className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            </ResizablePanel>
          )}

          {/* Log panel – always visible */}
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

          {/* Chat panel */}
          {!compactChat ? (
            <>
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
                  compact={compactChat}
                  onToggleCompact={() => setCompactChat(!compactChat)}
                />
              </ResizablePanel>
            </>
          ) : (
            // Compact chat panel with only expand button
            <ResizablePanel
              id="chat-compact"
              defaultSize={2}
              minSize={2}
              className="relative flex flex-col bg-[#1a1a1a]"
            >
{/* Header */}
<div className="p-3 h-14 border-b border-[#222222] bg-[#111111] shrink-0" />
{/* Diagonal strip on left edge - below header */}
<div className="absolute left-0 top-14 h-[calc(100%-3.5rem)] w-3 bg-[repeating-linear-gradient(45deg,rgba(34,34,34,0.5)_0,rgba(34,34,34,0.5)_1px,transparent_1px,transparent_5px)]" />
              <div className="flex-1 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompactChat(false)}
                  title="Expand Chat"
                  className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>

      <Toaster />
    </div>
  );
}
