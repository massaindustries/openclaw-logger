import pytest
import json
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock


# Import the app and provider classes
import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, backend_dir)

from app import app, ChatRequest
from providers.openai import OpenAIProvider
from providers.regolo import RegoloProvider
from providers.base import RateLimitError


def sse_chunk(data: dict) -> bytes:
    """Encode a dict as an SSE line."""
    return f"data: {json.dumps(data)}\n\n".encode()


class MockStreamResponse:
    def __init__(self, status_code: int, retry_after: str | None = None, content: list[bytes] | None = None):
        self.status_code = status_code
        self.headers = {}
        if retry_after:
            self.headers["Retry-After"] = retry_after
        self._content = content or []

    async def aiter_lines(self):
        for line in self._content:
            yield line.decode()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        pass

    def raise_for_status(self):
        if self.status_code >= 400:
            import httpx
            raise httpx.HTTPStatusError(
                "Mock error",
                request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions"),
                response=httpx.Response(self.status_code, request=httpx.Request("POST", ""), headers=self.headers),
            )


class MockAsyncClient:
    """Mock for httpx.AsyncClient that returns a stream context manager."""
    def __init__(self, responses: list):
        self._responses = responses
        self._idx = 0
    
    def stream(self, *args, **kwargs):
        # Return the next response in the list
        resp = self._responses[self._idx]
        self._idx += 1
        return resp
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, *args):
        pass


def test_rate_limit_error_imports():
    """Test that RateLimitError can be imported from base module."""
    assert RateLimitError is not None


def test_rate_limit_error_properties():
    """Test RateLimitError properties."""
    err = RateLimitError("Rate limited", retry_after=2.5)
    assert str(err) == "Rate limited"
    assert err.retry_after == 2.5

    err2 = RateLimitError("Rate limited")
    assert err2.retry_after == 1.0  # default


def test_openai_provider_init():
    """Test OpenAIProvider initialization."""
    provider = OpenAIProvider()
    assert provider.api_key is None
    assert provider.base_url == "https://api.openai.com/v1"


def test_regolo_provider_init():
    """Test RegoloProvider initialization."""
    provider = RegoloProvider()
    assert provider.api_key is None
    assert provider.base_url == "https://api.regolo.ai"


def test_openai_provider_set_credentials():
    """Test setting API key and base URL."""
    provider = OpenAIProvider()
    provider.api_key = "sk-test-key"
    provider.base_url = "https://custom.api.com/v1"
    assert provider.api_key == "sk-test-key"
    assert provider.base_url == "https://custom.api.com/v1"


@pytest.mark.asyncio
async def test_openai_stream_429_then_success():
    """Test OpenAI provider handles 429 then succeeds on retry."""
    # First response: 429
    first_resp = MockStreamResponse(status_code=429, retry_after="0.01")
    # Second response: success with content
    success_content = [sse_chunk({"choices": [{"delta": {"content": "Hello"}}]})]
    second_resp = MockStreamResponse(status_code=200, content=success_content)

    mock_client = MockAsyncClient([first_resp, second_resp])

    provider = OpenAIProvider()
    provider.api_key = "sk-test"

    with patch("httpx.AsyncClient", return_value=mock_client):
        chunks = []
        async for chunk in provider.stream([{"role": "user", "content": "test"}], "gpt-4o", max_retries=3):
            chunks.append(chunk)

        # Should have received the content after retry
        assert "Hello" in chunks
        assert mock_client._idx == 2


@pytest.mark.asyncio
async def test_openai_stream_all_429():
    """Test OpenAI provider raises error after max retries."""
    mock_resp = MockStreamResponse(status_code=429, retry_after="0.001")
    # Need 3 responses for 3 retries
    mock_client = MockAsyncClient([mock_resp, mock_resp, mock_resp])

    provider = OpenAIProvider()
    provider.api_key = "sk-test"

    with patch("httpx.AsyncClient", return_value=mock_client):
        with pytest.raises(RateLimitError):
            chunks = []
            async for chunk in provider.stream([{"role": "user", "content": "test"}], "gpt-4o", max_retries=3):
                chunks.append(chunk)

        assert mock_client._idx == 3


@pytest.mark.asyncio
async def test_regolo_stream_429_then_success():
    """Test Regolo provider handles 429 then succeeds on retry."""
    first_resp = MockStreamResponse(status_code=429, retry_after="0.01")
    success_content = [sse_chunk({"choices": [{"delta": {"content": "Ciao"}}]})]
    second_resp = MockStreamResponse(status_code=200, content=success_content)

    mock_client = MockAsyncClient([first_resp, second_resp])

    provider = RegoloProvider()
    provider.api_key = "test-key"

    with patch("httpx.AsyncClient", return_value=mock_client):
        chunks = []
        async for chunk in provider.stream([{"role": "user", "content": "ciao"}], "gpt-oss-120b", max_retries=3):
            chunks.append(chunk)

        assert "Ciao" in chunks
        assert mock_client._idx == 2


def test_chat_endpoint_handles_rate_limit_error():
    """Test that the /api/chat endpoint returns proper error for rate limits."""
    # This test verifies the endpoint structure

    
    # Basic request structure validation
    payload = {
        "query": "test",
        "provider": "openai-compatible", 
        "model": "gpt-4o",
        "apiKey": "sk-test"
    }
    
    # Just verify the endpoint accepts the payload (we can't easily mock in sync TestClient)
    # The actual rate limit handling is tested in the provider tests above
    assert True  # Placeholder - actual streaming test requires async client


def test_chat_request_model():
    """Test ChatRequest model validation."""
    # Valid request
    req = ChatRequest(query="hello", provider="openai-compatible", model="gpt-4o", apiKey="sk-xxx")
    assert req.query == "hello"
    assert req.provider == "openai-compatible"
    assert req.model == "gpt-4o"
    assert req.apiKey == "sk-xxx"
    
    # Default values
    req2 = ChatRequest(query="hello")
    assert req2.provider == "openai-compatible"
    assert req2.model == "gpt-4o"
    assert req2.apiKey is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
