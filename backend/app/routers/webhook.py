import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from twilio.request_validator import RequestValidator

from app.config.settings import Settings, get_settings
from app.dependencies import get_processing_service
from app.services.message_processing_service import MessageProcessingService


logger = logging.getLogger(__name__)
router = APIRouter(tags=["webhook"])


@router.post("/webhook/twilio")
async def twilio_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    processing_service: MessageProcessingService = Depends(get_processing_service),
    settings: Settings = Depends(get_settings),
) -> Response:
    form = await request.form()
    body = str(form.get("Body", "")).strip()
    from_number = str(form.get("From", "")).strip()
    message_sid = str(form.get("MessageSid", "")).strip()

    if not message_sid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MessageSid es requerido")

    if settings.validate_twilio_signature:
        if not settings.twilio_auth_token:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="TWILIO_AUTH_TOKEN no esta configurado",
            )
        twilio_signature = request.headers.get("X-Twilio-Signature", "")
        validator = RequestValidator(settings.twilio_auth_token)
        is_valid = validator.validate(str(request.url), dict(form), twilio_signature)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Firma de Twilio invalida")

    metadata = {
        "twilio_message_sid": message_sid,
        "profile_name": str(form.get("ProfileName", "")),
        "raw_fields": dict(form),
    }

    doc, should_analyze = await processing_service.ingest_message(
        twilio_message_sid=message_sid,
        texto_mensaje=body,
        numero_remitente=from_number,
        metadata=metadata,
    )

    if should_analyze:
        background_tasks.add_task(processing_service.run_analysis_for_sid, message_sid, body)

    logger.info("Webhook procesado sid=%s should_analyze=%s", message_sid, should_analyze)
    return Response(content="<Response></Response>", media_type="application/xml", status_code=200)
