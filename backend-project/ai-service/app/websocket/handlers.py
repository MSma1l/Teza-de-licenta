"""
WebSocket handlers - real-time updates via Redis pub/sub.
"""

import asyncio
import json
from typing import Dict, Set

from fastapi import WebSocket, WebSocketDisconnect
from loguru import logger

from app.core.config import settings


class ConnectionManager:
    """Gestionează conexiuni WebSocket active."""

    def __init__(self):
        # Queue subscribers: set of websockets
        self._queue_connections: Set[WebSocket] = set()
        # Document-specific subscribers: document_id -> set of websockets
        self._document_connections: Dict[str, Set[WebSocket]] = {}

    async def connect_queue(self, websocket: WebSocket):
        """Conectează un client la actualizări queue."""
        await websocket.accept()
        self._queue_connections.add(websocket)
        logger.debug(f"WebSocket queue connected. Total: {len(self._queue_connections)}")

    async def connect_document(self, websocket: WebSocket, document_id: str):
        """Conectează un client la actualizări document specific."""
        await websocket.accept()
        if document_id not in self._document_connections:
            self._document_connections[document_id] = set()
        self._document_connections[document_id].add(websocket)
        logger.debug(f"WebSocket document {document_id} connected")

    def disconnect_queue(self, websocket: WebSocket):
        self._queue_connections.discard(websocket)

    def disconnect_document(self, websocket: WebSocket, document_id: str):
        if document_id in self._document_connections:
            self._document_connections[document_id].discard(websocket)
            if not self._document_connections[document_id]:
                del self._document_connections[document_id]

    async def broadcast_queue(self, message: dict):
        """Trimite mesaj la toți subscriberii queue."""
        dead = set()
        for ws in self._queue_connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        self._queue_connections -= dead

    async def broadcast_document(self, document_id: str, message: dict):
        """Trimite mesaj la toți subscriberii unui document."""
        connections = self._document_connections.get(document_id, set())
        dead = set()
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        if document_id in self._document_connections:
            self._document_connections[document_id] -= dead


# Singleton
manager = ConnectionManager()


async def redis_listener():
    """
    Background task: ascultă Redis pub/sub și forwarded mesaje la WebSocket.
    Pornit la startup-ul aplicației.
    """
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.REDIS_URL)
        pubsub = r.pubsub()
        await pubsub.psubscribe("document:*", "queue:*")

        logger.info("Redis pub/sub listener started")

        async for message in pubsub.listen():
            if message["type"] != "pmessage":
                continue

            channel = message["channel"]
            if isinstance(channel, bytes):
                channel = channel.decode()

            data = message["data"]
            if isinstance(data, bytes):
                data = data.decode()

            try:
                payload = json.loads(data)
            except json.JSONDecodeError:
                continue

            if channel.startswith("queue:"):
                await manager.broadcast_queue(payload)
            elif channel.startswith("document:"):
                doc_id = channel.split(":")[1]
                await manager.broadcast_document(doc_id, payload)

    except asyncio.CancelledError:
        logger.info("Redis listener cancelled (shutdown)")
        raise
    except Exception as e:
        logger.error(f"Redis listener error: {e}")
        # Retry with exponential backoff
        for attempt in range(5):
            wait = 5 * (attempt + 1)
            logger.info(f"Redis listener retry #{attempt + 1} in {wait}s...")
            await asyncio.sleep(wait)
            try:
                await redis_listener()
                break
            except asyncio.CancelledError:
                raise
            except Exception:
                continue
        logger.error("Redis listener: all retries failed")
