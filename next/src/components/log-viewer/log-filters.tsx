"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, Users, Bot, Wrench, Trash } from "lucide-react";

interface LogFiltersProps {
  onResetFilters: () => void;
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
  onResetFilters,
}: LogFiltersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
        {/* Fixed header height for central log panel – do not modify */}
        <div className="flex items-center p-3 h-14 border-b border-[#222222] bg-[#111111] min-w-0 shrink-0">
      <div className="relative flex-none w-[200px] min-w-[180px] mb-0 mr-2 hidden sm:flex">
        <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-8"
        />
</div>


      <div className="flex items-center gap-3 flex-nowrap">
        <div className="flex items-center gap-2">
          <Button
            variant={reverseOrder ? "default" : "outline"}
            size="sm"
            onClick={() => onReverseOrderChange(!reverseOrder)}
            className="gap-1.5 whitespace-nowrap hidden md:flex"
          >
            <ArrowUpDown className="h-4 w-4" />
            {reverseOrder ? "Newest first" : "Oldest first"}
          </Button>

          <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 hidden lg:flex">
            <span className="text-sm whitespace-nowrap">Compact</span>
            <Switch
              checked={compactMode}
              onCheckedChange={onCompactModeChange}
            />
          </div>
          <div className="hidden xl:flex"><Select value={roleFilter} onValueChange={onRoleFilterChange}>
            <SelectTrigger className="w-[120px] flex items-center" size="sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="assistant">Assistant</SelectItem>
              <SelectItem value="tool">Tool</SelectItem>
            </SelectContent>
          </Select></div>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 ml-auto hidden 2xl:flex">
<span className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                    <Users className="h-3 w-3" />
                    {selectedCount} selected
                  </span>
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
      <Button
        variant="outline"
        size="sm"
        onClick={onResetFilters}
        className="ml-auto whitespace-nowrap"
      >
        Reset filters
      </Button>
    </div>
    </>
  );
}
