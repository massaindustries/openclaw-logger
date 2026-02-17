"use client";

export function ModelSelectorName({
  children,
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span className={"ml-2 font-code " + (className ?? "")} {...props}>
      {children}
    </span>
  );
}
