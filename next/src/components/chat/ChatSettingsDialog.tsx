"use client";

import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CopyIcon, Eye, EyeOff } from "lucide-react";
import { useLogStore } from "@/store/log-store";

export function ChatSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    setProvider,
    apiKeys,
    setApiKey,
    resetApiKeys,
    openAIBaseUrl,
    setOpenAIBaseUrl,
  } = useLogStore();

  // Manage visibility (show/hide) for each provider's key input
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [useCustomBaseUrl, setUseCustomBaseUrl] = useState(!!openAIBaseUrl);

  const [error, setError] = useState<string>("");

  const providers = [
    { id: "regolo", name: "Regolo", recommended: true },
    { id: "openai-compatible", name: "OpenAI" },
    { id: "anthropic", name: "Anthropic" },
    { id: "google", name: "Google" },
    { id: "grok", name: "Grok" },
  ];



  const handleSave = () => {
    // Keys are saved on change; simply close the dialog
    setError("");
    onOpenChange(false);
  };

  const handleResetAll = () => {
    resetApiKeys();
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-code">
        <DialogHeader>
          <DialogTitle>Chat settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {providers.map((p) => (
            <Field key={p.id} className="mt-2">
                <div className="flex items-center gap-2">
                  <FieldLabel htmlFor={`api-key-${p.id}`}>{p.name} API Key</FieldLabel>
                  {p.recommended && <Badge variant="ghost" className="text-xs bg-transparent border border-primary text-primary">Recommended</Badge>}
                </div>
                <div className="flex items-center space-x-2 mt-1">
{p.id === 'openai-compatible' ? (
  <div className="relative w-10 h-10 overflow-hidden rounded-lg flex items-center justify-center">
    <Image
      src="/loghiprovider/1520649-openai.jpg"
      alt={`${p.name} logo`}
      fill
      className="object-contain"
    />
  </div>
) : (
  <Image
    src={`/loghiprovider/${p.id === 'openai-compatible' ? '1520649-openai.jpg' : p.id === 'anthropic' ? 'anthropic-1.svg' : p.id === 'google' ? 'gemini-color.png' : p.id === 'regolo' ? 'logoregolo.png' : 'images.png'}`}
    alt={`${p.name} logo`}
    width={p.id === 'regolo' ? 28 : 25}
    height={p.id === 'regolo' ? 28 : 25}
  />
)}
                  <Input
                    id={`api-key-${p.id}`}
                    type={showKey[p.id] ? "text" : "password"}
                    placeholder={`${p.name} API key`}
                    value={apiKeys[p.id] ?? ""}
                    className="text-gray-600"
                    onChange={(e) => {
                      setApiKey(p.id, e.target.value);
                      setProvider(p.id);
                      setError("");
                    }}
                  />
                  {/* Copy to clipboard button */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(apiKeys[p.id] ?? "");
                    }}
                  >
                    <CopyIcon className="h-5 w-5" />
                  </Button>
                  {/* Show / hide toggle button */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowKey(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                  >
                    {showKey[p.id] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              <FieldDescription className="text-gray-600">
                Your API key is stored locally in your browser.
              </FieldDescription>
              {p.id === 'openai-compatible' && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="custom-base-url-toggle"
                      checked={useCustomBaseUrl}
                      onCheckedChange={(checked) => {
                        setUseCustomBaseUrl(checked);
                        if (!checked) {
                          setOpenAIBaseUrl('');
                        }
                      }}
                    />
                    <label htmlFor="custom-base-url-toggle" className="text-sm text-gray-600">
                      Custom OpenAI Base URL
                    </label>
                  </div>
                  {useCustomBaseUrl && (
                    <Input
                      placeholder="https://my.custom.openai/v1"
                      value={openAIBaseUrl}
                      onChange={(e) => setOpenAIBaseUrl(e.target.value)}
                      className="mt-1"
                    />
                  )}
                </div>
              )}
            </Field>
          ))}
        </div>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        <DialogFooter className="flex justify-between mt-4">
          <Button variant="outline" onClick={handleResetAll}>
            Reset all
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
