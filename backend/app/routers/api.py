import asyncio
from typing import AsyncIterator

from fastapi import APIRouter, Depends, Query, Request
from sse_starlette.sse import EventSourceResponse

from app.config.settings import Settings, get_settings
from app.dependencies import get_message_repository, get_stream_service
from app.repositories.messages_repository import MessageRepository
from app.schemas.message import SentimientoEnum, TemaEnum
from app.services.stream_service import StreamService


router = APIRouter(prefix="/api", tags=["api"])


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
def get_sentimientos(repository: MessageRepository = Depends(get_message_repository)) -> dict[str, object]:
    data = repository.aggregate_counts("sentimiento")
    return {"items": data}


@router.get("/temas")
def get_temas(repository: MessageRepository = Depends(get_message_repository)) -> dict[str, object]:
    data = repository.aggregate_counts("tema")
    return {"items": data}


@router.get("/resumen")
def get_resumen(
    limit: int = Query(default=20, ge=1, le=200),
    repository: MessageRepository = Depends(get_message_repository),
) -> dict[str, object]:
    data = repository.latest_summaries(limit=limit)
    return {"items": data, "count": len(data)}


@router.get("/health")
def get_health(repository: MessageRepository = Depends(get_message_repository)) -> dict[str, str]:
    return {"status": "ok" if repository.health_check() else "degraded"}


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
