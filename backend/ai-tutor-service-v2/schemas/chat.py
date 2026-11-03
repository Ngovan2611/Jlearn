
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Câu hỏi gửi đến AI Tutor",
    )


class ChatResponse(BaseModel):
    question: str
    answer: str
    intent: str
    course_id: str | None = None
    context: str = ""
    sources: list[str] = Field(default_factory=list)
    quality: dict = Field(default_factory=dict)
    can_call_gemini: bool = False
    gemini_used: bool = False
