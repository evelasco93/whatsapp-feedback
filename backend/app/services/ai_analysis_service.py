import json
import logging

from openai import OpenAI

from app.config.settings import Settings
from app.schemas.message import AIAnalysisResult, SentimientoEnum, TemaEnum


logger = logging.getLogger(__name__)


class AIAnalysisService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def analyze_message(self, texto_mensaje: str) -> AIAnalysisResult:
        if self._client is None:
            logger.warning("OPENAI_API_KEY no configurada, devolviendo analisis por defecto")
            return AIAnalysisResult(
                sentimiento=SentimientoEnum.neutro,
                tema=TemaEnum.otro,
                resumen="Analisis no disponible por configuracion.",
            )

        prompt = (
            "Analiza el siguiente mensaje de cliente y responde SOLO un JSON valido "
            "con las claves exactas: sentimiento, tema, resumen. "
            "sentimiento debe ser uno de: positivo, negativo, neutro. "
            "tema debe ser uno de: Servicio al Cliente, Calidad del Producto, Precio, Limpieza, Otro. "
            "resumen debe ser breve en espanol.\n\n"
            f"Mensaje: {texto_mensaje}"
        )

        completion = self._client.chat.completions.create(
            model=self.settings.openai_model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Eres un analista de feedback de clientes."},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )

        content = completion.choices[0].message.content
        if not content:
            raise ValueError("OpenAI no devolvio contenido")

        payload = json.loads(content)
        return AIAnalysisResult.model_validate(payload)
