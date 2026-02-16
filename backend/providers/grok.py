from typing import AsyncIterator
import httpx
from .base import BaseLLMProvider

class GrokProvider(BaseLLMProvider):
    # Hard‑coded model identifiers for XAI Grok.
    # These are used as a fallback when the /v1/models endpoint does not return a usable list.
    # The list reflects the most recent publicly documented Grok models.
    _HARDCODED_MODELS = [
        "grok-4.1-fast-reasoning",
        "grok-4.1-fast-non-reasoning",
        "grok-code-fast-1",
        "grok-4-fast-reasoning",
        "grok-4-fast-non-reasoning",
        "grok-4-0709",
        "grok-3-mini",
        "grok-3",
        "grok-2-vision-1212",
    ]
    def __init__(self):
        self.api_key = None
        self.base_url = "https://api.x.ai/v1"

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
        if not self.api_key:
            return [{"id": m, "name": m} for m in self._HARDCODED_MODELS]
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
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
                        result.append({
                            "id": m.get("id", m.get("name", "")),
                            "name": m.get("name", m.get("id", ""))
                        })
                    else:
                        result.append({"id": str(m), "name": str(m)})
                # If API returned no models, fall back to the hard‑coded list
                if not result:
                    return [{"id": m, "name": m} for m in self._HARDCODED_MODELS]
                return result
        except httpx.HTTPStatusError as e:
            print(f"Grok API error: {e.response.status_code} - {e.response.text}")
            return [{"id": m, "name": m} for m in self._HARDCODED_MODELS]
        except Exception as e:
            print(f"Error fetching Grok models: {e}")
            return [{"id": m, "name": m} for m in self._HARDCODED_MODELS]
