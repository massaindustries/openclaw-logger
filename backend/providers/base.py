from abc import ABC, abstractmethod
from typing import AsyncIterator

class BaseLLMProvider(ABC):
    @abstractmethod
    async def stream(self, messages: list[dict], model: str) -> AsyncIterator[str]:
        pass

    @abstractmethod
    def format_message(self, query: str, context: str | None) -> list[dict]:
        pass
