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
"relative flex w-0.5 items-center justify-center bg-[repeating-linear-gradient(45deg,rgba(34,34,34,0.5)_0,rgba(34,34,34,0.5)_1px,transparent_1px,transparent_5px)]",
          "data-[orientation=vertical]:h-3 data-[orientation=vertical]:w-full data-[orientation=vertical]:flex-col",
          "data-[orientation=horizontal]:h-full data-[orientation=horizontal]:w-0.5",
          "cursor-col-resize select-none touch-none",
          "hover:bg-primary/50 data-[separator=active]:bg-primary transition-colors",
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
