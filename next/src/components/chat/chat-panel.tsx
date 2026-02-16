"use client";

import { useEffect, useState } from "react";
import { Settings, Trash2, CopyIcon, ChevronRight, ChevronDown } from "lucide-react";
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
import { Button } from "@/components/ui/button";
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
  MessageAction,
} from "@/components/ai-elements/message";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ChatPanelProps {
  compact?: boolean;
  onToggleCompact?: () => void;
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
  compact,
  onToggleCompact,
}: ChatPanelProps) {
  const handleSubmit = (message: PromptInputMessage) => {
    if (!isStreaming && message.text.trim()) {
      onSend(message.text.trim());
    }
  };
  const { selectedProvider, selectedModel, clearChatMessages } = useLogStore();

  // Ensure client‑only values (from localStorage) are only used after mount to avoid SSR mismatch
  const [isMounted, setIsMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const chatStatus = isStreaming ? "streaming" : "ready";

  const handleClearChat = () => {
    clearChatMessages();
    setShowClearConfirm(false);
  };

  return (
    <div className="chat-panel h-full flex flex-col bg-[#1a1a1a] border-l border-[#222222] min-w-0 overflow-hidden">
      <div className="p-3 h-14 border-b border-[#222222] flex items-center justify-between bg-[#111111] shrink-0">
<div className="flex items-center gap-2">
            {/* Compact Chat Button */}
            {onToggleCompact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCompact}
                title={compact ? "Expand Chat" : "Compact Chat"}
                className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10 shrink-0 mr-2"
              >
                {compact ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            <h2 className="font-semibold text-sm">Chat AI</h2>
            {selectedLogs.length > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {selectedLogs.length} context
              </span>
            )}
          </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              title="Clear chat"
              className="p-1.5 hover:bg-red-900/50 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </button>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            title="Chat settings"
            className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
          >
            <Settings className="h-4 w-4 text-white" />
          </button>
        </div>
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
      "py-2 px-4 rounded-md whitespace-normal w-full",
      msg.role === "user"
        ? "bg-[#2b2b2b] text-white"
        : "bg-[#1a1a1a] text-white"
    )}
>
                     <MessageResponse>{msg.content}</MessageResponse>
{msg.role === "assistant" && (
  <div className="flex gap-2 mt-2">
    <MessageAction
      tooltip="Copy"
      size="icon-sm"
      variant="ghost"
      className="text-gray-500"
      onClick={() => navigator.clipboard.writeText(msg.content)}
    >
      <CopyIcon className="h-4 w-4" />
    </MessageAction>
    <MessageAction
      tooltip="Model"
      size="sm"
      variant="ghost"
      className="text-gray-500"
      onClick={() => {}}
    >
      {selectedModel}
    </MessageAction>
  </div>
)}
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
              className="text-sm focus-visible:border-input"
            />
          </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
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
      
      {/* Clear Chat Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1a1a1a] border border-[#333333] rounded-none p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Clear Chat</h3>
            <p className="text-gray-400 mb-4">
              Are you sure you want to delete all messages in this chat? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

