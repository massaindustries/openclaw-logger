import asyncio
import json

async def test_sse_parsing():
    # Simulate SSE data from Responses API
    test_events = [
        'data: {"type":"response.output_text.delta","delta":"Hello"}',
        'data: {"type":"response.output_text.delta","delta":" World"}',
        'data: [DONE]',
    ]
    
    print("Testing SSE parsing logic:")
    for line in test_events:
        if not line:
            continue
        if not line.startswith("data:"):
            continue
        
        data = line[len("data:"):].strip()
        if data == "[DONE]":
            print("DONE")
            break
            
        try:
            evt = json.loads(data)
        except json.JSONDecodeError as e:
            print(f"JSON error: {e}")
            continue
            
        evt_type = evt.get("type")
        print(f"Event type: {evt_type}, full: {evt}")
        
        if evt_type == "response.output_text.delta":
            delta = evt.get("delta")
            if delta:
                print(f"  -> Yielding: {delta}")

asyncio.run(test_sse_parsing())
