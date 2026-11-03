from pymongo import AsyncMongoClient

from core.config import settings


client = AsyncMongoClient(settings.MONGODB_URI)

database = client[settings.MONGODB_DATABASE]

conversations_collection = database["conversations"]
chat_messages_collection = database["chat_messages"]


async def connect_mongodb() -> None:
    # Kiểm tra kết nối MongoDB.
    await client.admin.command("ping")

    # Index phục vụ truy vấn danh sách hội thoại của người dùng.
    await conversations_collection.create_index(
        [
            ("user_id", 1),
            ("updated_at", -1),
        ]
    )

    # Index phục vụ truy vấn lịch sử tin nhắn.
    await chat_messages_collection.create_index(
        [
            ("conversation_id", 1),
            ("created_at", 1),
        ]
    )

    await chat_messages_collection.create_index(
        [
            ("user_id", 1),
            ("conversation_id", 1),
        ]
    )


async def close_mongodb() -> None:
    await client.close()