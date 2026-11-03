
import re
import unicodedata


def normalize_text(text: str) -> str:
    """
    Chuẩn hóa văn bản:
    - Chuyển chữ thường.
    - Loại bỏ dấu tiếng Việt.
    - Chuyển đ thành d.
    - Chuẩn hóa khoảng trắng.
    """

    text = (text or "").casefold().strip()
    text = unicodedata.normalize("NFD", text)

    text = "".join(
        char
        for char in text
        if unicodedata.category(char) != "Mn"
    )

    text = text.replace("đ", "d")

    return re.sub(r"\s+", " ", text)


class IntentRouter:

    # =====================================================
    # 1. GREETING
    # =====================================================

    GREETING_PATTERNS = [
        r"^(hello|hi|hey)$",
        r"^(xin chao|chao|chao ban|chao ai)$",
        r"^alo$",
        r"^good morning$",
        r"^good afternoon$",
        r"^good evening$",
    ]

    # =====================================================
    # 2. AMBIGUOUS QUESTIONS
    # =====================================================

    # Chỉ nhận diện những câu quá ngắn hoặc chưa có chủ đề.
    # Ví dụ: "học", "tôi muốn học", "giúp tôi".

    AMBIGUOUS_PATTERNS = [
        r"^hoc$",
        r"^toi muon hoc$",
        r"^toi dang hoc$",
        r"^toi can hoc$",
        r"^muon hoc$",
        r"^dang hoc$",
        r"^can hoc$",
        r"^toi muon hoc gi$",
        r"^toi can hoc gi$",
        r"^toi muon hoc them$",
        r"^hoc gi bay gio$",
        r"^giup toi hoc$",
        r"^toi muon tim hieu$",
        r"^toi can giup do$",
        r"^giup toi$",
        r"^toi muon hoi$",
        r"^toi co mot cau hoi$",
        r"^toi co dieu muon hoi$",
        r"^java$",
        r"^spring boot$",
        r"^oop$",
        r"^code$",
        r"^lap trinh$",
        r"^bai tap$",
        r"^diem so$",
    ]

    # =====================================================
    # 3. USER PROFILE
    # =====================================================

    PROFILE_INFO_PATTERN = (
        r"\b(thong tin ca nhan|thong tin tai khoan|"
        r"ho so|profile|thong tin cua toi)\b"
    )

    PROFILE_NAME_PATTERN = (
        r"\b(ten|ho ten|toi la ai|"
        r"toi ten gi|ten tai khoan)\b"
    )

    PROFILE_EMAIL_PATTERN = (
        r"\b(email|gmail|thu dien tu|dia chi email)\b"
    )

    PROFILE_DOB_PATTERN = (
        r"\b(ngay sinh|sinh nhat|dob)\b"
    )

    PROFILE_GENDER_PATTERN = (
        r"\b(gioi tinh|nam hay nu)\b"
    )

    PROFILE_SKILL_PATTERN = (
        r"\b(ky nang|skills|ky nang lap trinh)\b"
    )

    PROFILE_AVATAR_PATTERN = (
        r"\b(anh dai dien|avatar)\b"
    )

    USER_PROFILE_PATTERNS = [
        # Hỏi hồ sơ tổng quát
        r"\btoi la ai\b",
        r"\bban biet gi ve toi\b",
        r"\bthong tin ca nhan\b",
        r"\bthong tin tai khoan\b",
        r"\bho so cua toi\b",
        r"\bprofile cua toi\b",
        r"\bxem profile\b",
        r"\bcho toi xem ho so\b",
        r"\bcho toi xem thong tin\b",

        # Hỏi họ tên
        r"\bten cua toi\b",
        r"\btoi ten gi\b",
        r"\btoi ten la gi\b",
        r"\bho ten cua toi\b",
        r"\bten tai khoan cua toi\b",

        # Hỏi email
        r"\bemail cua toi\b",
        r"\btoi dung email nao\b",
        r"\bdia chi email cua toi\b",
        r"\bgmail cua toi\b",

        # Hỏi ngày sinh
        r"\bngay sinh cua toi\b",
        r"\btoi sinh ngay nao\b",
        r"\bsinh nhat cua toi\b",
        r"\bdob cua toi\b",

        # Hỏi giới tính
        r"\bgioi tinh cua toi\b",
        r"\btoi la nam hay nu\b",

        # Hỏi kỹ năng
        r"\bky nang cua toi\b",
        r"\btoi co ky nang gi\b",
        r"\bskills cua toi\b",

        # Hỏi ảnh đại diện
        r"\banh dai dien cua toi\b",
        r"\bavatar cua toi\b",
    ]

    # =====================================================
    # 4. MY COURSES
    # =====================================================

    MY_COURSES_PATTERNS = [
        r"\b(khoa hoc|course|courses)\b.*\b(cua toi|toi da|toi dang|toi co|toi tham gia|toi dang ky)\b",
        r"\b(toi da|toi dang|toi muon xem|toi muon biet)\b.*\b(khoa hoc|course)\b",
        r"\b(khoa hoc)\b.*\b(tham gia|dang ky|da hoc|dang hoc|cua minh|cua toi)\b",
        r"\btoi hoc nhung khoa hoc gi\b",
        r"\btoi da mua khoa hoc nao\b",
        r"\btoi co bao nhieu khoa hoc\b",
    ]

    # =====================================================
    # 5. MY LEARNING PROGRESS
    # =====================================================

    MY_PROGRESS_PATTERNS = [
        r"\b(tien do|phan tram hoan thanh|tinh hinh hoc tap)\b",
        r"\btoi da hoc duoc bao nhieu\b",
        r"\btoi hoc duoc bao nhieu phan tram\b",
        r"\btoi da hoan thanh bao nhieu\b",
        r"\btoi dang hoc den dau\b",
        r"\btoi hoc den dau roi\b",
        r"\btoi con bao nhieu bai\b",
        r"\btoi da hoc nhung bai nao\b",
        r"\btoi con bao nhieu bai hoc chua hoc\b",
        r"\bkhoa hoc nao toi chua hoan thanh\b",
        r"\btoi da hoan thanh khoa hoc nao\b",
        r"\btoi da hoc bao nhieu bai\b",
    ]

    # =====================================================
    # 6. MY SUBMISSIONS / SCORES
    # =====================================================

    # Nhóm từ khóa về điểm và kết quả bài tập.

    SUBMISSION_SCORE_PATTERN = (
        r"\b(diem|diem so|ket qua|diem trung binh|"
        r"tong diem|xep loai|danh gia)\b"
    )

    # Nhóm từ khóa về hành động tra cứu.

    SUBMISSION_ACTION_PATTERN = (
        r"\b(tra cuu|kiem tra|xem|cho biet|"
        r"bao nhieu|thong ke|tim|lay|hien thi)\b"
    )

    # Nhóm từ khóa về bài tập và bài nộp.

    SUBMISSION_OBJECT_PATTERN = (
        r"\b(bai tap|bai nop|bai lam|submission|"
        r"bai kiem tra|bai thuc hanh|lan nop)\b"
    )

    MY_SUBMISSIONS_PATTERNS = [
        # Hỏi điểm, kết quả và hành động tra cứu.
        # Ví dụ:
        # "Bạn tra cứu giúp tôi điểm số được không?"
        # "Tôi muốn kiểm tra điểm bài tập."
        # "Cho tôi biết kết quả bài nộp."

        r"(?=.*" + SUBMISSION_SCORE_PATTERN + r")"
        r"(?=.*" + SUBMISSION_ACTION_PATTERN + r").*",

        # Hỏi điểm/kết quả gắn với bài tập hoặc bài nộp.
        r"(?=.*" + SUBMISSION_SCORE_PATTERN + r")"
        r"(?=.*" + SUBMISSION_OBJECT_PATTERN + r").*",

        # Hỏi lịch sử nộp bài.
        r"\b(lich su|danh sach|thong ke)\b.*"
        r"\b(bai nop|nop bai|bai tap|submission)\b",

        # Hỏi tình trạng chấm bài.
        r"\b(bai tap|bai nop)\b.*"
        r"\b(cham|duoc cham|chua cham|cho cham|ket qua)\b",

        # Hỏi những bài đã nộp.
        r"\btoi\b.*\b(da nop|nop)\b.*"
        r"\b(bai tap|bai|submission)\b",

        # Tra cứu bài nộp theo ID.
        r"\b(submission id|bai nop id|bai nop co id)\b",

        # Các cách hỏi điểm phổ biến.
        r"\btoi duoc bao nhieu diem\b",
        r"\btoi dat bao nhieu diem\b",
        r"\bdiem so cua toi\b",
        r"\bdiem bai tap cua toi\b",
        r"\bket qua bai nop cua toi\b",
        r"\btoi lam dung bao nhieu bai\b",
        r"\btoi lam sai bao nhieu bai\b",
    ]

    # =====================================================
    # 7. LIST PUBLISHED COURSES
    # =====================================================

    LIST_COURSES_PATTERNS = [
        r"\b(danh sach|liet ke)\b.*\b(khoa hoc|course)\b",
        r"\b(khoa hoc|course)\b.*\b(hien co|dang mo|duoc mo|duoc xuat ban)\b",
        r"\bjlearn\b.*\b(co|hien co)\b.*\bkhoa hoc\b",
        r"\bnen hoc khoa hoc nao\b",
        r"\bnhung khoa hoc nao\b",
        r"\bcac khoa hoc hien co\b",
    ]

    # =====================================================
    # 8. COURSE / PROGRAMMING KNOWLEDGE
    # =====================================================

    # Chỉ nhận câu hỏi kiến thức khi có chủ đề cụ thể
    # và có dấu hiệu muốn học, hỏi hoặc tìm hiểu.

    KNOWLEDGE_TOPICS = (
        r"java|spring|spring boot|spring mvc|spring security|"
        r"hibernate|jpa|jdbc|mysql|mongodb|redis|"
        r"microservices|api gateway|rest api|restful api|"
        r"docker|kubernetes|git|github|maven|gradle|"
        r"oop|lap trinh huong doi tuong|"
        r"ke thua|dong goi|da hinh|truu tuong|"
        r"class|object|interface|abstract class|"
        r"vong lap|for loop|while loop|do while|"
        r"if else|switch case|cau lenh dieu kien|"
        r"mang|array|list|arraylist|linkedlist|"
        r"map|hashmap|set|hashset|"
        r"string|stringbuilder|exception|"
        r"xu ly ngoai le|try catch|"
        r"ham|method|constructor|"
        r"bien|variable|datatype|kieu du lieu|"
        r"toan tu|operator|"
        r"thuat toan|algorithm|"
        r"sap xep|tim kiem|sort|search|"
        r"de quy|recursion|"
        r"cau truc du lieu|data structure|"
        r"stack|queue|tree|graph|"
        r"sql|database|co so du lieu|"
        r"transaction|index|"
        r"authentication|authorization|jwt|"
        r"react|javascript|typescript|html|css|"
        r"python|flutter|android|"
        r"thread|multithreading|concurrency|"
        r"stream api|lambda expression|"
        r"functional interface|"
        r"solid|design pattern|mvc|"
        r"dependency injection|ioc"
    )

    KNOWLEDGE_ACTIONS = (
        r"la gi|nghia la gi|hoat dong nhu the nao|"
        r"la nhu the nao|cach dung|cach su dung|"
        r"cach viet|cach tao|cach khai bao|"
        r"giai thich|trinh bay|phan biet|"
        r"so sanh|vi du|minh hoa|"
        r"tai sao|khi nao|"
        r"hoc|tim hieu|huong dan|"
        r"ap dung|su dung|"
        r"viet code|code nhu the nao|"
        r"khac nhau|co tac dung gi|"
        r"uu diem|nhuoc diem|"
        r"cu phap|syntax|"
        r"loi|error|exception"
    )

    COURSE_QUESTION_PATTERNS = [
        # Có chủ đề + hành động hỏi/tìm hiểu.
        (
            r"(?=.*\b(" + KNOWLEDGE_TOPICS + r")\b)"
            r"(?=.*\b(" + KNOWLEDGE_ACTIONS + r")\b).*"
        ),

        # Dạng câu hỏi trực tiếp về chủ đề.
        (
            r"\b(" + KNOWLEDGE_TOPICS + r")\b.*"
            r"\b(la gi|hoat dong|cach|tai sao|vi du|"
            r"khac nhau|co tac dung|nhu the nao)\b"
        ),

        # Dạng câu hỏi có chủ đề đứng sau động từ.
        (
            r"\b(giai thich|phan biet|so sanh|huong dan|"
            r"day|hoc|tim hieu)\b.*"
            r"\b(" + KNOWLEDGE_TOPICS + r")\b"
        ),
    ]

    # =====================================================
    # 8b. CODE ERROR ANALYSIS (Use Case b)
    # =====================================================

    CODE_ERROR_PATTERNS = [
        r"\[yeu cau phan tich loi\]",
        r"\b(phan tich|tim|sua|check|kiem tra|fix|debug)\b.*\b(loi|error|bug|exception|stack trace)\b",
        r"\b(loi|error|exception|bug)\b.*\b(bien dich|runtime|console|code|giup|ho|sao|the nao)\b",
        r"\b(tai sao|sao|vi sao)\b.*\b(loi|error|exception|bug|chay khong duoc|khong chay duoc)\b",
        r"\b(nullpointerexception|arrayindexoutofboundsexception|classcastexception|stackoverflowerror|numberformatexception|outofmemoryerror|compilation error|compile error)\b",
        r"\b(phan tich loi trong code|phan tich loi code|phan tich loi|huong dan sua loi)\b",
        r"\b(code bi loi|chuong trinh bi loi|gap loi nay|loi nay la gi)\b",
    ]

    # =====================================================
    # 9. MATCH HELPER
    # =====================================================

    @staticmethod
    def _matches(
        text: str,
        patterns: list[str],
    ) -> bool:

        return any(
            re.search(pattern, text)
            for pattern in patterns
        )

    # =====================================================
    # 10. DETECT INTENT
    # =====================================================

    def detect_intent(
        self,
        question: str,
    ) -> str:

        normalized = normalize_text(question)

        # Loại bỏ dấu câu ở cuối câu.
        normalized = re.sub(
            r"[!?.,;:]+$",
            "",
            normalized,
        ).strip()

        if not normalized:
            return "INVALID"

        # -------------------------------------------------
        # AMBIGUOUS
        # -------------------------------------------------

        if self._matches(
            normalized,
            self.AMBIGUOUS_PATTERNS,
        ):
            return "AMBIGUOUS"

        # -------------------------------------------------
        # GREETING
        # -------------------------------------------------

        if self._matches(
            normalized,
            self.GREETING_PATTERNS,
        ):
            return "GREETING"

        # -------------------------------------------------
        # PERSONAL INTENTS
        # Ưu tiên trước các câu hỏi kiến thức.
        # -------------------------------------------------

        if self._matches(
            normalized,
            self.USER_PROFILE_PATTERNS,
        ):
            return "USER_PROFILE"

        if self._matches(
            normalized,
            self.MY_SUBMISSIONS_PATTERNS,
        ):
            return "MY_SUBMISSIONS"

        if self._matches(
            normalized,
            self.MY_PROGRESS_PATTERNS,
        ):
            return "MY_PROGRESS"

        if self._matches(
            normalized,
            self.MY_COURSES_PATTERNS,
        ):
            return "MY_COURSES"

        # -------------------------------------------------
        # PUBLIC COURSE LIST
        # -------------------------------------------------

        if self._matches(
            normalized,
            self.LIST_COURSES_PATTERNS,
        ):
            return "LIST_COURSES"

        # -------------------------------------------------
        # CODE ERROR ANALYSIS (Use Case b)
        # -------------------------------------------------

        if (
            self._matches(normalized, self.CODE_ERROR_PATTERNS)
            or "[yeu cau phan tich loi]" in normalized
            or "```java" in question.lower()
        ):
            return "CODE_ERROR_ANALYSIS"

        # -------------------------------------------------
        # KNOWLEDGE QUESTION
        # -------------------------------------------------

        if self._matches(
            normalized,
            self.COURSE_QUESTION_PATTERNS,
        ):
            return "COURSE_QUESTION"

        # -------------------------------------------------
        # UNKNOWN / INVALID
        # Không mặc định thành COURSE_QUESTION.
        # -------------------------------------------------

        return "INVALID"
