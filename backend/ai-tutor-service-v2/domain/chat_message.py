from typing import Any


def serialize_chat_message(document: dict[str, Any]) -> dict:
    return {
        "id": str(document["_id"]),
        "conversation_id": document["conversation_id"],
        "role": document["role"],
        "content": document["content"],
        "created_at": document["created_at"],
    }