"use client";

import { useState } from "react";
import { LogMessage } from "@/types/log";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Copy, User, Bot, Wrench } from "lucide-react";
import { useLogStore } from "@/store/log-store";

interface LogMessageCardProps {
  message: LogMessage;
  compact?: boolean;
}

const roleConfig = {
  user: {
    icon: User,
    badgeVariant: "default" as const,
    badgeClass: "bg-orange-500 hover:bg-orange-600",
  },
  assistant: {
    icon: Bot,
    badgeVariant: "secondary" as const,
    badgeClass: "bg-gray-400 hover:bg-gray-500",
  },
  tool: {
    icon: Wrench,
    badgeVariant: "outline" as const,
    badgeClass: "border-purple-500 text-purple-600 bg-purple-100",
  },
};

export function LogMessageCard({ message, compact = false }: LogMessageCardProps) {
  const [isOpen, setIsOpen] = useState(!compact);
  const [copied, setCopied] = useState(false);
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
    return date.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "rounded-lg border transition-all duration-200",
          "hover:shadow-lg hover:border-l-4",
          message.role === "user" && [
            "bg-[var(--log-user-bg)] border-orange-200 dark:border-orange-800 border-l-orange-400",
            "text-[var(--log-user-text)]",
          ],
          message.role === "assistant" && [
            "bg-[var(--log-assistant-bg)] border-gray-200 dark:border-gray-700 border-l-gray-400",
            "text-[var(--log-assistant-text)]",
          ],
          message.role === "tool" && [
            "bg-[var(--log-tool-bg)] border-purple-200 dark:border-purple-700 border-l-purple-400",
            "text-[var(--log-tool-text)]",
          ]
        )}
      >
        <div className={cn("flex items-center gap-2 p-3 border-b border-black/5 dark:border-white/10", message.role === "user" ? "flex-row-reverse" : "flex-row")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <Badge
            variant={config.badgeVariant}
            className={cn("gap-1", config.badgeClass)}
          >
            <Icon className="h-3 w-3" />
            <span className="capitalize">{message.role}</span>
          </Badge>

          <span className={cn("text-xs opacity-70", message.role === "user" ? "ml-auto" : "mr-auto")}>
            {formatTimestamp(message.timestamp)}
          </span>

          <Checkbox
            id={`select-${message.id}`}
            checked={isSelected}
            onCheckedChange={() => toggleContextSelection(message.id)}
            className="h-4 w-4 border-current"
          />
        </div>

        <CollapsibleContent>
          <div className={cn("p-3 space-y-2", message.role === "user" ? "mr-4" : "ml-4")}>
            {message.toolName && (
              <div className="text-xs font-medium opacity-70">
                Tool: {message.toolName}
              </div>
            )}

            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>

            {message.thinking && (
              <div className="mt-2 p-2 rounded bg-black/5 dark:bg-white/5 text-xs italic">
                💭 {message.thinking}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1 text-xs"
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copiato!" : "Copia"}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
