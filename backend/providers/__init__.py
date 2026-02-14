from .openai import OpenAIProvider
from .anthropic import AnthropicProvider
from .google import GoogleProvider
from .grok import GrokProvider
from .base import BaseLLMProvider

PROVIDERS = {
    "openai": OpenAIProvider,
    "openai-compatible": OpenAIProvider,
    "regolo": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "google": GoogleProvider,
    "grok": GrokProvider,
}

def get_provider(provider: str, api_key: str | None = None) -> BaseLLMProvider:
    provider_class = PROVIDERS.get(provider.lower())
    if not provider_class:
        raise ValueError(f"Unknown provider: {provider}")
    instance = provider_class()
    # Override the API key if supplied by the client
    if api_key:
        setattr(instance, "api_key", api_key)
    # Set fixed baseUrl for Regolo provider
    if provider.lower() == "regolo":
        setattr(instance, "base_url", "https://api.regolo.ai/v1")
    return instance
