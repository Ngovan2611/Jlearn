import asyncio
import json
import logging
import re
from typing import Any
from google import genai
from pydantic import BaseModel, Field

from core.config import settings
from services.clients.exercise_service_client import ExerciseServiceClient

logger = logging.getLogger(__name__)


class GradingResultSchema(BaseModel):
    score: float = Field(..., ge=0, le=100, description="Tổng điểm theo thang 100")
    correctness_score: float = Field(default=30.0, ge=0, le=40, description="Tính đúng đắn logic (tối đa 40)")
    edge_cases_score: float = Field(default=20.0, ge=0, le=25, description="Xử lý biên & ngoại lệ (tối đa 25)")
    clean_code_score: float = Field(default=15.0, ge=0, le=20, description="Chuẩn Clean code & Naming (tối đa 20)")
    efficiency_score: float = Field(default=10.0, ge=0, le=15, description="Tối ưu độ phức tạp thuật toán (tối đa 15)")
    strengths: list[str] = Field(default_factory=list, description="Điểm tốt")
    weaknesses: list[str] = Field(default_factory=list, description="Điểm cần cải thiện")
    suggestions: list[str] = Field(default_factory=list, description="Gợi ý cải tiến cụ thể")
    detailed_feedback: str = Field(..., description="Nhận xét tổng quan")


class AutomatedGradingService:
    def __init__(self):
        self.exercise_client = ExerciseServiceClient()
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL

    async def grade_submission(
        self,
        submission_id: str,
        user_id: str,
        exercise_id: str,
        source_code: str,
        language: str = "java",
        max_score: float = 100.0,
    ) -> dict[str, Any]:
        """
        Chấm điểm tự động cho bài nộp dựa trên đề bài từ exercise-service
        và Rubric 4 tiêu chí chuẩn học thuật.
        """
        logger.info(
            "Grading submission started | submission_id=%s | exercise_id=%s",
            submission_id,
            exercise_id,
        )

        # 1. Lấy thông tin bài tập đối chiếu
        exercise_data = await self.exercise_client.get_exercise_execution_data(exercise_id)
        exercise_title = exercise_data.get("title", f"Bài tập {exercise_id}")
        exercise_desc = exercise_data.get("description", "Không có mô tả chi tiết.")

        prompt = f"""
Bạn là Trợ giảng AI chuyên gia về Lập trình Java tại JLearn.
Hãy chấm điểm và đánh giá chi tiết bài làm của học viên dựa trên thông tin bài tập dưới đây.

THÔNG TIN BÀI TẬP:
- Tiêu đề: {exercise_title}
- Yêu cầu bài toán: {exercise_desc}

MÃ NGUỒN CỦA HỌC VIÊN:
- Ngôn ngữ: {language}
```{language}
{source_code}
```

TIÊU CHÍ CHẤM ĐIỂM (Thang điểm 100):
1. Tính đúng đắn & Logic bài toán (Correctness): tối đa 40 điểm.
2. Xử lý trường hợp biên & ngoại lệ (Edge Cases): tối đa 25 điểm.
3. Clean Code & Java Naming Conventions: tối đa 20 điểm.
4. Tối ưu thuật toán & bộ nhớ (Efficiency): tối đa 15 điểm.
Tổng điểm = 1 + 2 + 3 + 4.

YÊU CẦU: Trả về JSON hợp lệ khớp với cấu trúc sau:
{{
  "score": float (0.0 đến 100.0),
  "correctness_score": float (0.0 đến 40.0),
  "edge_cases_score": float (0.0 đến 25.0),
  "clean_code_score": float (0.0 đến 20.0),
  "efficiency_score": float (0.0 đến 15.0),
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "weaknesses": ["điểm cần cải thiện 1"],
  "suggestions": ["gợi ý khắc phục cụ thể 1"],
  "detailed_feedback": "Lời nhận xét sư phạm chi tiết"
}}
"""

        def _call_gemini():
            return self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": GradingResultSchema,
                    "temperature": 0.2,
                },
            )

        try:
            response = await asyncio.to_thread(_call_gemini)
            raw_text = response.text or "{}"
            parsed_data = json.loads(raw_text)

            score = float(parsed_data.get("score", 70.0))
            # Chuẩn hóa trong khoảng 0 đến max_score
            score = max(0.0, min(max_score, score))

            detailed_fb = parsed_data.get("detailed_feedback", "Bài làm đã được chấm điểm tự động.")
            correctness = parsed_data.get("correctness_score", 0.0)
            edge = parsed_data.get("edge_cases_score", 0.0)
            clean = parsed_data.get("clean_code_score", 0.0)
            efficiency = parsed_data.get("efficiency_score", 0.0)

            strengths = parsed_data.get("strengths") or []
            weaknesses = parsed_data.get("weaknesses") or []
            suggestions = parsed_data.get("suggestions") or []

            lines = [
                f"### 🎯 Kết quả đánh giá tự động: **{score:.1f}/{max_score:.0f} điểm**",
                "",
                f"- **Tính đúng đắn logic:** {correctness:.1f}/40",
                f"- **Xử lý biên & ngoại lệ:** {edge:.1f}/25",
                f"- **Phong cách lập trình (Clean Code):** {clean:.1f}/20",
                f"- **Tối ưu hiệu năng:** {efficiency:.1f}/15",
                "",
                f"**Nhận xét tổng quan:**\n{detailed_fb}",
                "",
            ]

            if strengths:
                lines.append("**Ưu điểm:**")
                for s in strengths:
                    lines.append(f"- {s}")
                lines.append("")

            if weaknesses:
                lines.append("**Cần cải thiện:**")
                for w in weaknesses:
                    lines.append(f"- {w}")
                lines.append("")

            if suggestions:
                lines.append("**Gợi ý khắc phục:**")
                for sg in suggestions:
                    lines.append(f"- {sg}")
                lines.append("")

            feedback_text = "\n".join(lines).strip()

            logger.info(
                "Grading completed successfully | submission_id=%s | score=%.1f",
                submission_id,
                score,
            )

            return {
                "submissionId": submission_id,
                "score": score,
                "feedback": feedback_text,
            }

        except Exception as exc:
            logger.exception("AI grading failed for submission %s: %s", submission_id, exc)
            return {
                "submissionId": submission_id,
                "score": 0.0,
                "feedback": f"Hệ thống AI Tutor tạm thời chưa thể chấm bài này do sự cố kết nối. Vui lòng thử lại sau. (Lỗi: {exc})",
            }
