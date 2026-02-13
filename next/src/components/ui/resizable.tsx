"use client";

import { GripVerticalIcon } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  );
}

function ResizablePanel({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      className={cn(
        "flex flex-col h-full min-h-0",
        className
      )}
      {...props}
    />
  );
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-2 items-center justify-center bg-border",
        "data-[orientation=vertical]:h-2 data-[orientation=vertical]:w-full data-[orientation=vertical]:flex-col",
        "data-[orientation=horizontal]:h-full data-[orientation=horizontal]:w-1",
        "cursor-col-resize select-none touch-none",
        "hover:bg-primary/50 data-[resize-handle-active=true]:bg-primary transition-colors",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="flex items-center justify-center">
          <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </ResizablePrimitive.Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
