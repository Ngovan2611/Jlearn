
import re
import unicodedata


def normalize_text(text: str) -> str:
    text = text.casefold()
    text = unicodedata.normalize("NFD", text)

    text = "".join(
        char
        for char in text
        if unicodedata.category(char) != "Mn"
    )

    # Chuẩn hóa chữ đ thành d
    return text.replace("đ", "d")


class IntentRouter:
    GREETING_PATTERNS = {
        "hello",
        "hi",
        "hey",
        "hello there",
        "hi there",
        "xin chao",
        "chao",
        "chao ban",
        "chao ai",
        "alo",
        "good morning",
        "good afternoon",
        "good evening",
    }

    def detect_intent(self, question: str) -> str:
        normalized = normalize_text(question).strip()

        # 1. Nhận diện lời chào
        # Loại bỏ dấu câu ở cuối câu trước khi so sánh
        greeting_text = re.sub(r"[!?.,;:]+$", "", normalized).strip()

        if greeting_text in self.GREETING_PATTERNS:
            return "GREETING"

        # 2. Nhận diện yêu cầu liệt kê khóa học
        list_courses_patterns = [
            r"\bnhung khoa hoc nao\b",
            r"\bdanh sach khoa hoc\b",
            r"\bliet ke khoa hoc\b",
            r"\bcac khoa hoc\b",
            r"\bjlearn co khoa hoc gi\b",
        ]

        if any(
            re.search(pattern, normalized)
            for pattern in list_courses_patterns
        ):
            return "LIST_COURSES"

        # 3. Giữ các nhánh phân loại intent cũ tại đây
        return "COURSE_QUESTION"
