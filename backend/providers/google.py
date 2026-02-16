from typing import AsyncIterator
import httpx
from .base import BaseLLMProvider

class GoogleProvider(BaseLLMProvider):
    def __init__(self):
        self.api_key = None
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def stream(self, messages: list[dict], model: str = "gemini-1.5-pro") -> AsyncIterator[str]:
        last_content = ""
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/models/{model}:streamGenerateContent",
                params={"key": self.api_key},
                json={"contents": messages, "generationConfig": {"stream": True}},
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        import json
                        try:
                            chunk = json.loads(data)
                            if candidates := chunk.get("candidates", []):
                                content = candidates[0].get("content", {}).get("parts", [])
                                for part in content:
                                    if text := part.get("text"):
                                        new_text = text[len(last_content):]
                                        if new_text:
                                            yield new_text
                                            last_content = text
                        except json.JSONDecodeError:
                            pass

    def format_message(self, query: str, context: str | None) -> list[dict]:
        parts = []
        if context:
            parts.append({"text": f"You are an AI assistant. Use the following context to answer the user's question.\n\nContext:\n{context}"})
        parts.append({"text": query})
        return [{"role": "user", "parts": parts}]

    async def list_models(self) -> list[dict]:
        """List available Gemini models."""
        if not self.api_key:
            return []
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/models",
                    params={"key": self.api_key}
                )
                response.raise_for_status()
                data = response.json()
                return [{"id": m.get("name", ""), "name": m.get("name", "")} for m in data.get("models", [])]
        except httpx.HTTPStatusError as e:
            print(f"Google API error: {e.response.status_code} - {e.response.text}")
            return []
        except Exception as e:
            print(f"Error fetching Google models: {e}")
            return []
