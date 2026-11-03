import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator

from schemas.chat import ChatRequest, ChatResponse
from services.tutor.tutor_service import TutorService
from services.tutor.grading_service import AutomatedGradingService
from services.tutor.code_analysis_service import CodeAnalysisService
from core.auth import AuthContext, get_current_auth_context, get_optional_auth_context

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/tutor",
    tags=["AI Tutor"],
)

tutor_service = TutorService()
grading_service = AutomatedGradingService()
code_analysis_service = CodeAnalysisService()


class GradeRequest(BaseModel):
    submissionId: str = Field(default="")
    userId: Optional[str] = Field(default=None)
    exerciseId: str = Field(default="")
    sourceCode: str = Field(default="")
    language: Optional[str] = Field(default="java")
    maxScore: Optional[float] = Field(default=100.0)

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        # Hỗ trợ cả camelCase và snake_case, xử lý null an toàn
        submission_id = data.get("submissionId") or data.get("submission_id") or ""
        user_id = data.get("userId") or data.get("user_id") or None
        exercise_id = data.get("exerciseId") or data.get("exercise_id") or ""
        source_code = data.get("sourceCode") or data.get("source_code") or data.get("code") or ""
        language = data.get("language") or "java"
        max_score = data.get("maxScore") if data.get("maxScore") is not None else data.get("max_score")
        if max_score is None:
            max_score = 100.0

        return {
            "submissionId": str(submission_id),
            "userId": str(user_id) if user_id is not None else None,
            "exerciseId": str(exercise_id),
            "sourceCode": str(source_code),
            "language": str(language),
            "maxScore": float(max_score),
        }


class GradeResponse(BaseModel):
    submissionId: str
    score: float
    feedback: str


class CodeErrorAnalysisRequest(BaseModel):
    source_code: str = Field(default="", description="Mã nguồn chương trình")
    error_message: str = Field(default="", description="Thông báo lỗi từ console")
    language: Optional[str] = Field(default="java")

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        source = data.get("source_code") or data.get("sourceCode") or data.get("code") or ""
        error = data.get("error_message") or data.get("errorMessage") or data.get("error") or ""
        lang = data.get("language") or "java"
        return {
            "source_code": str(source),
            "error_message": str(error),
            "language": str(lang),
        }


class CodeErrorAnalysisResponse(BaseModel):
    success: bool
    analysis: str


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    auth: AuthContext = Depends(get_current_auth_context),
):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng nhập câu hỏi.",
        )

    try:
        result = await tutor_service.chat(
            question=question,
            account_id=auth.account_id,
            access_token=auth.access_token,
        )
        return result
    except Exception as exc:
        logger.exception("Chat handling error: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Không thể xử lý yêu cầu, vui lòng thử lại.",
        ) from exc


@router.post("/grade", response_model=GradeResponse)
async def grade_submission(
    request: GradeRequest,
):
    """
    Endpoint chấm điểm tự động cho bài nộp (gọi từ submission-service).
    """
    if not request.submissionId or not request.sourceCode.strip():
        logger.warning(
            "Grade request missing essential fields: submissionId=%s, exerciseId=%s",
            request.submissionId,
            request.exerciseId,
        )
        return GradeResponse(
            submissionId=request.submissionId or "unknown",
            score=0.0,
            feedback="Không thể chấm điểm do thiếu mã bài nộp hoặc mã nguồn rỗng.",
        )

    result = await grading_service.grade_submission(
        submission_id=request.submissionId,
        user_id=request.userId or "",
        exercise_id=request.exerciseId,
        source_code=request.sourceCode,
        language=request.language or "java",
        max_score=request.maxScore or 100.0,
    )

    return result


@router.post("/analyze-error", response_model=CodeErrorAnalysisResponse)
async def analyze_error(
    request: CodeErrorAnalysisRequest,
    auth: Optional[AuthContext] = Depends(get_optional_auth_context),
):
    """
    Endpoint phân tích lỗi code từ console (Use Case b) theo phương pháp Socratic.
    Không ép buộc đăng nhập để đảm bảo người học luôn có thể sửa lỗi code nhanh chóng.
    """
    source_code = request.source_code.strip()
    error_message = request.error_message.strip()

    if not source_code or not error_message:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng nhập câu hỏi.",
        )

    try:
        analysis = await code_analysis_service.analyze_error(
            source_code=source_code,
            error_message=error_message,
            language=request.language or "java",
        )
        return CodeErrorAnalysisResponse(
            success=True,
            analysis=analysis,
        )
    except Exception as exc:
        logger.exception("Analyze code error failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Không thể xử lý yêu cầu, vui lòng thử lại.",
        ) from exc
