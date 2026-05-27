from functools import lru_cache

from app.config.settings import Settings, get_settings
from app.db.mongo import get_messages_collection
from app.repositories.messages_repository import MessageRepository
from app.services.ai_analysis_service import AIAnalysisService
from app.services.message_processing_service import MessageProcessingService
from app.services.stream_service import StreamService


@lru_cache(maxsize=1)
def get_message_repository() -> MessageRepository:
    repository = MessageRepository(get_messages_collection())
    repository.ensure_indexes()
    return repository


@lru_cache(maxsize=1)
def get_stream_service() -> StreamService:
    return StreamService()


@lru_cache(maxsize=1)
def get_ai_analysis_service() -> AIAnalysisService:
    settings: Settings = get_settings()
    return AIAnalysisService(settings)


def get_processing_service() -> MessageProcessingService:
    return MessageProcessingService(
        repository=get_message_repository(),
        ai_service=get_ai_analysis_service(),
        stream_service=get_stream_service(),
    )
