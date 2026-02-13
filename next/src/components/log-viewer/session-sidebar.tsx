"use client";

import { useState } from "react";
import { Session } from "@/types/log";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, FileText, Settings, FolderOpen } from "lucide-react";
import { useLogStore } from "@/store/log-store";

interface SessionSidebarProps {
  sessions: Session[];
  selectedSession: Session | null;
  onSelectSession: (session: Session) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function SessionSidebar({
  sessions,
  selectedSession,
  onSelectSession,
  isLoading,
  onRefresh,
}: SessionSidebarProps) {
  const { customSessionsPath, setCustomSessionsPath, isPathConfigOpen, setPathConfigOpen } = useLogStore();
  const [pathInput, setPathInput] = useState(customSessionsPath || "");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSavePath = () => {
    setCustomSessionsPath(pathInput);
    onRefresh();
    setPathConfigOpen(false);
  };

  const hasSessions = sessions.length > 0;

  return (
    <div className="h-full w-full flex flex-col border-r bg-[#1a1a1a]">
      <div className="p-5 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Sessioni</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPathConfigOpen(!isPathConfigOpen)}
            className={isPathConfigOpen ? "bg-muted" : ""}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isPathConfigOpen && (
          <div className="flex items-center justify-center h-full p-4">
            <div style={{ width: '85%' }}>
              <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Cartella Sessions</CardTitle>
                <CardDescription className="text-xs">
                  Inserisci il percorso della cartella contenente i file .jsonl
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="/percorso/alla/cartella"
                    value={pathInput}
                    onChange={(e) => setPathInput(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleSavePath}
                  disabled={!pathInput.trim()}
                >
                  <FolderOpen className="h-3 w-3 mr-1" />
                  Carica da percorso
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setPathInput("");
                    setCustomSessionsPath("");
                    onRefresh();
                    setPathConfigOpen(false);
                  }}
                >
                  Ripristina percorso default
                </Button>
              </CardContent>
            </Card>
            </div>
          </div>
        )}

        {!hasSessions && !isPathConfigOpen && (
          <div className="flex items-center justify-center h-full p-4">
            <div style={{ width: '85%' }}>
              <Card className="w-full">
              <CardContent className="pt-6 px-4">
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Nessuna sessione trovata
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 bg-[#2c2c2c] hover:bg-[#3a3a3a] text-[#f0f0f0] border-[#555555]"
                    onClick={() => setPathConfigOpen(true)}
                  >
                    <FolderOpen className="h-3 w-3 mr-1" />
                    Configura percorso
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-3">
          {hasSessions ? (
            sessions.map((session) => (
              <Button
                key={session.id}
                variant={selectedSession?.id === session.id ? "secondary" : "ghost"}
                className="w-full justify-start h-auto py-3 px-3 mb-2"
                onClick={() => onSelectSession(session)}
              >
                <div className="flex items-start gap-3 w-full">
                  <FileText className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium truncate">
                      {session.filename}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {session.messageCount} msg
                      </Badge>
                      <span className="text-xs opacity-60">
                        {formatDate(session.modified)}
                      </span>
                    </div>
                  </div>
                </div>
              </Button>
            ))
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
