import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from datetime import datetime
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
    model: str = "Llama-3.3-70B-Instruct"


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSIONS_DIR = Path(__file__).parent.parent / "agents" / "main" / "sessions"


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
    sessions_dir = Path(path) if path else SESSIONS_DIR

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
    sessions_dir = Path(path) if path else SESSIONS_DIR
    
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
        provider = get_provider(request.provider)
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
