import os
from typing import AsyncIterator
import httpx
from .base import BaseLLMProvider


class RegoloProvider(BaseLLMProvider):
    """Provider for the Regolo AI service.

    The Regolo API is OpenAI‑compatible for chat completions, but its
    `list models` endpoint lives at ``https://api.regolo.ai/models``.
    We read the API key from ``REGULO_API_KEY`` (or ``REGOLO_API_KEY`` for
    backwards compatibility) and allow an optional base URL override via
    ``REGULO_BASE_URL`` – this is useful for testing against a staging server.
    """

    def __init__(self) -> None:
        # Prefer the newer REGULO_API_KEY, fall back to the older REGOLO_API_KEY.
        self.api_key = os.getenv("REGULO_API_KEY") or os.getenv("REGOLO_API_KEY")
        # Default base URL points to the public Regolo API.
        self.base_url = os.getenv("REGULO_BASE_URL", "https://api.regolo.ai")

    async def stream(self, messages: list[dict], model: str = "gpt-oss-120b") -> AsyncIterator[str]:
        """Stream chat completions from Regolo.

        The endpoint mirrors the OpenAI chat completions endpoint:
        ``POST {base_url}/chat/completions`` with a JSON payload containing
        ``model``, ``messages`` and ``stream=True``.
        """
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
        """Create the messages payload for Regolo.

        The format matches the OpenAI‑compatible schema used by the other
        providers – a optional system message for context followed by the user
        prompt.
        """
        messages: list[dict] = []
        if context:
            messages.append({
                "role": "system",
                "content": f"You are an AI assistant. Use the following context to answer the user's question.\n\nContext:\n{context}",
            })
        messages.append({"role": "user", "content": query})
        return messages

    async def list_models(self) -> list[dict]:
        # If no API key is set, return empty list
        if not getattr(self, "api_key", None):
            return []
        """Fetch the list of available Regolo models.

        The public Regolo endpoint is ``GET {base_url}/models`` which returns a
        JSON array of model specifications.  Different versions of the API may
        wrap the array in a ``data`` field, so we handle both shapes.
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{self.base_url}/models", headers={"Authorization": f"Bearer {self.api_key}"})
            response.raise_for_status()
            data = response.json()
            # The API may return a raw list or an object with a ``data`` key.
            if isinstance(data, list):
                return data
            return data.get("data", [])
