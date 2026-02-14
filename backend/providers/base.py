from abc import ABC, abstractmethod
from typing import AsyncIterator

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