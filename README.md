# Log Viewer Dashboard

Modern web dashboard per visualizzare e analizzare sessioni AI con streaming in tempo reale.

## Stack Tecnologico

- **Frontend**: Next.js 16 + shadcn/ui + Tailwind CSS
- **Backend**: FastAPI + Python
- **Chat Streaming**: SSE (Server-Sent Events)
- **Multi-Provider**: OpenAI, Anthropic, Google, Grok

## Struttura

```
log-viewer/
├── next/               # Frontend Next.js
│   ├── src/
│   │   ├── app/        # App Router
│   │   ├── components/ # Componenti React
│   │   ├── lib/        # Utility
│   │   └── store/      # Zustand state
├── backend/           # Backend FastAPI
│   ├── providers/      # Adattatori LLM
│   └── app.py         # API server
```

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Configura le API keys nel file .env
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend

```bash
cd next
npm install
npm run dev
```

Apri http://localhost:3000

## Configurazione Provider LLM

Crea `.env` nella cartella `backend/`:

```env
# OpenAI (default)
OPENAI_API_KEY=sk-...

# OpenAI Compatible
OPENAI_BASE_URL=https://api.openai.com/v1

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api...

# Google
GOOGLE_API_KEY=AI...

# xAI Grok
GROK_API_KEY=xai-...
```

## Funzionalità

### Pannello Sinistro - Sessioni
- Lista sessioni con polling automatico (5s)
- Click per caricare i log
- Badge con conteggio messaggi

### Pannello Centrale - Log
- Card ibride espandibili (click sulla freccia)
- Filtri per ruolo (User/Assistant/Tool)
- Ricerca testuale
- Modalità compatta
- Inverti ordine cronologico
- Seleziona messaggi per contesto

### Pannello Destro - Chat AI
- Streaming SSE in tempo reale
- Seleziona provider e modello
- Contesto dai log selezionati
- Messaggi persistenti

## Sviluppo

```bash
# Frontend
cd next
npm run dev      # Development
npm run build    # Production build
npm run lint     # Linting

# Backend
cd backend
uvicorn app:app --reload
```

## License

MIT
