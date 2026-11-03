import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from api.v1.personal_route import router as personal_router
from api.v1.router import api_router
from api.v1.tutor_chat import (
    CodeErrorAnalysisRequest,
    CodeErrorAnalysisResponse,
    GradeRequest,
    GradeResponse,
    code_analysis_service,
    grading_service,
)
from core.config import settings
from core.database import connect_mongodb, close_mongodb
from services.knowledge.sync_scheduler import sync_loop

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Kết nối MongoDB
    try:
        await connect_mongodb()
        logger.info("MongoDB connected successfully.")
    except Exception as exc:
        logger.error("Could not connect to MongoDB on startup: %s", exc)

    # Khởi động tác vụ đồng bộ kiến thức nền
    sync_task = asyncio.create_task(sync_loop())
    logger.info("Knowledge sync scheduler started.")

    try:
        yield
    finally:
        sync_task.cancel()
        try:
            await sync_task
        except asyncio.CancelledError:
            pass
        except Exception:
            logger.exception("Knowledge sync scheduler stopped with an error.")
        finally:
            await close_mongodb()
            logger.info("MongoDB connection closed.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Jlearn AI Tutor: Knowledge Engine, "
        "Code Assistant và Automatic Grading."
    ),
    lifespan=lifespan,
)

# Bắt lỗi mất kết nối DB toàn cục theo tài liệu Luồng rẽ nhánh 3
@app.exception_handler(PyMongoError)
async def mongo_exception_handler(request: Request, exc: PyMongoError):
    logger.exception("MongoDB connection/query error: %s", exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "Không thể kết nối tới máy chủ"},
    )


# Bắt lỗi validation 422 và log chi tiết để dễ dàng chẩn đoán
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error("422 Validation Error on %s %s: %s", request.method, request.url, exc.errors())
    try:
        body = await request.body()
        logger.error("Raw request body: %s", body.decode("utf-8", errors="replace"))
    except Exception:
        pass
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


# Đăng ký API router v1
app.include_router(
    api_router,
    prefix=settings.API_PREFIX,
)

app.include_router(
    personal_router,
    prefix=settings.API_PREFIX,
)


# Route kiểm tra trạng thái
@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "UP",
    }


# Aliases cho endpoint chấm điểm từ submission-service
@app.post("/api/ai-tutor/grade", response_model=GradeResponse, tags=["Grading Alias"])
@app.post("/grade", response_model=GradeResponse, tags=["Grading Alias"])
async def grade_alias(request: GradeRequest):
    if not request.submissionId or not request.sourceCode.strip():
        logger.warning(
            "Grade alias missing essential fields: submissionId=%s, exerciseId=%s",
            request.submissionId,
            request.exerciseId,
        )
        return GradeResponse(
            submissionId=request.submissionId or "unknown",
            score=0.0,
            feedback="Không thể chấm điểm do thiếu mã bài nộp hoặc mã nguồn rỗng.",
        )

    return await grading_service.grade_submission(
        submission_id=request.submissionId,
        user_id=request.userId or "",
        exercise_id=request.exerciseId,
        source_code=request.sourceCode,
        language=request.language or "java",
        max_score=request.maxScore or 100.0,
    )


# Aliases cho endpoint phân tích lỗi
@app.post("/api/ai-tutor/analyze-error", response_model=CodeErrorAnalysisResponse, tags=["AI Tutor"])
@app.post("/analyze-error", response_model=CodeErrorAnalysisResponse, tags=["AI Tutor"])
@app.post("/v1/analyze-error", response_model=CodeErrorAnalysisResponse, tags=["AI Tutor"])
@app.post("/api/ai-tutor/v1/tutor/analyze-error", response_model=CodeErrorAnalysisResponse, tags=["AI Tutor"])
async def analyze_error_alias(request: CodeErrorAnalysisRequest):
    source_code = request.source_code.strip()
    error_message = request.error_message.strip()

    if not source_code or not error_message:
        return CodeErrorAnalysisResponse(
            success=False,
            analysis="Vui lòng nhập câu hỏi.",
        )

    analysis = await code_analysis_service.analyze_error(
        source_code=source_code,
        error_message=error_message,
        language=request.language or "java",
    )
    return CodeErrorAnalysisResponse(
        success=True,
        analysis=analysis,
    )
