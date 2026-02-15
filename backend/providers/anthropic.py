import os
from typing import AsyncIterator
import httpx
from .base import BaseLLMProvider

class AnthropicProvider(BaseLLMProvider):
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self.base_url = "https://api.anthropic.com/v1"

    async def stream(self, messages: list[dict], model: str = "claude-3-5-sonnet-20241022") -> AsyncIterator[str]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/messages",
                headers=headers,
                json={
                    "model": model,
                    "messages": messages,
                    "stream": True,
                    "max_tokens": 4096,
                },
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data != "[DONE]":
                            import json
                            chunk = json.loads(data)
                            if event := chunk.get("type"):
                                if event == "content_block_delta":
                                    if delta := chunk.get("delta", {}).get("text_delta"):
                                        yield delta

    def format_message(self, query: str, context: str | None) -> list[dict]:
        messages = []
        if context:
            messages.append({
                "role": "user",
                "content": f"\n\nHuman: You are an AI assistant. Use the following context to answer the user's question.\n\nContext:\n{context}\n\nHuman:"
            })
        messages.append({"role": "user", "content": query})
        return messages

    async def list_models(self) -> list[dict]:
        # If no API key is set, return empty list
        if not getattr(self, "api_key", None):
            return []
        """Fetch list of models from Anthropic API."""
        headers = {"Authorization": f"Bearer {self.api_key}", "anthropic-version": "2023-06-01"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{self.base_url}/models", headers=headers)
            response.raise_for_status()
            data = response.json()
            # Anthropic returns {data: [{id:..., ...}] }? Actually returns {data: [{id:..., name:...}]}
            return data.get("data", [])
