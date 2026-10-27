
import hashlib
import re
from html import unescape

from services.clients.course_service_client import CourseServiceClient
from services.knowledge.vector_store import VectorStore


class IndexingService:
    CHUNK_SIZE = 1200
    CHUNK_OVERLAP = 200

    def __init__(self):
        self.course_client = CourseServiceClient()
        self.vector_store = VectorStore()

    @staticmethod
    def clean_text(value: str) -> str:
        value = unescape(value)
        value = re.sub(
            r"<(script|style)\b[^>]*>.*?</\1>",
            " ",
            value,
            flags=re.IGNORECASE | re.DOTALL,
        )
        value = re.sub(r"<[^>]+>", " ", value)
        value = re.sub(r"\s+", " ", value)
        return value.strip()

    def split_text(self, text: str) -> list[str]:
        text = text.strip()

        if not text:
            return []

        chunks = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = min(start + self.CHUNK_SIZE, text_length)

            # Ưu tiên cắt tại khoảng trắng để tránh cắt giữa từ.
            if end < text_length:
                boundary = text.rfind(" ", start, end)
                if boundary > start:
                    end = boundary

            chunk = text[start:end].strip()

            if chunk:
                chunks.append(chunk)

            if end >= text_length:
                break

            next_start = max(end - self.CHUNK_OVERLAP, start + 1)

            # Tránh bắt đầu giữa một từ.
            while (
                next_start < text_length
                and not text[next_start - 1].isspace()
                and not text[next_start].isspace()
            ):
                next_start += 1

            start = next_start

        return chunks

    @staticmethod
    def make_chunk_id(
        course_id: str,
        lesson_id: str,
        chunk_index: int,
    ) -> str:
        raw = f"{course_id}:{lesson_id}:{chunk_index}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    async def index_lesson(
    self,
    course_id: str,
    lesson: dict,
    course_title: str | None = None,
    ) -> int:
        lesson_id = str(lesson.get("id") or "").strip()

        if not lesson_id:
            print("Bỏ qua bài học không có ID.")
            return 0

        if lesson.get("published") is False:
            print(f"Bỏ qua bài học chưa xuất bản: {lesson_id}")
            return 0

        title = self.clean_text(str(lesson.get("title") or ""))
        description = self.clean_text(
            str(lesson.get("description") or "")
        )
        content = self.clean_text(
            str(lesson.get("content") or "")
        )

        # Không index chỉ dựa trên tiêu đề.
        if not content:
            print(
                f"Bỏ qua bài học không có content: "
                f"{title or lesson_id}"
            )
            return 0

        document_text = (
            f"Khóa học: {course_id}\n"
            f"Bài học: {title}\n"
            f"Mô tả: {description}\n"
            f"Nội dung:\n{content}"
        ).strip()

        text_chunks = self.split_text(document_text)

        chunks = []

        for index, chunk_text in enumerate(text_chunks):
            chunk_id = self.make_chunk_id(
                course_id,
                lesson_id,
                index,
            )

            chunks.append({
                "id": chunk_id,
                "content": chunk_text,
                "metadata": {
                    "course_id": str(course_id),
                    "course_title": course_title or str(course_id),
                    "lesson_id": lesson_id,
                    "lesson_title": title or lesson_id,
                    "source": f"course:{course_id}/lesson:{lesson_id}",
                    "chunk_index": index,
                },
            })

        # Ghi trước, sau đó mới dọn các chunk không còn sử dụng.
        self.vector_store.upsert_chunks(chunks)

        self.vector_store.delete_stale_chunks(
            course_id=course_id,
            lesson_id=lesson_id,
            valid_ids=[chunk["id"] for chunk in chunks],
        )

        return len(chunks)

    async def index_all(self) -> dict:
        courses = await self.course_client.get_published_courses()

        total_lessons = 0
        total_chunks = 0
        failed_courses = []

        for course in courses:
            course_id = str(course.get("id") or "").strip()
            course_title = course.get("title") or course_id

            if not course_id:
                print("Bỏ qua khóa học không có ID.")
                continue

            print(f"\nĐang index khóa học: {course_title}")

            try:
                lessons = await self.course_client.get_course_lessons(
                    course_id
                )

                for lesson in lessons:
                    total_lessons += 1

                    try:
                        count = await self.index_lesson(
                            course_id,
                            lesson,
                            course_title=course_title,
                        )
                        total_chunks += count

                        print(
                            f"  {lesson.get('title', lesson.get('id'))}: "
                            f"{count} chunks"
                        )
                    except Exception as exc:
                        print(
                            f"  Lỗi index bài học "
                            f"{lesson.get('id')}: {exc}"
                        )

            except Exception as exc:
                failed_courses.append(course_id)
                print(f"Lỗi lấy bài học khóa {course_id}: {exc}")

        return {
            "courses": len(courses),
            "lessons_processed": total_lessons,
            "chunks_written": total_chunks,
            "collection_count": self.vector_store.collection.count(),
            "failed_courses": failed_courses,
        }
