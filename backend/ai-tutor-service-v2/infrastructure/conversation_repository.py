from datetime import datetime, timezone

from bson import ObjectId

from core.database import conversations_collection


class ConversationRepository:

    async def create(
        self,
        user_id: str,
        title: str,
    ) -> dict:
        now = datetime.now(timezone.utc)

        document = {
            "user_id": user_id,
            "title": title,
            "created_at": now,
            "updated_at": now,
        }

        result = await conversations_collection.insert_one(document)

        document["_id"] = result.inserted_id

        return document

    async def find_by_id(
        self,
        conversation_id: str,
        user_id: str,
    ) -> dict | None:
        if not ObjectId.is_valid(conversation_id):
            return None

        return await conversations_collection.find_one({
            "_id": ObjectId(conversation_id),
            "user_id": user_id,
        })

    async def list_by_user(
        self,
        user_id: str,
        limit: int = 50,
    ) -> list[dict]:
        cursor = (
            conversations_collection
            .find({"user_id": user_id})
            .sort("updated_at", -1)
            .limit(limit)
        )

        return await cursor.to_list(length=limit)

    async def update_activity(
        self,
        conversation_id: str,
        user_id: str,
    ) -> None:
        if not ObjectId.is_valid(conversation_id):
            return

        await conversations_collection.update_one(
            {
                "_id": ObjectId(conversation_id),
                "user_id": user_id,
            },
            {
                "$set": {
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )


conversation_repository = ConversationRepository()