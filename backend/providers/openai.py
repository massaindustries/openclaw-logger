from typing import AsyncIterator
import httpx
import logging
import asyncio
import json
import random
from .base import BaseLLMProvider, RateLimitError

logger = logging.getLogger(__name__)
SYSTEM_PROMPT = "You are an AI assistant that analyzes OpenClaw logs. The user will provide logs and a question. Focus on answering their question using the log content."


class OpenAIProvider(BaseLLMProvider):
    def __init__(self):
        self.api_key = None
        self.base_url = "https://api.openai.com/v1"

    def _headers(self) -> dict:
        if not self.api_key:
            return {}
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }

    def _messages_to_responses_input(self, messages: list[dict]) -> list[dict]:
        out: list[dict] = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            out.append(
                {
                    "role": role,
                    "content": [{"type": "input_text", "text": str(content)}],
                }
            )
        return out

    def _retry_after_seconds(self, response: httpx.Response, attempt: int) -> float:
        ra = response.headers.get("Retry-After")
        if ra:
            try:
                return max(0.25, float(ra))
            except ValueError:
                pass
        base = min(8.0, 0.8 * (2 ** attempt))
        jitter = random.uniform(0.0, 0.4)
        return base + jitter

    async def stream(self, messages: list[dict], model: str = "gpt-4o-mini", max_retries: int = 3) -> AsyncIterator[str]:
        logger.info(
            "OpenAI stream called - model=%s base_url=%s has_api_key=%s",
            model,
            self.base_url,
            bool(self.api_key),
        )

        if not self.api_key:
            raise Exception("OpenAI API key missing")

        # Primary strategy: Always try /chat/completions as the main endpoint
        # This is compatible with OpenAI and most OpenAI-compatible providers
        for attempt in range(max_retries):
            chunk_count = 0
            try:
                url = f"{self.base_url}/chat/completions"
                payload = {
                    "model": model,
                    "stream": True,
                    "messages": messages,
                }
                logger.debug("OpenAI payload: %s", payload)
                logger.info("Calling /chat/completions endpoint")

                async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, read=120.0)) as client:
                    async with client.stream(
                        "POST",
                        url,
                        headers=self._headers(),
                        json=payload,
                    ) as response:
                        logger.info("OpenAI response status: %s", response.status_code)

                        if response.status_code == 429:
                            retry_after = self._retry_after_seconds(response, attempt)
                            logger.warning(
                                "OpenAI rate limited (429), attempt %d/%d, retry_after=%.2fs",
                                attempt + 1,
                                max_retries,
                                retry_after,
                            )
                            if attempt < max_retries - 1:
                                await asyncio.sleep(retry_after)
                                continue
                            raise RateLimitError(
                                f"Rate limit exceeded after {max_retries} attempts",
                                retry_after,
                            )

                        if response.status_code >= 400:
                            body = (await response.aread()).decode("utf-8", errors="replace")
                            logger.error("OpenAI API error: %s - %s", response.status_code, body[:2000])
                            raise Exception(f"API error: {response.status_code}")

                        async for line in response.aiter_lines():
                            if not line:
                                continue
                            if not line.startswith("data:"):
                                continue

                            data = line[len("data:"):].strip()
                            if data == "[DONE]":
                                logger.info("OpenAI stream [DONE] received")
                                break

                            try:
                                evt = json.loads(data)
                            except json.JSONDecodeError:
                                logger.warning("Failed to parse OpenAI event: %r", data[:100])
                                continue

                            # Extract content from standard /chat/completions format
                            # Robust extraction that handles missing fields gracefully
                            if content := evt.get("choices", [{}])[0].get("delta", {}).get("content"):
                                chunk_count += 1
                                logger.debug("OpenAI chunk #%d: %s", chunk_count, content[:50] if content else "EMPTY")
                                yield content
                            else:
                                logger.debug("OpenAI event (no content delta): %s", evt.get("choices", [{}])[0].get("delta", {}))

                        logger.info("OpenAI stream finished - total chunks: %d", chunk_count)
                break

            except RateLimitError:
                raise
            except (httpx.ConnectError, httpx.ReadTimeout, httpx.RemoteProtocolError) as e:
                logger.error("OpenAI transport error: %s: %s", type(e).__name__, str(e))
                if attempt < max_retries - 1:
                    backoff = min(8.0, 0.8 * (2 ** attempt)) + random.uniform(0.0, 0.4)
                    await asyncio.sleep(backoff)
                    continue
                raise
            except Exception as e:
                logger.error("OpenAI stream error after %d chunks: %s: %s", chunk_count, type(e).__name__, str(e))
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)
                    continue
                raise

    def format_message(self, query: str, context: str | None) -> list[dict]:
        user_content = query
        if context:
            user_content = f"Here are the OpenClaw logs:\n\n{context}\n\nUser question: {query}"
        return [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]

    async def list_models(self) -> list[dict]:
        """Fetch the list of models from OpenAI-compatible API."""
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
                return data.get("data", [])
        except httpx.HTTPStatusError as e:
            print(f"OpenAI API error: {e.response.status_code} - {e.response.text}")
            return []
        except Exception as e:
            print(f"Error fetching OpenAI models: {e}")
            return []
