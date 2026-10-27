from fastapi import APIRouter, Depends, HTTPException, Query
from core.auth import get_current_user_id
from domain.conversation import serialize_conversation
from domain.chat_message import serialize_chat_message
from services.tutor.tutor_service import TutorService
from datetime import datetime, timezone
from fastapi import Depends, HTTPException
from bson import ObjectId
from schemas.conversation import ChatMessageRequest
from infrastructure.conversation_repository import conversation_repository
from infrastructure.chat_message_repository import chat_message_repository
from schemas.conversation import (
    ConversationCreateRequest,
    ConversationResponse,
    ConversationListResponse,
    ChatMessageResponse,
    ChatMessageListResponse,
)
tutor_service = TutorService()
router = APIRouter(
    prefix="/conversations",
    tags=["AI Tutor - Conversation History"],
)



# 1. Tạo hội thoại
@router.post(
    "",
    response_model=dict,
    status_code=201,
)
async def create_conversation(
    request: ConversationCreateRequest,
    user_id: str = Depends(get_current_user_id),
):
    title = request.title.strip()

    if not title:
        raise HTTPException(
            status_code=422,
            detail="Tiêu đề hội thoại không được để trống.",
        )

    conversation = await conversation_repository.create(
        user_id=user_id,
        title=title,
    )

    return {
        "result": serialize_conversation(conversation),
    }


# 2. Lấy danh sách hội thoại của người dùng
@router.get(
    "",
    response_model=ConversationListResponse,
)
async def list_conversations(
    limit: int = Query(default=50, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
):
    conversations = await conversation_repository.list_by_user(
        user_id=user_id,
        limit=limit,
    )

    return {
        "result": [
            serialize_conversation(conversation)
            for conversation in conversations
        ],
    }


# 3. Lấy lịch sử tin nhắn của một hội thoại
@router.get(
    "/{conversation_id}/messages",
    response_model=ChatMessageListResponse,
)
async def get_conversation_messages(
    conversation_id: str,
    limit: int = Query(default=100, ge=1, le=200),
    user_id: str = Depends(get_current_user_id),
):
    conversation = await conversation_repository.find_by_id(
        conversation_id=conversation_id,
        user_id=user_id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hội thoại.",
        )

    messages = await chat_message_repository.list_by_conversation(
        user_id=user_id,
        conversation_id=conversation_id,
        limit=limit,
    )

    return {
        "result": [
            serialize_chat_message(message)
            for message in messages
        ],
    }
@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    request: ChatMessageRequest,
    user_id: str = Depends(get_current_user_id),
):
    # 1. Kiểm tra định dạng ID
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(
            status_code=400,
            detail="conversation_id không hợp lệ.",
        )

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Câu hỏi không được để trống.",
        )

    # 2. Chỉ cho phép truy cập hội thoại của chính người dùng
    conversation = await conversation_repository.find_by_id(
        conversation_id=conversation_id,
        user_id=user_id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hội thoại.",
        )

    # 3. Lưu câu hỏi trước khi gọi AI
    user_message = await chat_message_repository.create(
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=question,
    )

    # 4. Gọi dịch vụ AI hiện tại
    try:
        result = await tutor_service.chat(question=question)
        answer = result.get("answer", "")

        if not answer:
            answer = "Xin lỗi, AI Tutor chưa thể tạo câu trả lời."

        # 5. Lưu câu trả lời của AI
        assistant_message = await chat_message_repository.create(
            user_id=user_id,
            conversation_id=conversation_id,
            role="assistant",
            content=answer,
        )

    except Exception:
        # Câu hỏi vẫn được giữ lại trong lịch sử.
        # Không trả thông tin lỗi nội bộ ra client.
        raise HTTPException(
            status_code=502,
            detail=(
                "AI Tutor không thể xử lý câu hỏi. "
                "Câu hỏi đã được lưu vào lịch sử."
            ),
        )

    # 6. Cập nhật thời gian hoạt động của hội thoại
    await conversation_repository.update_activity(
        conversation_id=conversation_id,
        user_id=user_id,
    )

    return {
        "result": {
            "conversation_id": conversation_id,
            "user_message": {
                "id": str(user_message["_id"]),
                "role": user_message["role"],
                "content": user_message["content"],
                "created_at": user_message["created_at"],
            },
            "assistant_message": {
                "id": str(assistant_message["_id"]),
                "role": assistant_message["role"],
                "content": assistant_message["content"],
                "created_at": assistant_message["created_at"],
            },
            "intent": result.get("intent"),
            "sources": result.get("sources", []),
        }
    }