"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// Container for a form field (label, input, description)
function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("flex flex-col space-y-1.5", className)}
      {...props}
    />
  );
}

function FieldLabel({ htmlFor, className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      htmlFor={htmlFor}
      data-slot="field-label"
      className={cn("text-sm font-bold text-foreground", className)}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-sm text-foreground", className)}
      {...props}
    />
  );
}

export { Field, FieldLabel, FieldDescription };
