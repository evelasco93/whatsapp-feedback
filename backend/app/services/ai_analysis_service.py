import json
import logging
from json import JSONDecodeError
from typing import Any

import httpx

from app.config.settings import Settings
from app.schemas.message import AIAnalysisResult, SentimientoEnum, TemaEnum


logger = logging.getLogger(__name__)


class AIAnalysisService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @staticmethod
    def _default_fallback_result() -> AIAnalysisResult:
        return AIAnalysisResult(
            sentimiento=SentimientoEnum.neutro,
            tema=TemaEnum.otro,
            resumen="Analisis no disponible por configuracion.",
        )

    @staticmethod
    def _sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
        sanitized: dict[str, Any] = {}
        for key, value in payload.items():
            if isinstance(value, str):
                sanitized[key] = value.strip()
            else:
                sanitized[key] = value
        return sanitized

    @staticmethod
    def _extract_generated_text(response_data: dict[str, Any]) -> str:
        candidates = response_data.get("candidates")
        if not isinstance(candidates, list):
            raise ValueError("Respuesta de Gemini sin candidates")

        parts_text: list[str] = []
        for candidate in candidates:
            if not isinstance(candidate, dict):
                continue
            content = candidate.get("content")
            if not isinstance(content, dict):
                continue
            parts = content.get("parts")
            if not isinstance(parts, list):
                continue
            for part in parts:
                if isinstance(part, dict):
                    text = part.get("text")
                    if isinstance(text, str) and text.strip():
                        parts_text.append(text)

        generated_text = "\n".join(parts_text).strip()
        if generated_text:
            return generated_text

        finish_reason = ""
        if candidates and isinstance(candidates[0], dict):
            finish_reason = str(candidates[0].get("finishReason", "")).strip()

        if finish_reason:
            raise ValueError(f"Gemini no devolvio texto util (finishReason={finish_reason})")
        raise ValueError("Gemini no devolvio texto util")

    @staticmethod
    def _parse_json_payload(raw_text: str) -> dict[str, Any]:
        text = raw_text.strip()
        if not text:
            raise ValueError("Texto de respuesta vacio")

        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
        except JSONDecodeError:
            pass

        if "```" in text:
            lines = [line for line in text.splitlines() if not line.strip().startswith("```")]
            fenced = "\n".join(lines).strip()
            if fenced:
                try:
                    parsed = json.loads(fenced)
                    if isinstance(parsed, dict):
                        return parsed
                except JSONDecodeError:
                    pass

        decoder = json.JSONDecoder()
        for index, character in enumerate(text):
            if character != "{":
                continue
            try:
                parsed, _ = decoder.raw_decode(text[index:])
                if isinstance(parsed, dict):
                    return parsed
            except JSONDecodeError:
                continue

        raise ValueError("No se pudo extraer un JSON valido de la respuesta de Gemini")

    def _analyze_with_gemini(self, texto_mensaje: str) -> dict[str, Any]:
        prompt = (
            "Analiza el siguiente mensaje de cliente y responde SOLO un JSON valido "
            "con las claves exactas: sentimiento, tema, resumen. "
            "sentimiento debe ser uno de: positivo, negativo, neutro. "
            "tema debe ser uno de: Servicio al Cliente, Calidad del Producto, Precio, Limpieza, Otro. "
            "resumen debe ser breve en espanol.\n\n"
            f"Mensaje: {texto_mensaje}"
        )

        body = {
            "system_instruction": {
                "parts": [
                    {"text": "Eres un analista de feedback de clientes."},
                ]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0,
                "responseMimeType": "application/json",
            },
        }

        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.settings.gemini_model}:generateContent"

        try:
            with httpx.Client(timeout=self.settings.ai_timeout_seconds) as client:
                response = client.post(
                    endpoint,
                    params={"key": self.settings.gemini_api_key},
                    json=body,
                )
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            logger.error("Timeout en llamada a Gemini (modelo=%s)", self.settings.gemini_model)
            raise ValueError("Timeout de Gemini") from exc
        except httpx.HTTPStatusError as exc:
            response_text = exc.response.text[:500] if exc.response is not None else ""
            status_code = exc.response.status_code if exc.response is not None else "unknown"
            logger.error(
                "Gemini respondio con error HTTP status=%s body=%s",
                status_code,
                response_text,
            )
            raise ValueError("Gemini devolvio error HTTP") from exc
        except httpx.HTTPError as exc:
            logger.error("Error de red llamando a Gemini: %s", str(exc))
            raise ValueError("Error de red con Gemini") from exc

        data = response.json()
        generated_text = self._extract_generated_text(data)
        return self._parse_json_payload(generated_text)

    def analyze_message(self, texto_mensaje: str) -> AIAnalysisResult:
        if not self.settings.gemini_api_key:
            logger.warning("GEMINI_API_KEY no configurada, devolviendo analisis por defecto")
            return self._default_fallback_result()

        try:
            payload = self._analyze_with_gemini(texto_mensaje)
            payload = self._sanitize_payload(payload)
            return AIAnalysisResult.model_validate(payload)
        except Exception:
            logger.exception("Fallo en analisis con Gemini, devolviendo fallback neutro")
            return self._default_fallback_result()
