"use client";

import { useState, useEffect } from "react";
import { LogMessage } from "@/types/log";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, User, Bot, Wrench, PlayIcon, CopyIcon, RefreshCwIcon, DownloadIcon, ShareIcon } from "lucide-react";
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactDescription, ArtifactActions, ArtifactAction, ArtifactContent } from "@/components/ai-elements/artifact";
import { isProbablyMarkdown } from "@/lib/markdown-utils";
import { ArtifactMarkdown } from "@/components/ai-elements/artifact-markdown";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { useLogStore } from "@/store/log-store";

interface LogMessageCardProps {
  message: LogMessage;
  compact?: boolean;
}

const roleConfig = {
  user: {
    icon: User,
    badgeVariant: "default" as const,
    badgeClass: "bg-primary hover:bg-primary",
  },
  assistant: {
    icon: Bot,
    badgeVariant: "secondary" as const,
    badgeClass: "bg-[#5a00d6] hover:bg-[#5a00d6]",
  },
  tool: {
    icon: Wrench,
    badgeVariant: "outline" as const,
    badgeClass: "border-purple-500 text-purple-600 bg-transparent",
  },
};

export function LogMessageCard({ message, compact = false }: LogMessageCardProps) {
  const [isOpen, setIsOpen] = useState(!compact);
  const [copied, setCopied] = useState(false);

  // Sync open state with compact prop changes
  useEffect(() => {
    setIsOpen(!compact);
  }, [compact]);
  const { selectedContextIds, toggleContextSelection } = useLogStore();

  const isSelected = selectedContextIds.has(message.id);
  const config = roleConfig[message.role];
  const Icon = config.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };



  // ----- Action handlers for tool artifact -----
  const handleRun = () => {
    console.log("Run tool output:", message.content);
  };

  const handleRegenerate = () => {
    console.log("Regenerate requested for:", message.toolName);
  };

  const handleDownload = () => {
    const blob = new Blob([message.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${message.toolName ?? "artifact"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: message.toolName ?? "Artifact",
        text: message.content,
      });
    } else {
      console.warn("Web Share API not supported");
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
"message-debug rounded-r-lg border-gray-600 min-w-0 overflow-hidden mb-8",
          message.role === "user" && [
            "bg-[var(--log-user-bg)] border-primary dark:border-primary border-l-primary border-l-4",
            "text-[var(--log-user-text)]",
          ],
          message.role === "assistant" && [
            "bg-[var(--log-assistant-bg)] border-gray-600 dark:border-gray-800 border-l-4 border-l-[#5a00d6] dark:border-l-[#5a00d6]",
            "text-[var(--log-assistant-text)]",
          ],
          message.role === "tool" && [
            "bg-[var(--log-tool-bg)] border-purple-600 dark:border-purple-800 border-l-purple-600",
            "text-[var(--log-tool-text)]",
          ]
        )}
        style={{ 
          maxWidth: "95%", 
          width: "fit-content",
          alignSelf: message.role === "user" ? "flex-end" : "flex-start"
        }}
        data-role={message.role}
      >
        <div className={cn("flex items-center gap-2 p-3 min-w-0")}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost" size="sm" className={cn("h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10 shrink-0")}>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <Badge
            variant={config.badgeVariant}
            className={cn("gap-1 shrink-0", config.badgeClass)}
          >
            <Icon className="h-3 w-3" />
            <span className="capitalize font-code">{message.role}</span>
          </Badge>

          <span className={cn("text-xs opacity-70 shrink-0")}>
            {formatTimestamp(message.timestamp)}
          </span>

<Checkbox
              id={`select-${message.id}`}
              checked={isSelected}
              onCheckedChange={() => toggleContextSelection(message.id)}
              className="ml-auto h-4 w-4 border-current shrink-0"
            />
        </div>

        <CollapsibleContent className="min-w-0 max-w-full">
          <div className={cn("p-3 space-y-2 min-w-0 max-w-full [overflow-wrap:anywhere]")}>
            <Artifact className="max-w-full">
              <ArtifactHeader className="flex items-center justify-between min-w-0">
                <div className="min-w-0">
                  <ArtifactTitle className="truncate">
                    {message.role === "tool"
                      ? (message.toolName ?? "Tool Output")
                      : message.role.charAt(0).toUpperCase() + message.role.slice(1)}
                  </ArtifactTitle>
                  <ArtifactDescription>
                    Updated {new Date(message.timestamp).toLocaleTimeString()}
                  </ArtifactDescription>
                </div>
                <ArtifactActions className="flex items-center gap-2 shrink-0">
                  {message.role === "tool" ? (
                    <>
                      <ArtifactAction
                        icon={PlayIcon}
                        label="Run"
                        tooltip="Run code"
                        onClick={handleRun}
                      />
                      <ArtifactAction
                        icon={CopyIcon}
                        label="Copy"
                        tooltip="Copy to clipboard"
                        onClick={handleCopy}
                      />
                      <ArtifactAction
                        icon={RefreshCwIcon}
                        label="Regenerate"
                        tooltip="Regenerate content"
                        onClick={handleRegenerate}
                      />
                      <ArtifactAction
                        icon={DownloadIcon}
                        label="Download"
                        tooltip="Download file"
                        onClick={handleDownload}
                      />
                      <ArtifactAction
                        icon={ShareIcon}
                        label="Share"
                        tooltip="Share artifact"
                        onClick={handleShare}
                      />
                    </>
                  ) : (
                    <ArtifactAction
                      icon={CopyIcon}
                      label="Copy"
                      tooltip="Copy to clipboard"
                      onClick={handleCopy}
                    />
                  )}
                </ArtifactActions>
              </ArtifactHeader>
              <ArtifactContent className="p-0 min-w-0 max-w-full">
                {message.role === "tool" && isProbablyMarkdown(message.content) ? (
                  <ArtifactMarkdown>{message.content}</ArtifactMarkdown>
                ) : (
                  <CodeBlock
                    className="border-none min-w-0 max-w-full [&_pre]:whitespace-pre-wrap [&_pre]:break-all"
                    code={message.content}
                    language={"text" as any}
                    showLineNumbers
                  />
                )}
                {message.thinking && (
                  <div className="mt-2 p-2 rounded bg-black/5 dark:bg-white/5 text-xs italic">
                    💭 {message.thinking}
                  </div>
                )}
              </ArtifactContent>
            </Artifact>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
