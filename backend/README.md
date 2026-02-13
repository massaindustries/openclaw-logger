# Log Viewer Backend

Backend FastAPI per Log Viewer Dashboard.

## Installazione

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oppure
.\venv\Scripts\activate   # Windows

pip install -r requirements.txt
```

## Variabili d'ambiente

Crea un file `.env` con le chiavi API dei provider che vuoi usare:

```env
# OpenAI (default)
OPENAI_API_KEY=sk-...

# OpenAI Compatible (es. Azure, local, etc.)
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api...

# Google
GOOGLE_API_KEY=AI...

# xAI Grok
GROK_API_KEY=xai-...
GROK_BASE_URL=https://api.x.ai/v1
```

## Avvio

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

- `GET /api/sessions` - Lista sessioni
- `GET /api/logs/{session_id}` - Log di una sessione
- `POST /api/chat` - Chat streaming SSE

## Chat Streaming

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Analizza i log",
    "context": "[USER]: Ciao\n[ASSISTANT]: Ciao!",
    "provider": "openai-compatible",
    "model": "gpt-4o"
  }'
```
