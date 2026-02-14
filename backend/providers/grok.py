import os
from typing import AsyncIterator
import httpx
from .base import BaseLLMProvider

class GrokProvider(BaseLLMProvider):
    def __init__(self):
        self.api_key = os.getenv("GROK_API_KEY")
        self.base_url = os.getenv("GROK_BASE_URL", "https://api.x.ai/v1")

    async def stream(self, messages: list[dict], model: str = "grok-beta") -> AsyncIterator[str]:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": model,
                    "messages": messages,
                    "stream": True,
                },
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data != "[DONE]":
                            import json
                            chunk = json.loads(data)
                            if content := chunk.get("choices", [{}])[0].get("delta", {}).get("content"):
                                yield content

    def format_message(self, query: str, context: str | None) -> list[dict]:
        messages = []
        if context:
            messages.append({
                "role": "system",
                "content": f"You are Grok, an AI assistant. Use the following context to answer the user's question.\n\nContext:\n{context}"
            })
        messages.append({"role": "user", "content": query})
        return messages

    async def list_models(self) -> list[dict]:
        """Fetch list of Grok models via the /models endpoint."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{self.base_url}/models", headers={"Authorization": f"Bearer {self.api_key}"})
            response.raise_for_status()
            data = response.json()
            # Expecting a list under "data" or "models"
            if isinstance(data, dict):
                models = data.get("data") or data.get("models") or []
            else:
                models = []
            # Normalize to list of dicts with id and name
            result = []
            for m in models:
                if isinstance(m, dict):
                    result.append({"id": m.get("id", m.get("name", "")), "name": m.get("name", m.get("id", ""))})
                else:
                    # If it's a string
                    result.append({"id": str(m), "name": str(m)})
            return result
