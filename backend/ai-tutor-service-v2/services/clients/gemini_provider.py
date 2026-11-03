import asyncio
import logging
from typing import Optional

from google import genai

from core.config import settings

logger = logging.getLogger(__name__)


class GeminiProvider:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL

    async def generate_answer(
        self,
        question: str,
        context: str = "",
        system_instruction: Optional[str] = None,
    ) -> str:
        base_instruction = (
            system_instruction
            or "Bạn là AI Tutor của JLearn, trợ lý học tập lập trình Java và Spring Boot."
        )

        prompt_parts = [base_instruction, f"\n\nCâu hỏi: {question}"]

        if context.strip():
            prompt_parts.append(f"\n\nNgữ cảnh tài liệu bài học:\n{context}")

        prompt_parts.append(
            "\n\nYêu cầu: trả lời chính xác, dễ hiểu, theo văn phong sư phạm, kèm code ví dụ trực quan khi cần thiết."
        )

        full_prompt = "".join(prompt_parts)
        return await self.generate_direct(full_prompt)

    async def generate_direct(
        self,
        prompt: str,
    ) -> str:
        def _call_gemini():
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

        try:
            return await asyncio.to_thread(_call_gemini)
        except Exception:
            logger.exception("Gemini generation failed.")
            raise
