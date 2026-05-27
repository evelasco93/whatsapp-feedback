import asyncio
import logging
from typing import AsyncIterator

from fastapi import APIRouter, Depends, Query, Request
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
from sse_starlette.sse import EventSourceResponse

from app.config.settings import Settings, get_settings
from app.db.mongo import get_mongo_client
from app.dependencies import get_message_repository, get_stream_service
from app.repositories.messages_repository import MessageRepository
from app.schemas.message import SentimientoEnum, TemaEnum
from app.services.stream_service import StreamService


router = APIRouter(prefix="/api", tags=["api"])
logger = logging.getLogger(__name__)


@router.get("/mensajes")
def get_mensajes(
    sentimiento: SentimientoEnum | None = Query(default=None),
    tema: TemaEnum | None = Query(default=None),
    desde: int | None = Query(default=None),
    hasta: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    repository: MessageRepository = Depends(get_message_repository),
) -> dict[str, object]:
    items = repository.list_messages(
        sentimiento=sentimiento.value if sentimiento else None,
        tema=tema.value if tema else None,
        desde=desde,
        hasta=hasta,
        limit=limit,
    )
    return {"items": items, "count": len(items)}


@router.get("/sentimientos")
def get_sentimientos(
    desde: int | None = Query(default=None),
    hasta: int | None = Query(default=None),
    repository: MessageRepository = Depends(get_message_repository),
) -> dict[str, object]:
    data = repository.aggregate_counts_by_field(field_name="sentimiento", desde=desde, hasta=hasta)
    return {"items": data}


@router.get("/temas")
def get_temas(
    desde: int | None = Query(default=None),
    hasta: int | None = Query(default=None),
    repository: MessageRepository = Depends(get_message_repository),
) -> dict[str, object]:
    data = repository.aggregate_counts_by_field(field_name="tema", desde=desde, hasta=hasta)
    return {"items": data}


@router.get("/resumen")
def get_resumen(
    limit: int = Query(default=20, ge=1, le=200),
    repository: MessageRepository = Depends(get_message_repository),
) -> dict[str, object]:
    data = repository.latest_summaries(limit=limit)
    return {"items": data, "count": len(data)}


@router.get("/health")
def get_health(settings: Settings = Depends(get_settings)) -> dict[str, object]:
    client = get_mongo_client()
    try:
        ping_ok = client.admin.command("ping").get("ok") == 1.0
        return {
            "status": "ok" if ping_ok else "degraded",
            "checks": {
                "mongo": "ok" if ping_ok else "degraded",
                "db": settings.mongodb_db_name,
                "collection": settings.mongodb_collection_name,
            },
        }
    except ServerSelectionTimeoutError:
        logger.warning("MongoDB health check server selection timeout")
        return {
            "status": "degraded",
            "checks": {
                "mongo": "unreachable",
                "db": settings.mongodb_db_name,
                "collection": settings.mongodb_collection_name,
            },
            "error": {
                "type": "ServerSelectionTimeoutError",
                "message": "MongoDB server selection timed out",
                "hint": "Verify MONGODB_URI, Atlas network access/IP allowlist, and Atlas user credentials",
            },
        }
    except PyMongoError as exc:
        logger.exception("MongoDB health check failed: %s", type(exc).__name__)
        return {
            "status": "degraded",
            "checks": {
                "mongo": "error",
                "db": settings.mongodb_db_name,
                "collection": settings.mongodb_collection_name,
            },
            "error": {
                "type": type(exc).__name__,
                "message": "MongoDB connectivity check failed",
            },
        }


@router.get("/stream")
async def stream_events(
    request: Request,
    stream_service: StreamService = Depends(get_stream_service),
    settings: Settings = Depends(get_settings),
) -> EventSourceResponse:
    queue = stream_service.subscribe()

    async def event_generator() -> AsyncIterator[dict[str, object]]:
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=10)
                    yield {"event": event.get("type", "message"), "data": event}
                except asyncio.TimeoutError:
                    yield {"event": "heartbeat", "data": {"ok": True}}
        finally:
            stream_service.unsubscribe(queue)

    return EventSourceResponse(event_generator(), ping=settings.sse_retry_ms / 1000)
