"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, Users, Bot, Wrench, Trash } from "lucide-react";

interface LogFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: "all" | "user" | "assistant" | "tool";
  onRoleFilterChange: (role: "all" | "user" | "assistant" | "tool") => void;
  compactMode: boolean;
  onCompactModeChange: (compact: boolean) => void;
  reverseOrder: boolean;
  onReverseOrderChange: (reverse: boolean) => void;
  selectedCount: number;
  onClearSelection: () => void;
}

export function LogFilters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  compactMode,
  onCompactModeChange,
  reverseOrder,
  onReverseOrderChange,
  selectedCount,
  onClearSelection,
}: LogFiltersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border-b bg-card">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca nei messaggi..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {mounted && (
        <Select
          value={roleFilter}
          onValueChange={(v) => onRoleFilterChange(v as "all" | "user" | "assistant" | "tool")}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filtra ruolo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i ruoli</SelectItem>
            <SelectItem value="user">
              <span className="flex items-center gap-2">
                <Users className="h-3 w-3" /> User
              </span>
            </SelectItem>
            <SelectItem value="assistant">
              <span className="flex items-center gap-2">
                <Bot className="h-3 w-3" /> Assistant
              </span>
            </SelectItem>
            <SelectItem value="tool">
              <span className="flex items-center gap-2">
                <Wrench className="h-3 w-3" /> Tool
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={reverseOrder ? "default" : "outline"}
            size="sm"
            onClick={() => onReverseOrderChange(!reverseOrder)}
            className="gap-1.5 whitespace-nowrap"
          >
            <ArrowUpDown className="h-4 w-4" />
            {reverseOrder ? "Recenti prima" : "Vecchi prima"}
          </Button>

          <div className="flex items-center gap-2 border rounded-md px-3 py-1.5">
            <span className="text-sm whitespace-nowrap">Compatto</span>
            <Switch
              checked={compactMode}
              onCheckedChange={onCompactModeChange}
            />
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {selectedCount} selezionati
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-destructive hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
