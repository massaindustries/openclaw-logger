// Model options for the Model Selector component
// Each provider groups an array of models (id is the value sent to the backend)

export const MODEL_OPTIONS = [
  {
    provider: "openai-compatible",
    models: [
      { id: "gpt-oss-120b", name: "GPT‑OSS 120B" },
      { id: "gpt-oss-20b", name: "GPT‑OSS 20B" },
    ],
  },
  {
    provider: "mistral",
    models: [
      { id: "mistral-small3.2", name: "Mistral Small 3.2" },
    ],
  },
] as const;
