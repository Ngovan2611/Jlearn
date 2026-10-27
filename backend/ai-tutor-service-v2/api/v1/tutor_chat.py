
from fastapi import APIRouter

from schemas.chat import ChatRequest, ChatResponse
from services.tutor.tutor_service import TutorService

router = APIRouter(
    prefix="/tutor",
    tags=["AI Tutor"],
)

tutor_service = TutorService()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    result = await tutor_service.chat(
        question=request.question.strip()
    )

    return result
