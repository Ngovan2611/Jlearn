from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


# =========================
# Conversation
# =========================

class ConversationCreateRequest(BaseModel):
    title: str = Field(
        default="Cuộc trò chuyện mới",
        min_length=1,
        max_length=200,
    )


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationListResponse(BaseModel):
    result: list[ConversationResponse]


# =========================
# Chat Message
# =========================

class ChatMessageRequest(BaseModel):
    question: str = Field(
        min_length=1,
        max_length=10000,
    )


class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime


class ChatMessageListResponse(BaseModel):
    result: list[ChatMessageResponse]


# =========================
# Send Message Response
# =========================

class SendMessageResponse(BaseModel):
    conversation_id: str
    question: str
    answer: str
    intent: str
    course_id: str | None = None
    context: str = ""
    sources: list[str] = Field(default_factory=list)
    quality: dict = Field(default_factory=dict)
    can_call_gemini: bool = False
    gemini_used: bool = False