
import unicodedata

from services.clients.course_service_client import (
    CourseServiceClient,
)


def normalize_text(text: str) -> str:
    text = text.casefold().strip()
    text = unicodedata.normalize("NFD", text)

    text = "".join(
        char
        for char in text
        if unicodedata.category(char) != "Mn"
    )

    return text.replace("đ", "d")


class CourseLessonResolver:
    def __init__(self):
        self.course_client = CourseServiceClient()

    async def get_lessons(
        self,
        course_id: str,
    ) -> list[dict]:
        lessons = await self.course_client.get_course_lessons(
            course_id
        )

        return sorted(
            [
                lesson
                for lesson in lessons
                if lesson.get("published", False)
            ],
            key=lambda lesson: lesson.get("lessonOrder") or 0,
        )

    async def resolve_by_order(
        self,
        course_id: str,
        lesson_order: int,
    ) -> dict | None:
        lessons = await self.get_lessons(course_id)

        return next(
            (
                lesson
                for lesson in lessons
                if lesson.get("lessonOrder") == lesson_order
            ),
            None,
        )

    async def resolve_by_title(
        self,
        course_id: str,
        title: str,
    ) -> dict | None:
        lessons = await self.get_lessons(course_id)
        target = normalize_text(title)

        # Ưu tiên tiêu đề trùng hoàn toàn.
        for lesson in lessons:
            lesson_title = normalize_text(
                lesson.get("title", "")
            )

            if lesson_title == target:
                return lesson

        # Hỗ trợ trường hợp người dùng chỉ nhập một phần tên bài.
        matches = [
            lesson
            for lesson in lessons
            if target
            and target in normalize_text(
                lesson.get("title", "")
            )
        ]

        # Không tự chọn nếu có nhiều bài cùng khớp.
        return matches[0] if len(matches) == 1 else None
