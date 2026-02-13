from .openai import OpenAIProvider
from .anthropic import AnthropicProvider
from .google import GoogleProvider
from .grok import GrokProvider
from .base import BaseLLMProvider

PROVIDERS = {
    "openai": OpenAIProvider,
    "openai-compatible": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "google": GoogleProvider,
    "grok": GrokProvider,
}

def get_provider(provider: str) -> BaseLLMProvider:
    provider_class = PROVIDERS.get(provider.lower())
    if not provider_class:
        raise ValueError(f"Unknown provider: {provider}")
    return provider_class()
