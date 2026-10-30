import asyncio
import json
import threading
from typing import Any, AsyncGenerator, Dict, List, Optional
from sse_starlette.sse import ServerSentEvent


class EventBroadcaster:
    """
    In-memory async Pub/Sub broadcaster for live dashboard and alert updates.
    """
    def __init__(self):
        self._subscribers: List[asyncio.Queue] = []
        self._lock = asyncio.Lock()

    async def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        async with self._lock:
            self._subscribers.append(q)
        return q

    async def unsubscribe(self, q: asyncio.Queue):
        async with self._lock:
            if q in self._subscribers:
                self._subscribers.remove(q)

    async def broadcast(self, event: str, data: Any):
        payload = json.dumps(data) if not isinstance(data, str) else data
        sse_event = {"event": event, "data": payload}
        async with self._lock:
            for q in list(self._subscribers):
                try:
                    q.put_nowait(sse_event)
                except Exception:
                    pass


event_broadcaster = EventBroadcaster()


async def sync_gen_to_async(sync_gen) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Adapts a synchronous Python generator (such as local model inference or LangGraph steps)
    into a non-blocking asynchronous generator suitable for FastAPI and SSE streaming.
    """
    loop = asyncio.get_running_loop()
    q: asyncio.Queue = asyncio.Queue()
    DONE = object()

    def worker():
        try:
            for item in sync_gen:
                event_name = item.get("event", "message")
                raw_data = item.get("data", {})
                payload = json.dumps(raw_data) if not isinstance(raw_data, str) else raw_data
                loop.call_soon_threadsafe(q.put_nowait, {"event": event_name, "data": payload})
        except Exception as e:
            loop.call_soon_threadsafe(q.put_nowait, e)
        finally:
            loop.call_soon_threadsafe(q.put_nowait, DONE)

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()

    while True:
        item = await q.get()
        if item is DONE:
            break
        if isinstance(item, Exception):
            # Yield error event before stopping
            yield {"event": "error", "data": json.dumps({"error": str(item)})}
            break
        yield item
