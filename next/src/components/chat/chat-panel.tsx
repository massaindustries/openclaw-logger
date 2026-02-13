"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="p-5 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Seleziona dei messaggi dai log per usarli come contesto.</p>
              <p className="text-sm mt-2">Inizia una conversazione qui.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-4",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 border-l-4 shadow-md",
                    msg.role === "user"
                      ? "bg-[--log-user-bg] text-[--log-user-text] border-orange-400"
                      : "bg-[--log-assistant-bg] text-[--log-assistant-text] border-gray-400"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === "user" ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                    <span className="text-xs font-medium capitalize">
                      {msg.role}
                    </span>
                    {msg.isStreaming && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-1 h-3 ml-0.5 bg-current animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

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
