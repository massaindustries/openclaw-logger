from abc import ABC, abstractmethod
from typing import AsyncIterator


class RateLimitError(Exception):
    """Universal rate limit exception for all providers."""
    def __init__(self, message: str, retry_after: float = 1.0):
        super().__init__(message)
        self.retry_after = retry_after


class BaseLLMProvider(ABC):
    @abstractmethod
    async def stream(self, messages: list[dict], model: str) -> AsyncIterator[str]:
        pass

    @abstractmethod
    def format_message(self, query: str, context: str | None) -> list[dict]:
        pass

    @abstractmethod
    async def list_models(self) -> list[dict]:
        """Return a list of available model specifications for this provider."""
        pass