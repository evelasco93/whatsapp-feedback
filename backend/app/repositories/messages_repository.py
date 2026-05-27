import time
from typing import Any

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING, ReturnDocument
from pymongo.collection import Collection


class MessageRepository:
    def __init__(self, collection: Collection) -> None:
        self.collection = collection

    def ensure_indexes(self) -> None:
        self.collection.create_index("twilio_message_sid", unique=True)
        self.collection.create_index([("timestamp_epox", DESCENDING)])
        self.collection.create_index([("sentimiento", ASCENDING)])
        self.collection.create_index([("tema", ASCENDING)])

    def upsert_base_message(
        self,
        *,
        twilio_message_sid: str,
        texto_mensaje: str,
        numero_remitente: str,
        metadata: dict[str, Any],
    ) -> tuple[dict[str, Any], bool]:
        now = int(time.time())
        pre_existing = self.collection.find_one({"twilio_message_sid": twilio_message_sid}, {"_id": 1})
        doc = self.collection.find_one_and_update(
            {"twilio_message_sid": twilio_message_sid},
            {
                "$setOnInsert": {
                    "texto_mensaje": texto_mensaje,
                    "numero_remitente": numero_remitente,
                    "timestamp_epox": now,
                    "metadata": metadata,
                    "estado_analisis": "pendiente",
                    "created_at_epox": now,
                },
                "$set": {"updated_at_epox": now},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        created = pre_existing is None
        if doc is None:
            raise RuntimeError("No se pudo crear o recuperar el mensaje")
        return self._normalize(doc), created

    def mark_analysis_in_progress(self, *, twilio_message_sid: str) -> bool:
        now = int(time.time())
        result = self.collection.update_one(
            {
                "twilio_message_sid": twilio_message_sid,
                "estado_analisis": {"$in": ["pendiente", "error"]},
            },
            {"$set": {"estado_analisis": "en_proceso", "updated_at_epox": now}},
        )
        return result.modified_count > 0

    def update_analysis(
        self,
        *,
        twilio_message_sid: str,
        sentimiento: str,
        tema: str,
        resumen: str,
    ) -> dict[str, Any] | None:
        now = int(time.time())
        doc = self.collection.find_one_and_update(
            {"twilio_message_sid": twilio_message_sid},
            {
                "$set": {
                    "sentimiento": sentimiento,
                    "tema": tema,
                    "resumen": resumen,
                    "estado_analisis": "completado",
                    "updated_at_epox": now,
                }
            },
            return_document=ReturnDocument.AFTER,
        )
        if doc is None:
            return None
        return self._normalize(doc)

    def mark_analysis_error(self, *, twilio_message_sid: str, error_message: str) -> None:
        now = int(time.time())
        self.collection.update_one(
            {"twilio_message_sid": twilio_message_sid},
            {
                "$set": {
                    "estado_analisis": "error",
                    "analysis_error": error_message,
                    "updated_at_epox": now,
                }
            },
        )

    def list_messages(
        self,
        *,
        sentimiento: str | None,
        tema: str | None,
        desde: int | None,
        hasta: int | None,
        limit: int,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {}
        if sentimiento:
            query["sentimiento"] = sentimiento
        if tema:
            query["tema"] = tema
        if desde is not None or hasta is not None:
            query["timestamp_epox"] = {}
            if desde is not None:
                query["timestamp_epox"]["$gte"] = desde
            if hasta is not None:
                query["timestamp_epox"]["$lte"] = hasta

        docs = self.collection.find(query).sort("timestamp_epox", DESCENDING).limit(limit)
        return [self._normalize(doc) for doc in docs]

    def aggregate_counts(self, field_name: str) -> list[dict[str, Any]]:
        pipeline = [
            {"$match": {field_name: {"$exists": True, "$ne": None}}},
            {"$group": {"_id": f"${field_name}", "total": {"$sum": 1}}},
            {"$sort": {"total": -1}},
        ]
        rows = self.collection.aggregate(pipeline)
        return [{"valor": row["_id"], "total": row["total"]} for row in rows]

    def latest_summaries(self, *, limit: int) -> list[dict[str, Any]]:
        query = {"resumen": {"$exists": True, "$ne": None}}
        projection = {
            "texto_mensaje": 0,
            "metadata": 0,
            "analysis_error": 0,
            "twilio_message_sid": 0,
        }
        docs = self.collection.find(query, projection=projection).sort("timestamp_epox", DESCENDING).limit(limit)
        return [self._normalize(doc) for doc in docs]

    def health_check(self) -> bool:
        return self.collection.database.client.admin.command("ping").get("ok") == 1.0

    def _normalize(self, doc: dict[str, Any]) -> dict[str, Any]:
        normalized = dict(doc)
        object_id = normalized.pop("_id", None)
        if isinstance(object_id, ObjectId):
            normalized["id"] = str(object_id)
        elif object_id is not None:
            normalized["id"] = str(object_id)
        return normalized
