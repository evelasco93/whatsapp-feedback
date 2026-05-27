import logging
from typing import Any

from app.repositories.messages_repository import MessageRepository
from app.schemas.message import AIAnalysisResult
from app.services.ai_analysis_service import AIAnalysisService
from app.services.stream_service import StreamService


logger = logging.getLogger(__name__)


class MessageProcessingService:
    def __init__(
        self,
        repository: MessageRepository,
        ai_service: AIAnalysisService,
        stream_service: StreamService,
    ) -> None:
        self.repository = repository
        self.ai_service = ai_service
        self.stream_service = stream_service

    async def ingest_message(
        self,
        *,
        twilio_message_sid: str,
        texto_mensaje: str,
        numero_remitente: str,
        metadata: dict[str, Any],
    ) -> tuple[dict[str, Any], bool]:
        doc, created = self.repository.upsert_base_message(
            twilio_message_sid=twilio_message_sid,
            texto_mensaje=texto_mensaje,
            numero_remitente=numero_remitente,
            metadata=metadata,
        )
        await self.stream_service.publish({"type": "mensaje_ingresado", "payload": doc})
        should_analyze = self.repository.mark_analysis_in_progress(twilio_message_sid=twilio_message_sid)
        return doc, should_analyze

    async def run_analysis_for_sid(self, twilio_message_sid: str, texto_mensaje: str) -> None:
        try:
            result: AIAnalysisResult = self.ai_service.analyze_message(texto_mensaje)
            updated = self.repository.update_analysis(
                twilio_message_sid=twilio_message_sid,
                sentimiento=result.sentimiento.value,
                tema=result.tema.value,
                resumen=result.resumen,
            )
            if updated is not None:
                await self.stream_service.publish({"type": "mensaje_actualizado", "payload": updated})
        except Exception as exc:
            logger.exception("Error analizando mensaje sid=%s", twilio_message_sid)
            self.repository.mark_analysis_error(
                twilio_message_sid=twilio_message_sid,
                error_message=str(exc),
            )
