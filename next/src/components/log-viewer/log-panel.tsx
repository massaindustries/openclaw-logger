"use client";

import { useMemo, useState } from "react";
import { LogMessage } from "@/types/log";
import { LogMessageCard } from "./log-message-card";
import { LogFilters } from "./log-filters";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface LogPanelProps {
  logs: LogMessage[];
  isLoading: boolean;
  selectedContextIds: Set<string>;
  onToggleContext: (id: string) => void;
  onClearSelection: () => void;
}

export function LogPanel({
  logs,
  isLoading,
  selectedContextIds,
  onToggleContext,
  onClearSelection,
}: LogPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "assistant" | "tool">("all");
  const [compactMode, setCompactMode] = useState(false);
  const [reverseOrder, setReverseOrder] = useState(false);

  const resetAllFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setCompactMode(false);
    setReverseOrder(false);
  };

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.content.toLowerCase().includes(query) ||
          log.role.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((log) => log.role === roleFilter);
    }

    if (reverseOrder) {
      result = [...result].reverse();
    }

    return result;
  }, [logs, searchQuery, roleFilter, reverseOrder]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-600">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] overflow-hidden min-w-0">
      <LogFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        compactMode={compactMode}
        onCompactModeChange={setCompactMode}
        reverseOrder={reverseOrder}
        onReverseOrderChange={setReverseOrder}
        selectedCount={selectedContextIds.size}
        onClearSelection={onClearSelection}
        onResetFilters={resetAllFilters}
      />


      <ScrollArea 
        className="flex-1 min-h-0
          [&_[data-radix-scroll-area-viewport]]:max-w-full
          [&_[data-radix-scroll-area-viewport]]:overflow-x-hidden"
      >
        <div className="pl-5 pr-2 space-y-2 min-w-0 max-w-full">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages found
            </div>
          ) : (
            filteredLogs.map((log) => (
              <LogMessageCard
                key={log.id}
                message={log}
                compact={compactMode}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
