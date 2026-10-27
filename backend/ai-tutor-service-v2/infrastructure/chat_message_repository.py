from datetime import datetime, timezone

from core.database import chat_messages_collection


class ChatMessageRepository:

    async def create(
        self,
        user_id: str,
        conversation_id: str,
        role: str,
        content: str,
    ) -> dict:
        document = {
            "user_id": user_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "created_at": datetime.now(timezone.utc),
        }

        result = await chat_messages_collection.insert_one(document)

        document["_id"] = result.inserted_id

        return document

    async def list_by_conversation(
        self,
        user_id: str,
        conversation_id: str,
        limit: int = 100,
    ) -> list[dict]:
        cursor = (
            chat_messages_collection
            .find({
                "user_id": user_id,
                "conversation_id": conversation_id,
            })
            .sort("created_at", 1)
            .limit(limit)
        )

        return await cursor.to_list(length=limit)


chat_message_repository = ChatMessageRepository()