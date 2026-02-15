"use client";

import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { cn } from "@/lib/utils";

type ArtifactMarkdownProps = {
  className?: string;
  children: string;
};

/**
 * Renders markdown content (including code fences, math, mermaid diagrams, etc.)
 * using the same Streamdown pipeline that MessageResponse uses.
 */
export const ArtifactMarkdown = ({ className, children }: ArtifactMarkdownProps) => {
  const plugins = { cjk, code, math, mermaid };
  return (
    <Streamdown
      className={cn("size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}
      plugins={plugins}
    >
      {children}
    </Streamdown>
  );
};
