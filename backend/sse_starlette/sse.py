from starlette.responses import StreamingResponse
from starlette.types import Send, Receive, Scope


class EventSourceResponse(StreamingResponse):
    """SSE response that streams async dict events.

    Accepts an async iterator yielding dictionaries with ``event`` and ``data`` keys
    (and optionally ``retry``). Each dictionary is formatted according to the
    Server‑Sent Events spec and streamed as bytes.
    """

    def __init__(self, iterator, ping=None):
        self._iterator = iterator
        self.ping = ping  # retained for compatibility; not used in this simple implementation
        # Initialise as a StreamingResponse with our async generator
        super().__init__(self._event_generator(), media_type="text/event-stream")

    async def _event_generator(self):
        """Yield formatted SSE bytes from the provided async iterator."""
        async for event in self._iterator:
            # Expect ``event`` to be a mapping (dict) with at least ``event`` and ``data``.
            lines = []
            if "event" in event:
                lines.append(f"event: {event['event']}")
            if "data" in event:
                lines.append(f"data: {event['data']}")
            # ``retry`` is optional and specifies reconnection time in ms.
            if "retry" in event:
                lines.append(f"retry: {event['retry']}")
            # SSE format ends with a double newline.
            sse_chunk = "\n".join(lines) + "\n\n"
            yield sse_chunk.encode("utf-8")

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Override __call__ to ensure proper streaming behavior."""
        await super().__call__(scope, receive, send)
