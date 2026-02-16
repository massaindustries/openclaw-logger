# OpenClaw Logger

**Session Tracker & Analytics Dashboard**

A modern web dashboard to track, monitor, and analyze your OpenClaw AI agent sessions in real-time. Gain full visibility into what your AI agents are doing—all data stays on your machine and is processed locally.

---

## Why OpenClaw Logger?

When running AI agents through OpenClaw, it's easy to lose track of what they're actually doing. Are they stuck in a loop? What tools are they calling? What errors are occurring?

**OpenClaw Logger gives you back control.** It monitors your OpenClaw sessions directory, parses every message, tool call, and response—presenting everything in a clean, searchable dashboard. You'll always know exactly what's happening with your agents.

### Key Benefits

- **Full Transparency** — See every action your agents take in real-time
- **Data Privacy** — All processing happens locally. Your data never leaves your machine
- **Session Analytics** — Parse and analyze agent behavior patterns
- **Debug with AI** — Ask the AI chat about selected log entries to understand what's happening

---

## Quick Start

### 1. Configure Your Sessions Path

Before running the dashboard, you need to tell it where your OpenClaw sessions are stored:

1. **Find your OpenClaw sessions folder:**
   ```
   .openclaw\agents\main\sessions
   ```
   This is the default location inside your OpenClaw installation directory.

2. **Enter the path in the dashboard:**
   - Open the dashboard at `http://localhost:3000`
   - Go to the **Sessions** tab
   - Enter the full path to your sessions folder
   - Click **Save**

The dashboard will now automatically track and parse all your OpenClaw sessions.

### 2. Run with Docker

A Docker Compose configuration is provided to run both the backend and frontend together.

```bash
# Build and start the services
docker compose up --build
```

- Backend API will be available at **http://localhost:8000**
- Frontend dashboard will be available at **http://localhost:3000**

To stop the containers:

```bash
docker compose down
```

If you prefer to run only one component, you can specify the service name:

```bash
# Only the FastAPI backend
docker compose up backend

# Only the Next.js frontend
docker compose up frontend
```

---

## Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# OpenAI Compatible (custom endpoint)
OPENAI_BASE_URL=https://api.openai.com/v1

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-api...

# Google (Gemini)
GOOGLE_API_KEY=AI...

# xAI (Grok)
GROK_API_KEY=xai-...

# Regolo.ai (Recommended - See below)
REGOLO_API_KEY=regolo-...
```

### Supported LLM Providers

This dashboard supports multiple LLM providers:

| Provider | Description |
|----------|-------------|
| **OpenAI** | GPT-4o, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku |
| **Google** | Gemini 2.0, Gemini 1.5 Pro, Gemini 1.5 Flash |
| **Grok** | Grok 2, Grok 2 Vision, Grok Beta |
| **Regolo.ai** | European LLM inference platform |

---

## Why Use Regolo.ai? 🇪🇺

We **strongly recommend** using **Regolo.ai** as your LLM provider for maximum data privacy and European compliance.

### Key Advantages

- **100% European Infrastructure** — All data centers located in Italy (EU). Your data never leaves European jurisdiction
- **Zero Data Retention** — No input/output data is stored. Requests are processed in volatile memory and destroyed immediately after response
- **GDPR Compliant** — Full compliance with EU General Data Protection Regulation (Reg. UE 2016/679)
- **EU AI Act Ready** — Proactively aligned with upcoming EU AI Act requirements
- **No CLOUD Act Exposure** — Your data is protected from US surveillance laws
- **Green Infrastructure** — 100% renewable energy powered data centers
- **Privacy by Design** — Data protection embedded at every stage of service development

### Comparison: Regolo.ai vs US Providers

| Feature | Regolo.ai | Typical US Provider |
|---------|-----------|---------------------|
| Data Location | EU (Italy) | US |
| Data Retention | Zero | 30+ days |
| GDPR Compliance | Full | Limited |
| EU AI Act | Ready | Not applicable |
| CLOUD Act Risk | None | Exposed |

### Other European Alternatives

If you need alternatives to Regolo.ai, consider:

- **Mistral AI** (France) — Open source models with European focus
- **DeepInfra** — Offers EU endpoints for various models
- **Cohere** (with EU deployment options)

However, Regolo.ai remains our top recommendation for its zero-retention policy and complete EU data sovereignty.

---

## Features

### Left Panel — Sessions

- **Session List** — Automatically polls your sessions folder every 5 seconds
- **Live Updates** — New sessions appear instantly
- **Message Count** — Badge showing number of messages per session
- **Click to Load** — Select any session to view its full log

### Center Panel — Log Viewer

- **Hybrid Cards** — Expandable cards for both user and assistant messages
- **Role Filtering** — Filter by User / Assistant / Tool messages
- **Text Search** — Full-text search across all messages
- **Compact Mode** — Toggle for space-efficient view
- **Chronological Order** — Option to invert order (newest first)
- **Context Selection** — Select specific messages to send to AI chat

### Right Panel — AI Chat

- **Real-time Streaming** — SSE-powered streaming responses
- **Provider Selection** — Choose from OpenAI, Anthropic, Google, Grok, or Regolo.ai
- **Model Selection** — Switch between available models per provider
- **Context Aware** — Ask questions about selected log entries
- **Persistent Messages** — Chat history is saved locally

---

## Architecture

```
openclaw-logger/
├── next/                    # Frontend (Next.js 16 + shadcn/ui + Tailwind)
│   ├── src/
│   │   ├── app/            # App Router
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities
│   │   └── store/          # Zustand state management
├── backend/                # Backend (FastAPI + Python)
│   ├── providers/          # LLM provider adapters
│   └── app.py              # API server
```

### Tech Stack

- **Frontend:** Next.js 16, React 19, shadcn/ui, Tailwind CSS, Zustand
- **Backend:** FastAPI, Python 3.10+, Server-Sent Events (SSE)
- **LLM Providers:** OpenAI, Anthropic, Google, xAI (Grok), Regolo.ai

---

## Development

### Frontend Commands

```bash
cd next
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Linting
```

### Backend Commands

```bash
cd backend
uvicorn app:app --reload  # Development server
```

---

## Docker Compose

```bash
# Build and run all services
docker compose -f docker/docker-compose.yml up --build
```

## Security & Privacy

### Your Data Stays Yours

- **Local Processing** — All session files are read from your local filesystem
- **No External Calls** — Session data is never sent to any external service
- **API Keys** — Only used when you explicitly chat with the AI (and only to the LLM provider you choose)
- **No Telemetry** — No usage data is collected or transmitted

### Recommended Security Practices

1. **Use Regolo.ai** for EU-compliant, zero-retention inference
2. **Never commit** your `.env` file to version control
3. **Review your sessions** regularly to understand agent behavior
4. **Rotate API keys** periodically

---

## License

MIT

---

## Resources

- [Regolo.ai — European LLM Inference](https://regolo.ai)
- [Regolo.ai — Zero Data Retention Policy](https://regolo.ai/european-inference/)
- [Regolo.ai — Privacy Policy](https://regolo.ai/privacy-policy/)
- [EU AI Act Information](https://artificialintelligenceact.eu/)
