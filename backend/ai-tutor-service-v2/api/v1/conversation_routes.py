import logging

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from core.auth import (
    AuthContext,
    get_current_auth_context,
    get_current_user_id,
)

from domain.conversation import serialize_conversation
from domain.chat_message import serialize_chat_message

from infrastructure.conversation_repository import conversation_repository
from infrastructure.chat_message_repository import chat_message_repository

from schemas.conversation import (
    ConversationCreateRequest,
    ConversationListResponse,
    ChatMessageRequest,
    ChatMessageListResponse,
)

from services.tutor.tutor_service import TutorService


logger = logging.getLogger(__name__)

tutor_service = TutorService()

router = APIRouter(
    prefix="/conversations",
    tags=["AI Tutor - Conversation History"],
)


# =========================================================
# 1. CREATE CONVERSATION
# =========================================================

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


# =========================================================
# 2. LIST USER CONVERSATIONS
# =========================================================

@router.get(
    "",
    response_model=ConversationListResponse,
)
async def list_conversations(
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    user_id: str = Depends(get_current_user_id),
):
    conversations, has_more = await conversation_repository.list_by_user(
        user_id=user_id,
        limit=limit,
        skip=skip,
    )

    return {
        "result": [
            serialize_conversation(conversation)
            for conversation in conversations
        ],
        "has_more": has_more,
    }


# =========================================================
# 3. GET CONVERSATION MESSAGES
# =========================================================

@router.get(
    "/{conversation_id}/messages",
    response_model=ChatMessageListResponse,
)
async def get_conversation_messages(
    conversation_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    before_id: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
):
    # 1. Validate ObjectId
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(
            status_code=400,
            detail="conversation_id không hợp lệ.",
        )

    # 2. Verify conversation ownership
    conversation = await conversation_repository.find_by_id(
        conversation_id=conversation_id,
        user_id=user_id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hội thoại.",
        )

    # 3. Retrieve messages with cursor pagination
    messages, has_more = await chat_message_repository.list_by_conversation(
        user_id=user_id,
        conversation_id=conversation_id,
        limit=limit,
        before_id=before_id,
    )

    return {
        "result": [
            serialize_chat_message(message)
            for message in messages
        ],
        "has_more": has_more,
    }


# =========================================================
# 4. SEND MESSAGE TO AI TUTOR
# =========================================================

@router.post(
    "/{conversation_id}/messages",
    response_model=dict,
)
async def send_message(
    conversation_id: str,
    request: ChatMessageRequest,

    # Xác thực người dùng và lấy JWT
    auth: AuthContext = Depends(get_current_auth_context),
):
    user_id = auth.account_id
    access_token = auth.access_token

    # 1. Validate conversation ID
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(
            status_code=400,
            detail="conversation_id không hợp lệ.",
        )

    # 2. Validate question
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng nhập câu hỏi.",
        )

    # 3. Verify conversation ownership
    conversation = await conversation_repository.find_by_id(
        conversation_id=conversation_id,
        user_id=user_id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hội thoại.",
        )

    # 4. Save user message
    user_message = await chat_message_repository.create(
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=question,
    )

    # 5. Process AI Tutor
    try:
        logger.info(
            "AI Tutor processing started | user_id=%s | conversation_id=%s",
            user_id,
            conversation_id,
        )

        # Truyền access token để truy vấn dữ liệu
        # từ User, Enrollment, Course, Submission Service.
        result = await tutor_service.chat(
            question=question,
            access_token=access_token,
        )

        answer = result.get("answer", "").strip()

        if not answer:
            answer = "Xin lỗi, AI Tutor chưa thể tạo câu trả lời."

        # 6. Save assistant message
        assistant_message = await chat_message_repository.create(
            user_id=user_id,
            conversation_id=conversation_id,
            role="assistant",
            content=answer,
        )

        # 7. Update conversation activity
        await conversation_repository.update_activity(
            conversation_id=conversation_id,
            user_id=user_id,
        )

        logger.info(
            "AI Tutor processing completed | user_id=%s | intent=%s",
            user_id,
            result.get("intent"),
        )

        # 8. Return response
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

    except Exception as exc:
        logger.exception(
            "AI Tutor processing failed | user_id=%s | conversation_id=%s",
            user_id,
            conversation_id,
        )

        # User message vẫn được giữ trong MongoDB.
        # Không trả thông tin lỗi nội bộ ra frontend.
        raise HTTPException(
            status_code=502,
            detail=(
                "Không thể xử lý yêu cầu, vui lòng thử lại."
            ),
        ) from exc
