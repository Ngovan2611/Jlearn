import logging

from google import genai

from core.config import settings

logger = logging.getLogger(__name__)


class GeminiProvider:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL

    async def generate_answer(self, question: str, context: str) -> str:
        prompt = (
            "Bạn là AI Tutor của JLearn, trả lời dựa trên ngữ cảnh học tập.\n\n"
            f"Câu hỏi: {question}\n\n"
            f"Ngữ cảnh: {context}\n\n"
            "Yêu cầu: trả lời ngắn gọn, rõ ràng, dễ hiểu và chuyên nghiệp. "
            "Nếu không có đủ thông tin, hãy nói rõ và gợi ý cách tiếp tục."
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            text = getattr(response, "text", None)

            if text:
                return text

            if hasattr(response, "candidates") and response.candidates:
                candidate = response.candidates[0]
                content = getattr(candidate, "content", None)
                if content and hasattr(content, "parts"):
                    parts = []
                    for part in content.parts:
                        if hasattr(part, "text") and part.text:
                            parts.append(part.text)
                    if parts:
                        return "".join(parts)

            return str(response)
        except Exception:
            logger.exception("Gemini generation failed.")
            raise
