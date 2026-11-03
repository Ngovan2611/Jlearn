from datetime import datetime, timezone
from bson import ObjectId

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
        limit: int = 20,
        before_id: str | None = None,
    ) -> tuple[list[dict], bool]:
        query: dict = {
            "user_id": user_id,
            "conversation_id": conversation_id,
        }

        if before_id and ObjectId.is_valid(before_id):
            query["_id"] = {"$lt": ObjectId(before_id)}

        # Lấy từ mới nhất trở về trước theo index _id (tương đương created_at)
        cursor = (
            chat_messages_collection
            .find(query)
            .sort("_id", -1)
            .limit(limit + 1)
        )
        docs = await cursor.to_list(length=limit + 1)
        has_more = len(docs) > limit
        if has_more:
            docs = docs[:limit]

        # Đảo ngược lại để danh sách tin nhắn theo thứ tự thời gian tăng dần
        docs.reverse()
        return docs, has_more


chat_message_repository = ChatMessageRepository()
