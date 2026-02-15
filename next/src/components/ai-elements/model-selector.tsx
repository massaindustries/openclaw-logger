"use client";

import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";


import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { DialogClose } from "@/components/ui/dialog";
import { ModelSelectorLogo } from "./model-selector-logo";
import { ModelSelectorName } from "./model-selector-name";
// Dynamic model options will be fetched from the backend
import { useLogStore } from "@/store/log-store";

import { fetchModels } from "@/lib/api";
import { useEffect, useState } from "react";

/**
 * Core wrapper for the model selector. It renders a Dialog that contains a
 * cmdk Command palette, populated from {@link MODEL_OPTIONS}. Selecting an
 * item updates the global store and closes the dialog.
 */
export function ModelSelector({ children, ...props }: React.ComponentProps<typeof Dialog>) {
  return <Dialog {...props}>{children}</Dialog>;
}

/** Trigger button – placed in the UI (e.g. next to the chat title) */
export function ModelSelectorTrigger({ children, className, ...props }: React.ComponentProps<typeof DialogTrigger>) {
  // Use a larger default size so the selector is easily visible.
  // Users can still override via `className` prop.
  const defaultClasses = "flex items-center gap-3 rounded px-3 py-2 text-base";
  return (
    <DialogTrigger asChild {...props}>
      <button className={defaultClasses + " " + (className ?? "")}>
        {children}
      </button>
    </DialogTrigger>
  );
}

/** Content of the dialog – the searchable command palette */
export function ModelSelectorContent({ className, ...props }: React.ComponentProps<typeof DialogContent>) {
  const {
    selectedProvider,
    selectedModel,
    setProvider,
    setModel,
    apiKeys,
    openAIBaseUrl,
  } = useLogStore();

  // List of providers we support
  const providers = ["regolo", "openai-compatible", "anthropic", "google", "grok"];

  const [modelOptions, setModelOptions] = useState<Record<string, { id: string; name: string }[]>>({});

  // Load models for each provider on mount or when keys/baseUrl change
  useEffect(() => {
    const load = async () => {
      const newOptions: Record<string, { id: string; name: string }[]> = {};
      for (const p of providers) {
        if (!apiKeys[p]) {
          // No API key configured – no models to load
          newOptions[p] = [];
          continue;
        }
        try {
          const models = await fetchModels(p, apiKeys[p], p === "openai-compatible" ? openAIBaseUrl : undefined);
          // Normalize to id & name (fallback to id if name missing)
newOptions[p] = Array.isArray(models)
            ? models.map((m: { id?: string; name?: string }) => ({
                id: m.id ?? m.name ?? "",
                name: m.name ?? m.id ?? "",
              }))
            : [];
        } catch (e) {
          console.error(`Failed to load models for ${p}`, e);
          newOptions[p] = [];
        }
      }
      setModelOptions(newOptions);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeys, openAIBaseUrl]);

  const handleSelect = (provider: string, modelId: string) => {
    setProvider(provider);
    setModel(modelId);
  };

  return (
    <DialogContent className={`max-w-md font-code ${className ?? ""}`} {...props}>
      <DialogTitle className="sr-only">Select model</DialogTitle>
      <Command>
        <CommandInput placeholder="Search model…" />
          <div className="my-2" />
        <CommandList>
          <CommandEmpty>No model found.</CommandEmpty>
{providers.map((provider) => (
          <Field key={provider} className="mt-2">
            <FieldLabel className="flex items-center gap-2 mb-3">
              {provider.replace(/-compatible$/, "").replace(/^./, (c) => c.toUpperCase())}
              {provider === "regolo" && (
                <Badge
                  variant="ghost"
                  className="text-xs bg-transparent border border-primary text-primary"
                >
                  Recommended
                </Badge>
              )}
            </FieldLabel>

            {/* Warning when API key missing, placed directly under provider label */}
            {!apiKeys[provider] && (
              <FieldDescription className="mt-0 mb-2 text-sm text-gray-600">
                Setup Your {provider.replace(/-compatible$/, "").replace(/^./, (c) => c.toUpperCase())} API Key First.
              </FieldDescription>
            )}

            <CommandGroup>
              {(modelOptions[provider] ?? []).map((m) => (
                <DialogClose asChild key={m.id}>
                  <CommandItem onSelect={() => handleSelect(provider, m.id)}>
                    <ModelSelectorLogo provider={provider} className="size-7" />
                    <ModelSelectorName>{m.name}</ModelSelectorName>
                    {selectedProvider === provider && selectedModel === m.id && (
                      <CommandShortcut>✔</CommandShortcut>
                    )}
                  </CommandItem>
                </DialogClose>
              ))}
            </CommandGroup>
          </Field>
        ))}
        </CommandList>
      </Command>
    </DialogContent>
  );
}


// Re‑export the underlying cmdk components with the requested names
export const ModelSelectorInput = CommandInput;
export const ModelSelectorList = CommandList;
export const ModelSelectorEmpty = CommandEmpty;
export const ModelSelectorGroup = CommandGroup;
export const ModelSelectorItem = CommandItem;
export const ModelSelectorShortcut = CommandShortcut;
export const ModelSelectorSeparator = CommandSeparator;
