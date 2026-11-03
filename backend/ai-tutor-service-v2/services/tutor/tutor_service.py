import asyncio
import logging
import re

from services.clients.course_service_client import CourseServiceClient
from services.clients.gemini_provider import GeminiProvider
from services.knowledge.knowledge_engine import KnowledgeEngine
from services.tutor.intent_router import IntentRouter, normalize_text
from services.tutor.code_analysis_service import CodeAnalysisService
from services.personal.personal_context_service import PersonalContextService


logger = logging.getLogger(__name__)


class TutorService:

    PERSONAL_INTENTS = {
        "USER_PROFILE",
        "MY_COURSES",
        "MY_PROGRESS",
        "MY_SUBMISSIONS",
    }

    def __init__(self):
        self.knowledge_engine = KnowledgeEngine()
        self.course_client = CourseServiceClient()
        self.intent_router = IntentRouter()
        self.gemini_provider = GeminiProvider()
        self.personal_context_service = PersonalContextService()
        self.code_analysis_service = CodeAnalysisService()

    async def chat(
        self,
        question: str,
        access_token: str | None = None,
        account_id: str | None = None,
        **kwargs,
    ) -> dict:
        question = (question or "").strip()

        if not question:
            raise ValueError("Vui lòng nhập câu hỏi.")

        # 1. Detect Intent
        intent = self.intent_router.detect_intent(question)
        logger.info("Detected intent: %s | Question: %s", intent, question)

        # 2. Ambiguous questions
        if intent == "AMBIGUOUS":
            return self._handle_ambiguous(question)

        # 3. Greeting
        if intent == "GREETING":
            return self._handle_greeting(question)

        # 4. Code error analysis (Use Case b)
        if intent == "CODE_ERROR_ANALYSIS":
            return await self._handle_code_error_analysis(question)

        # 5. Personal intents (Use Case a)
        if intent in self.PERSONAL_INTENTS:
            if not access_token:
                return self._build_response(
                    question=question,
                    answer=(
                        "Bạn cần đăng nhập vào JLearn để mình "
                        "có thể tra cứu thông tin cá nhân hoặc tiến độ của bạn."
                    ),
                    intent=intent,
                    sources=[],
                    can_call_gemini=False,
                    gemini_used=False,
                    error="AUTHENTICATION_REQUIRED",
                )
            return await self._handle_personal_intent(
                question=question,
                intent=intent,
                access_token=access_token,
            )

        # 6. List courses
        if intent == "LIST_COURSES":
            return await self._handle_list_courses(question)

        # 7. Knowledge questions (RAG with Fallback to Gemini general knowledge)
        if intent == "COURSE_QUESTION":
            return await self._handle_knowledge_question(
                question=question,
                intent=intent,
            )

        # 8. Fallback / Invalid
        return self._handle_invalid(question)

    # =========================================================
    # GREETING
    # =========================================================

    def _handle_greeting(self, question: str) -> dict:
        answer = (
            "Xin chào! 👋 Mình là JLearn AI Tutor, "
            "trợ lý học tập lập trình Java của bạn.\n\n"
            "Bạn có thể:\n"
            "- Hỏi kiến thức Java Core, Spring Boot, OOP...\n"
            "- Chọn tab **🐞 Phân tích lỗi code** để được gợi ý sửa lỗi biên dịch hoặc runtime.\n"
            "- Tra cứu tiến độ học tập, khóa học hoặc điểm số của bạn."
        )
        return self._build_response(
            question=question,
            answer=answer,
            intent="GREETING",
            context="",
            sources=[],
            can_call_gemini=False,
            gemini_used=False,
        )

    # =========================================================
    # AMBIGUOUS
    # =========================================================

    def _handle_ambiguous(self, question: str) -> dict:
        return self._build_response(
            question=question,
            answer=(
                "Bạn có thể đặt câu hỏi chi tiết hơn một chút được không?\n"
                "Ví dụ: 'Giải thích tính kế thừa trong Java', "
                "'Cách xử lý NullPointerException', hoặc "
                "'Tiến độ học tập của tôi hiện tại như thế nào?'"
            ),
            intent="AMBIGUOUS",
            context="",
            sources=[],
            can_call_gemini=False,
            gemini_used=False,
        )

    # =========================================================
    # CODE ERROR ANALYSIS (Use Case b)
    # =========================================================

    async def _handle_code_error_analysis(self, question: str) -> dict:
        source_code = ""
        error_message = ""

        # Dạng 1: Format có cấu trúc từ widget
        if "[Yêu cầu phân tích lỗi]" in question or "Mã nguồn:" in question:
            code_match = re.search(
                r"Mã nguồn:\s*\n```(?:java)?\s*([\s\S]*?)```",
                question,
                re.IGNORECASE,
            )
            if code_match:
                source_code = code_match.group(1).strip()

            error_match = re.search(
                r"Thông báo lỗi.*:\s*\n```(?:text)?\s*([\s\S]*?)```",
                question,
                re.IGNORECASE,
            )
            if error_match:
                error_message = error_match.group(1).strip()

        # Dạng 2: Khối code markdown
        if not source_code:
            code_blocks = re.findall(
                r"```(?:java)?\s*([\s\S]*?)```",
                question,
                re.IGNORECASE,
            )
            if len(code_blocks) >= 2:
                source_code = code_blocks[0].strip()
                error_message = code_blocks[1].strip()
            elif len(code_blocks) == 1:
                source_code = code_blocks[0].strip()
                error_message = re.sub(r"```[\s\S]*?```", "", question).strip()

        # Dạng 3: Câu hỏi chung chung
        if not source_code and not error_message:
            norm = normalize_text(question)
            generic_phrases = [
                "phan tich loi giup",
                "phan tich loi trong code",
                "phan tich loi code",
                "huong dan sua loi",
                "giup toi sua loi",
                "sua loi code",
                "code bi loi",
            ]
            if any(p in norm for p in generic_phrases) and len(question.strip().split()) < 15:
                return self._build_response(
                    question=question,
                    answer=(
                        "Chào bạn! Để mình phân tích lỗi giúp bạn theo phương pháp gợi mở (Socratic), bạn hãy cung cấp:\n"
                        "1. **Mã nguồn (Java)** bạn đang viết.\n"
                        "2. **Thông báo lỗi từ console** (biên dịch hoặc runtime).\n\n"
                        "*(Mẹo: Bạn có thể bấm vào tab **🐞 Phân tích lỗi code** ở thanh trên để dán mã nguồn và lỗi thuận tiện nhất nhé!)*"
                    ),
                    intent="CODE_ERROR_ANALYSIS",
                    sources=[],
                    can_call_gemini=False,
                    gemini_used=False,
                )

            source_code = question
            error_message = "Vui lòng xem chi tiết mã nguồn và thông báo lỗi trong đoạn văn bản trên."

        try:
            analysis = await self.code_analysis_service.analyze_error(
                source_code=source_code or question,
                error_message=error_message or "Lỗi được mô tả trong câu hỏi.",
                language="java",
            )
            return self._build_response(
                question=question,
                answer=analysis,
                intent="CODE_ERROR_ANALYSIS",
                sources=["code-analysis-service"],
                can_call_gemini=True,
                gemini_used=True,
            )
        except Exception as exc:
            logger.exception("Code analysis error: %s", exc)
            return self._build_response(
                question=question,
                answer="Không thể xử lý yêu cầu, vui lòng thử lại.",
                intent="CODE_ERROR_ANALYSIS",
                sources=[],
                can_call_gemini=False,
                gemini_used=False,
                error="ANALYSIS_FAILED",
            )

    # =========================================================
    # PERSONAL INTENTS (Use Case a)
    # =========================================================

    async def _handle_personal_intent(
        self,
        question: str,
        intent: str,
        access_token: str,
    ) -> dict:
        try:
            raw_data = ""
            if intent == "USER_PROFILE":
                data = await self.personal_context_service.get_user_profile(access_token)
                raw_data = f"Thông tin hồ sơ: {data}"
            elif intent == "MY_COURSES":
                data = await self.personal_context_service.get_my_courses(access_token)
                raw_data = f"Danh sách khóa học: {data}"
            elif intent == "MY_PROGRESS":
                data = await self.personal_context_service.get_my_learning_progress(access_token)
                raw_data = f"Tiến độ học tập: {data}"
            elif intent == "MY_SUBMISSIONS":
                data = await self.personal_context_service.get_my_submissions(access_token)
                raw_data = f"Lịch sử bài nộp và điểm số: {data}"

            system_instruction = (
                "Bạn là JLearn AI Tutor. Dưới đây là dữ liệu thực tế của học viên từ hệ thống JLearn. "
                "Hãy đọc dữ liệu này và trả lời câu hỏi của học viên một cách thân thiện, chính xác, súc tích bằng tiếng Việt."
            )

            prompt = f"Dữ liệu hệ thống:\n{raw_data}\n\nCâu hỏi của học viên: {question}"

            answer = await self.gemini_provider.generate_answer(
                question=prompt,
                context=raw_data,
                system_instruction=system_instruction,
            )

            return self._build_response(
                question=question,
                answer=answer,
                intent=intent,
                context=raw_data,
                sources=["personal-context-service"],
                can_call_gemini=True,
                gemini_used=True,
            )
        except Exception as exc:
            logger.exception("Personal intent handling error: %s", exc)
            return self._build_response(
                question=question,
                answer="Không thể xử lý yêu cầu, vui lòng thử lại.",
                intent=intent,
                sources=[],
                can_call_gemini=False,
                gemini_used=False,
                error="PERSONAL_INTENT_FAILED",
            )

    # =========================================================
    # LIST COURSES
    # =========================================================

    async def _handle_list_courses(self, question: str) -> dict:
        courses = await self.course_client.get_published_courses()
        course_lines = []

        for index, course in enumerate(courses, start=1):
            title = course.get("title", "Chưa có tên")
            description = course.get("description", "")
            line = f"{index}. **{title}**"
            if description:
                line += f" - {description}"
            course_lines.append(line)

        answer = (
            "Các khóa học hiện có trên JLearn:\n\n"
            + "\n".join(course_lines)
            if course_lines
            else "Hiện chưa có khóa học nào được xuất bản."
        )

        return self._build_response(
            question=question,
            answer=answer,
            intent="LIST_COURSES",
            context=answer,
            sources=["course-service"],
            can_call_gemini=False,
            gemini_used=False,
        )

    # =========================================================
    # KNOWLEDGE QUESTION (RAG + Fallback)
    # =========================================================

    async def _handle_knowledge_question(
        self,
        question: str,
        intent: str,
    ) -> dict:
        result = self.knowledge_engine.retrieve(
            question=question,
            course_id=None,
            lesson_id=None,
            top_k=4,
        )

        context = result.get("context") or ""
        quality = result.get("quality") or {}
        sources = result.get("sources") or []

        has_course_context = quality.get("sufficient", False) and bool(context.strip())

        try:
            if has_course_context:
                system_instruction = (
                    "Bạn là AI Tutor của JLearn. Hãy ưu tiên trả lời dựa trên ngữ cảnh khóa học sau."
                )
                used_sources = sources
            else:
                system_instruction = (
                    "Bạn là AI Tutor của JLearn. Câu hỏi của học viên là về lập trình Java hoặc công nghệ liên quan. "
                    "Hãy trả lời chính xác, theo văn phong sư phạm, giải thích rõ ràng và kèm ví dụ minh họa bằng code Java khi cần thiết."
                )
                used_sources = ["general-java-knowledge"]

            answer = await self.gemini_provider.generate_answer(
                question=question,
                context=context if has_course_context else "",
                system_instruction=system_instruction,
            )

            return self._build_response(
                question=question,
                answer=answer,
                intent=intent,
                context=context,
                sources=used_sources,
                can_call_gemini=True,
                gemini_used=True,
            )

        except Exception:
            logger.exception("Gemini generation failed.")
            return self._build_response(
                question=question,
                answer="Không thể xử lý yêu cầu, vui lòng thử lại.",
                intent=intent,
                context=context,
                sources=sources,
                can_call_gemini=True,
                gemini_used=False,
                error="GEMINI_GENERATION_FAILED",
            )

    # =========================================================
    # INVALID QUESTION
    # =========================================================

    def _handle_invalid(self, question: str) -> dict:
        return self._build_response(
            question=question,
            answer=(
                "Mình chưa xác định được yêu cầu của bạn.\n\n"
                "Bạn có thể đặt câu hỏi cụ thể hơn về:\n"
                "- Kiến thức Java Core và lập trình hướng đối tượng (OOP).\n"
                "- Spring Boot, Microservices, CSDL (MySQL, MongoDB, Redis).\n"
                "- Bấm vào tab **🐞 Phân tích lỗi code** để gửi code và lỗi console.\n"
                "- Tra cứu tiến độ học tập hoặc điểm số của bạn trên JLearn."
            ),
            intent="INVALID",
            context="",
            sources=[],
            can_call_gemini=False,
            gemini_used=False,
            error="INVALID_QUESTION",
        )

    # =========================================================
    # COMMON RESPONSE BUILDER
    # =========================================================

    @staticmethod
    def _build_response(
        question: str,
        answer: str,
        intent: str,
        context: str = "",
        sources: list | None = None,
        can_call_gemini: bool = False,
        gemini_used: bool = False,
        error: str | None = None,
    ) -> dict:
        response = {
            "question": question,
            "answer": answer,
            "intent": intent,
            "course_id": None,
            "context": context,
            "sources": sources or [],
            "can_call_gemini": can_call_gemini,
            "gemini_used": gemini_used,
        }

        if error:
            response["error"] = error

        return response
