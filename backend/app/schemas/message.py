from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class SentimientoEnum(str, Enum):
    positivo = "positivo"
    negativo = "negativo"
    neutro = "neutro"


class TemaEnum(str, Enum):
    servicio_al_cliente = "Servicio al Cliente"
    calidad_del_producto = "Calidad del Producto"
    precio = "Precio"
    limpieza = "Limpieza"
    otro = "Otro"


class AIAnalysisResult(BaseModel):
    sentimiento: SentimientoEnum
    tema: TemaEnum
    resumen: str = Field(min_length=1, max_length=500)


class MensajeOut(BaseModel):
    id: str
    texto_mensaje: str
    numero_remitente: str
    timestamp_epox: int
    sentimiento: SentimientoEnum | None = None
    tema: TemaEnum | None = None
    resumen: str | None = None
    estado_analisis: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class CountBucket(BaseModel):
    valor: str
    total: int


class ResumenOut(BaseModel):
    id: str
    numero_remitente: str
    timestamp_epox: int
    sentimiento: SentimientoEnum | None = None
    tema: TemaEnum | None = None
    resumen: str
