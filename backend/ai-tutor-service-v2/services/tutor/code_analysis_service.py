import asyncio
import logging
from google import genai

from core.config import settings

logger = logging.getLogger(__name__)


class CodeAnalysisService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL

    async def analyze_error(
        self,
        source_code: str,
        error_message: str,
        language: str = "java",
    ) -> str:
        """
        Phân tích nguyên nhân lỗi biên dịch hoặc thực thi (console error)
        theo phương pháp Socratic, đưa ra câu hỏi và gợi ý hướng dẫn người học tự sửa.
        """
        prompt = f"""
Bạn là AI Tutor dạy lập trình Java của JLearn.
Người dùng đang gặp lỗi khi biên dịch hoặc chạy chương trình Java và cần bạn phân tích lỗi.

MÃ NGUỒN CỦA HỌC VIÊN:
```{language}
{source_code}
```

THÔNG BÁO LỖI TỪ CONSOLE:
```text
{error_message}
```

HƯỚNG DẪN XỬ LÝ (Tuân thủ phương pháp Socratic - Gợi mở):
1. **Xác định loại lỗi**: Nêu rõ loại lỗi (ví dụ: NullPointerException, IndexOutOfBoundsException, Compilation Error, Type Mismatch...) và vị trí dòng lệnh xảy ra lỗi (dựa trên Stack Trace hoặc code).
2. **Giải thích nguyên nhân**: Giải thích vì sao Java ném ra lỗi này trong ngữ cảnh đoạn code trên bằng ngôn ngữ dễ hiểu, súc tích.
3. **Gợi ý tự khắc phục (Socratic Hints)**:
   - Đặt 1-2 câu hỏi gợi mở để người học tự tư duy xem giá trị biến nào chưa được khởi tạo, chỉ số nào vượt mảng, hoặc hàm nào bị gọi sai.
   - Đưa ra các bước kiểm tra (Checklist) để học viên tự rà soát lại code của mình.
4. **Không đưa toàn bộ code sửa sẵn** để học viên tự rèn luyện kỹ năng debug, trừ khi có cú pháp chuẩn Java cần minh họa.
5. Luôn giữ thái độ động viên, tích cực.
"""

        def _call_gemini():
            return self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={"temperature": 0.3},
            )

        try:
            response = await asyncio.to_thread(_call_gemini)
            return response.text or "AI Tutor chưa thể phân tích lỗi này."
        except Exception as exc:
            logger.exception("Code error analysis failed: %s", exc)
            raise RuntimeError("Không thể xử lý yêu cầu, vui lòng thử lại.") from exc
