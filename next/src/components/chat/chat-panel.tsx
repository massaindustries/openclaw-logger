"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { ChatSettingsDialog } from "./ChatSettingsDialog";
import { LogMessage } from "@/types/log";
// Bot icon removed – using custom agent image
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
// import { Button } from "@/components/ui/button"; // Removed unused Button import
import { cn } from "@/lib/utils";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
} from "@/components/ai-elements/model-selector";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector-logo";
import { useLogStore } from "@/store/log-store";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSend: (message: string) => void;
  selectedLogs: LogMessage[];
  onRemoveLog: (id: string) => void;
  onClearSelection: () => void;
}

export function ChatPanel({
  messages,
  isStreaming,
  onSend,
  selectedLogs,
  onRemoveLog,
  onClearSelection,
}: ChatPanelProps) {
  const handleSubmit = (message: PromptInputMessage) => {
    if (!isStreaming && message.text.trim()) {
      onSend(message.text.trim());
    }
  };
  const { selectedProvider, selectedModel } = useLogStore();

  // Ensure client‑only values (from localStorage) are only used after mount to avoid SSR mismatch
  const [isMounted, setIsMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const chatStatus = isStreaming ? "streaming" : "ready";

  return (
    <div className="chat-panel h-full flex flex-col bg-[#1a1a1a] border-l border-[#222222] min-w-0 overflow-hidden">
      <div className="p-4 border-b border-[#222222] flex items-center justify-between bg-[#111111] shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Chat AI</h2>
          {selectedLogs.length > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              {selectedLogs.length} context
            </span>
          )}
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          title="Chat settings"
          className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
        >
          <Settings className="h-4 w-4 text-white" />
        </button>
      </div>

      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="No messages"
              description="Select messages from the logs to use as context, or start a conversation."
              icon={<img src="/logos/lobster.png" className="h-20 w-20" alt="Agent" />}
            />
          ) : (
            messages.map((msg, index) => (
              <Message key={index} from={msg.role} className={index === 0 ? "mt-2" : undefined}>
                <MessageContent>
<div
   className={cn(
     "py-0.5 px-2 rounded-md whitespace-normal",
     msg.role === "user"
       ? "bg-[#2b2b2b] text-white"
       : "bg-[#1a1a1a] text-white"
   )}
>
                     <MessageResponse>{msg.content}</MessageResponse>
                   </div>
                  {msg.isStreaming && (
                    <span className="inline-block w-1 h-3 ml-0.5 bg-current animate-pulse" />
                  )}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-transparent pt-2 pb-5 px-5">
<PromptInput
            onSubmit={handleSubmit}
            className="mt-0"
            multiple
            selectedLogs={selectedLogs}
            onRemoveLog={onRemoveLog}
            onClearSelection={onClearSelection}
          >
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Type a message..."
              disabled={isStreaming}
              className="text-sm"
            />
          </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                {/* Model selector placed inside the chat input area */}
                {isMounted && (
                  <ModelSelector>
                    <ModelSelectorTrigger>
                      <ModelSelectorLogo provider={selectedProvider} className="size-5" />
                      <span className="text-sm font-code">{selectedModel}</span>
                    </ModelSelectorTrigger>
                    <ModelSelectorContent />
                  </ModelSelector>
                )}
              </PromptInputTools>
              <PromptInputSubmit status={chatStatus} />
            </PromptInputFooter>
        </PromptInput>
      </div>
      <ChatSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

