import certifi
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from app.config.settings import get_settings


_client: MongoClient | None = None


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = MongoClient(settings.mongodb_uri, tlsCAFile=certifi.where())
    return _client


def get_database() -> Database:
    settings = get_settings()
    client = get_mongo_client()
    return client[settings.mongodb_db_name]


def get_messages_collection() -> Collection:
    settings = get_settings()
    db = get_database()
    return db[settings.mongodb_collection_name]
