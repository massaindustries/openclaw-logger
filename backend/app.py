import os
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from datetime import datetime
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Carica automaticamente le variabili d'ambiente dal file .env se presente
load_dotenv()
import json
import asyncio
from providers import get_provider
from providers.base import RateLimitError

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
# In Docker, use /app/sessions; otherwise use the repository root.
_sessions_dir_env = os.getenv("SESSIONS_DIR")
if _sessions_dir_env:
    SESSIONS_DIR = Path(_sessions_dir_env)
else:
    # When running locally (not in Docker), go up 2 levels from backend/app.py
    try:
        SESSIONS_DIR = Path(__file__).resolve().parents[2] / "sessions"
    except IndexError:
        # Fallback if path structure is different
        SESSIONS_DIR = Path("sessions").resolve()


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
    logger.info(
        "Chat request received - provider=%s model=%s has_api_key=%s has_baseUrl=%s",
        request.provider, request.model, bool(request.apiKey), bool(request.baseUrl)
    )

    try:
        provider = get_provider(request.provider, request.apiKey)

        if request.provider.lower() in ("openai-compatible", "openai", "regolo") and request.baseUrl:
            setattr(provider, "base_url", request.baseUrl)
            logger.info("Set custom base_url: %s", request.baseUrl)

        messages = provider.format_message(request.query, request.context)
        logger.info("Formatted messages: %s", messages)

        async def generate():
            chunk_count = 0
            try:
                logger.info("Starting stream for model: %s", request.model)
                async for chunk in provider.stream(messages, request.model):
                    chunk_count += 1
                    logger.info("Chunk #%d received, length: %d", chunk_count, len(chunk) if chunk else 0)
                    yield {
                        "event": "content",
                        "data": json.dumps({"type": "content", "content": chunk}),
                    }

                logger.info("Stream finished - total chunks received: %d", chunk_count)
                yield {
                    "event": "done",
                    "data": json.dumps({"type": "done"}),
                }

            except RateLimitError as e:
                logger.warning("RateLimitError in stream: %s, retry_after: %s", str(e), getattr(e, "retry_after", "N/A"))
                retry_after = getattr(e, "retry_after", 1.0)
                yield {
                    "event": "error",
                    "retry": int(max(1.0, retry_after) * 1000),
                    "data": json.dumps({
                        "type": "error",
                        "error": "Rate limit reached - please wait a moment and try again.",
                        "retryAfter": retry_after,
                    }),
                }

            except Exception as e:
                logger.exception("Stream error after %d chunks: %s", chunk_count, str(e))
                yield {
                    "event": "error",
                    "data": json.dumps({"type": "error", "error": str(e)}),
                }

        return EventSourceResponse(generate(), ping=15)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Exception in chat")
        raise HTTPException(status_code=500, detail=str(e))

# Non‑streaming endpoint
@app.post("/api/chat_sync")
async def chat_sync(request: ChatRequest):
    """Non‑streaming chat: return the full response in a single JSON payload.
    This is useful for debugging or for clients that cannot handle SSE.
    """
    logger.info(f"Sync chat request received - provider: {request.provider}, model: {request.model}, has_api_key: {bool(request.apiKey)}, has_baseUrl: {bool(request.baseUrl)}")
    try:
        provider = get_provider(request.provider, request.apiKey)
        if request.provider.lower() in ("openai-compatible", "openai", "regolo") and getattr(request, "baseUrl", None):
            setattr(provider, "base_url", request.baseUrl)
            logger.info(f"Set custom base_url: {request.baseUrl}")
        messages = provider.format_message(request.query, request.context)
        logger.info(f"Formatted messages for sync: {messages}")
        # Gather all streamed chunks into one string
        full_content = ""
        async for chunk in provider.stream(messages, request.model):
            full_content += chunk
        return {"response": full_content}
    except ValueError as e:
        logger.error(f"ValueError in sync chat: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Exception in sync chat: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# New endpoint: list models for a given provider
@app.get("/api/models/{provider}")
async def list_models_endpoint(provider: str, apiKey: str | None = None, baseUrl: str | None = None):
    # Validate API key - must be non-empty and not just whitespace
    if not apiKey or not apiKey.strip():
        return []
    
    # Get provider instance, overriding API key if supplied
    instance = get_provider(provider, apiKey.strip())
    
    # Apply custom base URL for OpenAI-compatible if provided
    if provider.lower() in ("openai-compatible", "openai", "regolo") and baseUrl:
        setattr(instance, "base_url", baseUrl)

    # If the provider does not have an API key configured, return an empty list
    if not getattr(instance, "api_key", None):
        return []

    # Call provider-specific list_models method
    try:
        models = await instance.list_models()
        # Filter out unwanted models
        exclude = ["deppseek ocr", "faster whisper", "gte qwen2", "qwen image", "qwen embedding 8b", "qwen3 embedding", "qwen3 embed", "qwen3-embedding-8b", "embedding", "image", "audio", "video", "tts", "stt", "speech", "whisper", "ocr", "dall-e", "dall e", "dalle", "stable diffusion", "midjourney", "glide", "text to speech", "speech to text", "vision", "veo", "sora", "computer use", "computer-use", "computer_use", "davinci", "babbage", "aqa", "transcribe", "banana", "robotics", "realtime", "real-time"]
        def normalize(s: str) -> str:
            return s.lower().replace("-", " ").replace("_", " ")
        filtered = []
        for m in models:
            combined = f"{m.get('id','')} {m.get('name','')}"
            norm = normalize(combined)
            if any(term in norm for term in exclude):
                continue
            filtered.append(m)
        return filtered
    except Exception as e:
        # Log the error but return empty list instead of 500
        print(f"Error fetching models for {provider}: {e}")
        return []


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
