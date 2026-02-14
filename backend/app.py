import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from datetime import datetime
from dotenv import load_dotenv

# Carica automaticamente le variabili d'ambiente dal file .env se presente
load_dotenv()
import json
import asyncio
from providers import get_provider

APP_DIR = Path(__file__).resolve().parent
ENV_FILE = APP_DIR / ".env"


def get_env_key(prefix: str) -> str | None:
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if line.startswith(f"{prefix}="):
                return line.split("=", 1)[1].strip().strip('"')
    return os.getenv(prefix, None)


class ChatRequest(BaseModel):
    query: str
    context: str | None = None
    provider: str = "openai-compatible"
    model: str = "gpt-4o"
    apiKey: str | None = None  # optional API key supplied by client
    baseUrl: str | None = None  # optional custom base URL for OpenAI-compatible


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Default sessions directory is located at the repository root 'sessions' folder.
SESSIONS_DIR = Path(__file__).resolve().parents[2] / "sessions"


def count_messages(file_path: Path) -> int:
    count = 0
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = line.split(" ", 1)[1] if line.startswith(" ") else line
                obj = json.loads(data)
                if obj.get("type") == "message":
                    count += 1
            except Exception:
                continue
    return count


@app.get("/api/sessions")
async def list_sessions(path: str | None = None):
    sessions = []
    # Resolve the provided path to an absolute path to ensure it works correctly
    # even if a relative or user-home-relative path is supplied.
    sessions_dir = Path(path).expanduser().resolve() if path else SESSIONS_DIR

    if not sessions_dir.exists():
        return sessions

    json_files = list(sessions_dir.glob("*.json")) + list(sessions_dir.glob("*.jsonl"))

    for f in json_files:
        if f.name == "sessions.json":
            continue
        stat = f.stat()
        message_count = count_messages(f)
        sessions.append({
            "id": f.stem,
            "filename": f.name,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "messageCount": message_count
        })

    sessions.sort(key=lambda x: x["modified"], reverse=True)
    return sessions


@app.get("/api/logs/{session_id}")
async def get_logs(session_id: str, path: str | None = None):
    # Resolve custom path similarly to list_sessions
    sessions_dir = Path(path).expanduser().resolve() if path else SESSIONS_DIR
    
    json_file = sessions_dir / f"{session_id}.json"
    jsonl_file = sessions_dir / f"{session_id}.jsonl"
    
    file_path = json_file if json_file.exists() else jsonl_file

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Session not found")

    messages = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = line.split(" ", 1)[1] if line.startswith(" ") else line
                obj = json.loads(data)

                if obj.get("type") != "message":
                    continue

                role = obj.get("message", {}).get("role", "unknown")
                content_parts = obj.get("message", {}).get("content", [])

                text = ""
                tool_name = None
                tool_result = None

                for part in content_parts:
                    if part.get("type") == "text":
                        text = part.get("text", "")
                    elif part.get("type") == "thinking":
                        text = part.get("thinking", "")
                    elif part.get("type") == "toolResult":
                        tool_name = part.get("source", {}).get("name", "unknown")
                        tool_result = part.get("content", [{}])[-1].get("text", "")

                if role == "toolResult":
                    role = "tool"

                messages.append({
                    "id": obj.get("id"),
                    "role": role,
                    "content": text,
                    "timestamp": obj.get("timestamp"),
                    "toolName": tool_name,
                    "toolResult": tool_result
                })
            except Exception:
                continue

    messages.sort(key=lambda x: x.get("timestamp", ""))
    return messages


@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Instantiate provider; allow custom base URL for OpenAI-compatible
        provider = get_provider(request.provider, request.apiKey)
        # If the request includes a custom base URL and the provider supports it, set it
        if request.provider.lower() in ("openai-compatible", "openai", "regolo") and getattr(request, "baseUrl", None):
            setattr(provider, "base_url", request.baseUrl)
        messages = provider.format_message(request.query, request.context)

        async def generate():
            try:
                async for chunk in provider.stream(messages, request.model):
                    yield {"data": json.dumps({"type": "content", "content": chunk})}
                yield {"data": json.dumps({"type": "done"})}
            except Exception as e:
                yield {"data": json.dumps({"type": "error", "error": str(e)})}

        return EventSourceResponse(generate())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# New endpoint: list models for a given provider
@app.get("/api/models/{provider}")
async def list_models_endpoint(provider: str, apiKey: str | None = None, baseUrl: str | None = None):
    # Get provider instance, overriding API key if supplied
    instance = get_provider(provider, apiKey)
    # Apply custom base URL for OpenAI-compatible if provided
    if provider.lower() in ("openai-compatible", "openai", "regolo") and baseUrl:
        setattr(instance, "base_url", baseUrl)
    # Call provider-specific list_models method
    try:
        models = await instance.list_models()
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
