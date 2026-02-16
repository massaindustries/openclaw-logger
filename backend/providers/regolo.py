from typing import AsyncIterator
import httpx
import logging
import asyncio
from .base import BaseLLMProvider, RateLimitError

logger = logging.getLogger(__name__)


class RegoloProvider(BaseLLMProvider):
    """Provider for the Regolo AI service.

    The Regolo API is OpenAI‑compatible for chat completions, but its
    `list models` endpoint lives at ``https://api.regolo.ai/models``.
    The API key is passed from the frontend via the apiKey parameter.
    """

    def __init__(self) -> None:
        self.api_key = None
        self.base_url = "https://api.regolo.ai"

    async def stream(self, messages: list[dict], model: str = "gpt-oss-120b", max_retries: int = 3) -> AsyncIterator[str]:
        """Stream chat completions from Regolo.

        The endpoint mirrors the OpenAI chat completions endpoint:
        ``POST {base_url}/chat/completions`` with a JSON payload containing
        ``model``, ``messages`` and ``stream=True``.
        """
        logger.info(f"Regolo stream called - model: {model}, base_url: {self.base_url}, has_api_key: {bool(self.api_key)}")
        
        for attempt in range(max_retries):
            try:
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
                        logger.info(f"Regolo response status: {response.status_code}")
                        
                        if response.status_code == 429:
                            retry_after = 1.0
                            if "Retry-After" in response.headers:
                                try:
                                    retry_after = float(response.headers["Retry-After"])
                                except ValueError:
                                    pass
                            logger.warning(f"Regolo rate limited (429), attempt {attempt + 1}/{max_retries}, retry_after: {retry_after}s")
                            if attempt < max_retries - 1:
                                await asyncio.sleep(retry_after)
                                continue
                            else:
                                raise RateLimitError(f"Rate limit exceeded after {max_retries} attempts", retry_after)
                        
                        if response.status_code >= 400:
                            error_text = await response.aread()
                            logger.error(f"Regolo API error: {response.status_code} - {error_text}")
                            raise Exception(f"API error: {response.status_code}")
                        
                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data = line[6:]
                                if data != "[DONE]":
                                    import json
                                    chunk = json.loads(data)
                                    if content := chunk.get("choices", [{}])[0].get("delta", {}).get("content"):
                                        yield content
                        break
            except RateLimitError:
                raise
            except Exception as e:
                logger.error(f"Regolo stream error: {type(e).__name__}: {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)
                    continue
                raise

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
        """Fetch the list of available Regolo models.

        The public Regolo endpoint is ``GET {base_url}/models`` which returns a
        JSON array of model specifications.  Different versions of the API may
        wrap the array in a ``data`` field, so we handle both shapes.
        """
        if not self.api_key:
            return []
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                response.raise_for_status()
                data = response.json()
                # The API may return a raw list or an object with a ``data`` key.
                if isinstance(data, list):
                    return data
                return data.get("data", [])
        except httpx.HTTPStatusError as e:
            print(f"Regolo API error: {e.response.status_code} - {e.response.text}")
            return []
        except Exception as e:
            print(f"Error fetching Regolo models: {e}")
            return []
