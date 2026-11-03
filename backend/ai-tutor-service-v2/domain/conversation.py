from datetime import datetime, timezone
from typing import Any


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def serialize_conversation(document: dict[str, Any]) -> dict:
    return {
        "id": str(document["_id"]),
        "title": document["title"],
        "created_at": document["created_at"],
        "updated_at": document["updated_at"],
    }