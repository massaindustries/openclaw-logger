import asyncio
import json

async def test_stream():
    from providers.openai import OpenAIProvider
    
    provider = OpenAIProvider()
    provider.api_key = "test-key"  # Won't work but let's see the flow
    
    messages = [{"role": "user", "content": "ciao"}]
    
    # Test the conversion function
    print("Testing _messages_to_responses_input:")
    converted = provider._messages_to_responses_input(messages)
    print(json.dumps(converted, indent=2))
    
    # Test headers
    print("\nTesting _headers:")
    print(provider._headers())

asyncio.run(test_stream())
