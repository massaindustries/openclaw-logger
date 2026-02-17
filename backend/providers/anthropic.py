from typing import AsyncIterator
import httpx
import logging
from .base import BaseLLMProvider

logger = logging.getLogger(__name__)
SYSTEM_PROMPT = "You are an AI assistant that analyzes OpenClaw logs. The user will provide logs and a question. Focus on answering their question using the log content."

class AnthropicProvider(BaseLLMProvider):
    def __init__(self):
        self.api_key = None
        self.base_url = "https://api.anthropic.com/v1"

    async def stream(self, messages: list[dict], model: str = "claude-3-5-sonnet-20241022") -> AsyncIterator[str]:
        logger.info("Anthropic stream called - model: %s, has_api_key: %s", model, bool(self.api_key))
        
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        chunk_count = 0
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "model": model,
                "messages": messages,
                "stream": True,
                "max_tokens": 4096,
            }
            logger.debug("Anthropic payload: %s", payload)
            async with client.stream(
                "POST",
                f"{self.base_url}/messages",
                headers=headers,
                json=payload,
            ) as response:
                logger.info("Anthropic response status: %s", response.status_code)
                
                if response.status_code >= 400:
                    body = await response.aread()
                    logger.error("Anthropic API error: %s - %s", response.status_code, body)
                    raise Exception(f"Anthropic API error: {response.status_code}")
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            logger.info("Anthropic stream [DONE] received")
                            break
                        
                        try:
                            import json
                            chunk = json.loads(data)
                            chunk_type = chunk.get("type")
                            logger.debug("Anthropic event type: %s", chunk_type)
                            
                            if chunk_type == "content_block_delta":
                                delta = chunk.get("delta", {})
                                if text_delta := delta.get("text"):
                                    chunk_count += 1
                                    logger.debug("Anthropic chunk #%d: %s", chunk_count, text_delta[:50] if text_delta else "EMPTY")
                                    yield text_delta
                            elif chunk_type == "message_start":
                                logger.debug("Anthropic message_start event received")
                            elif chunk_type == "message_delta":
                                logger.debug("Anthropic message_delta event received")
                        except json.JSONDecodeError as e:
                            logger.warning("Failed to parse Anthropic event: %s", str(e))
                
                logger.info("Anthropic stream finished - total chunks: %d", chunk_count)

    def format_message(self, query: str, context: str | None) -> list[dict]:
        user_content = query
        if context:
            user_content = f"Here are the OpenClaw logs:\n\n{context}\n\nUser question: {query}"
        return [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]

    async def list_models(self) -> list[dict]:
        """Fetch list of models from Anthropic API."""
        if not self.api_key:
            return []
        
        try:
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{self.base_url}/models", headers=headers)
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])
        except httpx.HTTPStatusError as e:
            print(f"Anthropic API error: {e.response.status_code} - {e.response.text}")
            return []
        except Exception as e:
            print(f"Error fetching Anthropic models: {e}")
            return []
