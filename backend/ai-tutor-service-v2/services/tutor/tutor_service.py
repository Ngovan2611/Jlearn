
import logging

from services.clients.course_service_client import CourseServiceClient
from services.clients.gemini_provider import GeminiProvider
from services.knowledge.knowledge_engine import KnowledgeEngine
from services.tutor.intent_router import IntentRouter


logger = logging.getLogger(__name__)


class TutorService:
    def __init__(self):
        self.knowledge_engine = KnowledgeEngine()
        self.course_client = CourseServiceClient()
        self.intent_router = IntentRouter()
        self.gemini_provider = GeminiProvider()

    async def chat(self, question: str) -> dict:
        question = question.strip()

        if not question:
            raise ValueError("Câu hỏi không được để trống.")

        # 1. Phân loại ý định
        intent = self.intent_router.detect_intent(question)

        # 2. Xử lý lời chào, không cần gọi RAG hoặc Gemini
        if intent == "GREETING":
            answer = (
                "Xin chào! 👋 Mình là JLearn AI Tutor, "
                "trợ lý học tập lập trình của bạn.\n\n"
                "Bạn muốn học Java Core, Spring Boot, "
                "hay cần mình giải thích một đoạn code nào?"
            )

            return {
                "question": question,
                "answer": answer,
                "intent": intent,
                "course_id": None,
                "context": "",
                "sources": [],
                "quality": {
                    "sufficient": True,
                    "coverage": 1.0,
                    "matched_terms": 0,
                    "reason": "Lời chào được xử lý trực tiếp.",
                },
                "can_call_gemini": False,
                "gemini_used": False,
            }

        # 3. Lấy danh sách khóa học từ Course Service
        if intent == "LIST_COURSES":
            courses = await self.course_client.get_published_courses()

            course_lines = []

            for index, course in enumerate(courses, start=1):
                title = course.get("title", "Chưa có tên")
                description = course.get("description", "")

                line = f"{index}. {title}"

                if description:
                    line += f"\n   Mô tả: {description}"

                course_lines.append(line)

            answer = (
                "Các khóa học hiện đang được xuất bản trên JLearn:\n\n"
                + "\n\n".join(course_lines)
                if course_lines
                else "Hiện chưa có khóa học nào được xuất bản."
            )

            return {
                "question": question,
                "answer": answer,
                "intent": intent,
                "course_id": None,
                "context": answer,
                "sources": ["course-service"],
                "quality": {
                    "sufficient": bool(courses),
                    "coverage": 1.0 if courses else 0.0,
                    "matched_terms": 0,
                    "reason": (
                        "Dữ liệu lấy trực tiếp từ Course Service."
                        if courses
                        else "Course Service không có khóa học "
                             "đã xuất bản."
                    ),
                },
                "can_call_gemini": False,
                "gemini_used": False,
            }

        # 4. Truy xuất kiến thức từ RAG
        result = self.knowledge_engine.retrieve(
            question=question,
            course_id=None,
            lesson_id=None,
            top_k=4,
        )

        context = result["context"]
        quality = result["quality"]
        sources = result["sources"]

        can_call_gemini = (
            quality.get("sufficient", False)
            and bool(context.strip())
        )

        # 5. Không gọi Gemini nếu context không đủ chất lượng
        if not can_call_gemini:
            return {
                "question": question,
                "answer": (
                    "Mình chưa tìm thấy đủ kiến thức phù hợp trong "
                    "tài liệu JLearn để trả lời chính xác câu hỏi này. "
                    "Bạn hãy thử diễn đạt cụ thể hơn hoặc hỏi về "
                    "nội dung của một bài học."
                ),
                "intent": intent,
                "course_id": None,
                "context": context,
                "sources": sources,
                "quality": quality,
                "can_call_gemini": False,
                "gemini_used": False,
            }

        # 6. Sinh câu trả lời bằng Gemini
        try:
            answer = await self.gemini_provider.generate_answer(
                question=question,
                context=context,
            )

            return {
                "question": question,
                "answer": answer,
                "intent": intent,
                "course_id": None,
                "context": context,
                "sources": sources,
                "quality": quality,
                "can_call_gemini": True,
                "gemini_used": True,
            }

        except Exception:
            logger.exception("Gemini generation failed.")

            return {
                "question": question,
                "answer": (
                    "AI Tutor hiện chưa thể tạo câu trả lời do lỗi "
                    "dịch vụ AI. Bạn vui lòng thử lại sau."
                ),
                "intent": intent,
                "course_id": None,
                "context": context,
                "sources": sources,
                "quality": quality,
                "can_call_gemini": True,
                "gemini_used": False,
                "error": "GEMINI_GENERATION_FAILED",
            }
