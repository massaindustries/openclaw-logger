"use client";

import { useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";
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
  contextSelected?: boolean;
}

export function ChatPanel({
  messages,
  isStreaming,
  onSend,
  contextSelected,
}: ChatPanelProps) {
  const handleSubmit = (message: PromptInputMessage) => {
    if (!isStreaming && message.text.trim()) {
      onSend(message.text.trim());
    }
  };

  const chatStatus = isStreaming ? "streaming" : "ready";

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] border-l">
      <div className="p-5 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Chat AI</h2>
        {contextSelected && (
          <Badge variant="secondary" className="text-xs">
            Contesto selezionato
          </Badge>
        )}
      </div>

      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Nessun messaggio"
              description="Seleziona dei messaggi dai log per usarli come contesto, oppure inizia una conversazione."
              icon={<Bot className="h-12 w-12 opacity-50" />}
            />
          ) : (
            messages.map((msg, index) => (
              <Message key={index} from={msg.role}>
                <MessageContent>
                  <MessageResponse>
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-1 h-3 ml-0.5 bg-current animate-pulse" />
                    )}
                  </MessageResponse>
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-5">
        <PromptInput
          onSubmit={handleSubmit}
          className="mt-4"
          multiple
        >
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Scrivi un messaggio..."
              disabled={isStreaming}
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
            </PromptInputTools>
            <PromptInputSubmit status={chatStatus} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
