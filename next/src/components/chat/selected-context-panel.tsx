"use client";

import { useState } from "react";
import { LogMessage } from "@/types/log";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Bot, Wrench, X, ChevronDown, ChevronUp, Paperclip } from "lucide-react";

interface SelectedContextPanelProps {
  selectedLogs: LogMessage[];
  onRemoveLog: (id: string) => void;
  onClearAll: () => void;
}

const roleConfig = {
  user: {
    icon: User,
    label: "User",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  assistant: {
    icon: Bot,
    label: "Assistant",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  tool: {
    icon: Wrench,
    label: "Tool",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
};

function truncateContent(content: string, maxLength: number = 60) {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + "...";
}

export function SelectedContextPanel({
  selectedLogs,
  onRemoveLog,
  onClearAll,
}: SelectedContextPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (selectedLogs.length === 0) {
    return null;
  }

  const visibleCount = 3;
  const hasMore = selectedLogs.length > visibleCount;
  const visibleLogs = selectedLogs.slice(0, visibleCount);
  const remainingCount = selectedLogs.length - visibleCount;

  return (
    <div className="relative border-b border-[#222222] bg-[#111111]">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[repeating-linear-gradient(45deg,#555_0,#555_2px,transparent_2px,transparent_4px)]" />
      {/* Horizontal Chips Row */}
      <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mr-2">
          <Paperclip className="h-3.5 w-3.5" />
          <span className="font-medium">Context:</span>
        </div>
        
        {visibleLogs.map((log) => {
          const config = roleConfig[log.role];
          const Icon = config.icon;
          
          return (
            <Badge
              key={log.id}
              variant="outline"
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-xs cursor-default",
                "transition-all duration-200 hover:opacity-80",
                config.color
              )}
            >
              <Icon className="h-3 w-3" />
              <span className="max-w-[120px] truncate">
                {truncateContent(log.content, 25)}
              </span>
              <button
                onClick={() => onRemoveLog(log.id)}
                className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
                title="Remove from context"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}

        {hasMore && (
          <Badge
            variant="outline"
            className="px-2 py-1 text-xs bg-gray-800/50 text-gray-400 border-gray-700 cursor-pointer hover:bg-gray-800"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            +{remainingCount} more
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="ml-auto h-6 px-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800"
        >
          Clear all
        </Button>
      </div>

      {/* Expandable Vertical Panel */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a] rounded-none border-t border-[#222222]"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Show all {selectedLogs.length} selected</span>
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <ScrollArea className="max-h-[300px]">
            <div className="p-3 space-y-2">
              {selectedLogs.map((log, index) => {
                const config = roleConfig[log.role];
                const Icon = config.icon;
                
                return (
                  <div
                    key={log.id}
                    className={cn(
                      "flex items-start gap-2 p-2.5 rounded-lg border",
                      "transition-all duration-200 hover:opacity-90",
                      config.color,
                      "bg-opacity-10"
                    )}
                  >
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium capitalize">
                        {config.label}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                        {log.content}
                      </p>
                      {log.toolName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Tool: {log.toolName}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-gray-500">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => onRemoveLog(log.id)}
                        className="p-1 hover:bg-black/20 rounded transition-colors"
                        title="Remove from context"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
