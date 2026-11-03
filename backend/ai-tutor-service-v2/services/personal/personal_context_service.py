
import asyncio
import logging
import re
import unicodedata
from datetime import datetime
from typing import Any

from services.clients.user_service_client import UserServiceClient
from services.clients.enrollment_service_client import EnrollmentServiceClient
from services.clients.progress_service_client import ProgressServiceClient
from services.clients.submission_service_client import SubmissionServiceClient


logger = logging.getLogger(__name__)


class PersonalContextService:

    def __init__(self):
        self.user_client = UserServiceClient()
        self.enrollment_client = EnrollmentServiceClient()
        self.progress_client = ProgressServiceClient()
        self.submission_client = SubmissionServiceClient()

    # =========================================================
    # USER PROFILE
    # =========================================================

    async def get_user_profile(
        self,
        access_token: str,
    ) -> dict[str, Any]:

        profile = await self.user_client.get_my_profile(
            access_token=access_token
        )

        if not isinstance(profile, dict) or not profile:
            return {}

        first_name = profile.get("firstName") or ""
        last_name = profile.get("lastName") or ""

        return {
            "profile_id": profile.get("id"),
            "first_name": first_name,
            "last_name": last_name,
            "full_name": f"{first_name} {last_name}".strip(),
            "email": profile.get("email"),
            "date_of_birth": profile.get("dob"),
            "gender": profile.get("gender"),
            "avatar_url": profile.get("url"),
            "skills": profile.get("skills") or [],
        }

    # =========================================================
    # MY COURSES / ENROLLMENTS
    # =========================================================

    async def get_my_courses(
        self,
        access_token: str,
    ) -> dict[str, Any]:

        enrollments = await self.enrollment_client.get_my_enrollments(
            access_token=access_token
        )

        enrollments = self._filter_dict_list(enrollments)

        if not enrollments:
            return self._build_personal_result(
                answer=(
                    "📚 **Danh sách khóa học của bạn**\n\n"
                    "Bạn chưa đăng ký khóa học nào trên JLearn. "
                    "Hãy khám phá danh sách khóa học để bắt đầu "
                    "hành trình học tập nhé!"
                ),
                sources=["enrollment-service"],
                quality_reason="Người dùng chưa đăng ký khóa học nào.",
            )

        lines = [
            "📚 **Danh sách khóa học của bạn**",
            "",
            f"Bạn hiện đang tham gia **{len(enrollments)} khóa học**:",
            "",
        ]

        for index, enrollment in enumerate(enrollments, start=1):

            title = (
                enrollment.get("courseTitle")
                or "Chưa có tên khóa học"
            )

            status = enrollment.get("status") or "Chưa xác định"

            enrolled_at = self._format_datetime(
                enrollment.get("enrolledAt")
            )

            lines.extend([
                f"**{index}. {title}**",
                f"- Mã khóa học: {enrollment.get('courseId') or 'Chưa xác định'}",
                f"- Trạng thái: {status}",
                f"- Ngày đăng ký: {enrolled_at}",
                "",
            ])

        return self._build_personal_result(
            answer="\n".join(lines),
            sources=["enrollment-service"],
            quality_reason=(
                "Danh sách khóa học được lấy trực tiếp "
                "từ Enrollment Service."
            ),
        )

    # =========================================================
    # MY LEARNING PROGRESS
    # =========================================================

    async def get_my_progress(
        self,
        access_token: str,
    ) -> dict[str, Any]:

        enrollments, progress_list = await asyncio.gather(
            self.enrollment_client.get_my_enrollments(
                access_token=access_token
            ),
            self.progress_client.get_my_progress(
                access_token=access_token
            ),
        )

        enrollments = self._filter_dict_list(enrollments)
        progress_list = self._filter_dict_list(progress_list)

        if not progress_list:
            return self._build_personal_result(
                answer=(
                    "📈 **Quá trình học tập của bạn**\n\n"
                    "Hiện tại hệ thống chưa có dữ liệu tiến độ "
                    "học tập của bạn."
                ),
                sources=[
                    "enrollment-service",
                    "progress-service",
                ],
                quality_reason="Chưa có dữ liệu tiến độ học tập.",
            )

        course_names = {
            enrollment.get("courseId"): enrollment.get("courseTitle")
            for enrollment in enrollments
            if enrollment.get("courseId")
        }

        lines = [
            "📈 **Quá trình học tập của bạn**",
            "",
        ]

        total_progress = 0.0
        valid_progress_count = 0

        for index, progress in enumerate(progress_list, start=1):

            course_id = progress.get("courseId")

            course_title = (
                course_names.get(course_id)
                or (
                    f"Khóa học {course_id}"
                    if course_id
                    else "Khóa học chưa xác định"
                )
            )

            raw_progress = progress.get("progress")
            percentage = self._format_percentage(raw_progress)

            if raw_progress is not None:
                try:
                    number = float(raw_progress)

                    if 0 <= number <= 100:
                        total_progress += number
                        valid_progress_count += 1

                except (TypeError, ValueError):
                    pass

            completed = progress.get("completed") is True

            completed_lesson_ids = (
                progress.get("completedLessonIds") or []
            )

            updated_at = self._format_datetime(
                progress.get("updatedAt")
            )

            lines.extend([
                f"**{index}. {course_title}**",
                f"- Mã khóa học: {course_id or 'Chưa xác định'}",
                f"- Tiến độ: {percentage}",
                f"- Số bài học đã hoàn thành: {len(completed_lesson_ids)}",
                f"- Trạng thái: "
                f"{'Đã hoàn thành' if completed else 'Đang học'}",
                f"- Cập nhật lần cuối: {updated_at}",
                "",
            ])

        if valid_progress_count > 0:
            average_progress = total_progress / valid_progress_count

            lines.extend([
                "---",
                f"**Tiến độ trung bình các khóa học: "
                f"{self._format_percentage(average_progress)}**",
                "",
            ])

        return self._build_personal_result(
            answer="\n".join(lines),
            sources=[
                "enrollment-service",
                "progress-service",
            ],
            quality_reason=(
                "Tiến độ học tập được tổng hợp từ Enrollment "
                "Service và Progress Service."
            ),
        )

    # =========================================================
    # MY SUBMISSIONS
    # =========================================================

    async def get_my_submissions(
        self,
        access_token: str,
        question: str | None = None,
    ) -> dict[str, Any]:

        submissions = await self.submission_client.get_my_submissions(
            access_token=access_token
        )

        submissions = self._filter_dict_list(submissions)

        # Không có bài nộp nào.
        if not submissions:
            return self._build_personal_result(
                answer=(
                    "📝 **Lịch sử bài nộp của bạn**\n\n"
                    "Bạn chưa có bài nộp nào trên JLearn. "
                    "Hãy chọn một bài tập lập trình và bắt đầu "
                    "luyện tập nhé!"
                ),
                sources=["submission-service"],
                quality_reason="Người dùng chưa có bài nộp.",
            )

        # Sắp xếp bài nộp mới nhất lên đầu.
        submissions.sort(
            key=lambda item: self._datetime_sort_key(
                item.get("submittedAt")
            ),
            reverse=True,
        )

        # Nếu câu hỏi chứa submissionId thì tra cứu chính xác.
        submission_id = (
            self._extract_submission_id(question)
            if question
            else None
        )

        if submission_id:
            return self._get_submission_by_id(
                submissions=submissions,
                submission_id=submission_id,
            )

        # Không có ID cụ thể thì trả về lịch sử bài nộp.
        return self._build_submission_history(submissions)

    # =========================================================
    # LOOKUP SUBMISSION BY SUBMISSION ID
    # =========================================================

    def _get_submission_by_id(
        self,
        submissions: list[dict[str, Any]],
        submission_id: str,
    ) -> dict[str, Any]:

        matched_submission = next(
            (
                item
                for item in submissions
                if str(item.get("id") or "").strip().lower()
                == submission_id.strip().lower()
            ),
            None,
        )

        if not matched_submission:
            return self._build_personal_result(
                answer=(
                    "🔎 **Kết quả tra cứu bài nộp**\n\n"
                    f"Không tìm thấy bài nộp có ID "
                    f"`{submission_id}` trong tài khoản của bạn.\n\n"
                    "Bạn hãy kiểm tra lại mã bài nộp. "
                    "Lưu ý: ID bài nộp khác với ID bài tập."
                ),
                sources=["submission-service"],
                quality_reason=(
                    "Không tìm thấy submissionId trong danh sách "
                    "bài nộp của người dùng hiện tại."
                ),
                sufficient=False,
                coverage=0.0,
            )

        lines = [
            "🔎 **Chi tiết bài nộp của bạn**",
            "",
            f"- Mã bài nộp: `{matched_submission.get('id')}`",
            f"- Mã bài tập: "
            f"`{matched_submission.get('exerciseId') or 'Chưa xác định'}`",
            "",
            "**Kết quả chấm điểm:**",
            "",
        ]

        self._append_submission_details(
            lines=lines,
            submission=matched_submission,
        )

        return self._build_personal_result(
            answer="\n".join(lines),
            sources=["submission-service"],
            quality_reason=(
                f"Đã tìm thấy bài nộp có submissionId={submission_id} "
                "trong dữ liệu của người dùng hiện tại."
            ),
        )

    # =========================================================
    # BUILD SUBMISSION HISTORY
    # =========================================================

    def _build_submission_history(
        self,
        submissions: list[dict[str, Any]],
    ) -> dict[str, Any]:

        total = len(submissions)

        accepted_statuses = {
            "ACCEPTED",
            "ACCEPT",
            "PASSED",
        }

        pending_statuses = {
            "PENDING",
            "PROCESSING",
            "RUNNING",
            "WAITING",
        }

        failed_statuses = {
            "FAILED",
            "REJECTED",
            "WRONG_ANSWER",
            "ERROR",
            "TIME_LIMIT_EXCEEDED",
            "MEMORY_LIMIT_EXCEEDED",
        }

        accepted_count = 0
        failed_count = 0
        pending_count = 0
        other_count = 0

        for submission in submissions:

            status = self._normalize_status(
                submission.get("gradingStatus")
            )

            if status in accepted_statuses:
                accepted_count += 1

            elif status in pending_statuses:
                pending_count += 1

            elif status in failed_statuses:
                failed_count += 1

            else:
                other_count += 1

        lines = [
            "📝 **Lịch sử bài nộp của bạn**",
            "",
            f"Bạn đã có **{total} bài nộp** trên JLearn.",
            "",
            "**Thống kê:**",
            f"- Thành công: {accepted_count}",
            f"- Thất bại: {failed_count}",
            f"- Đang xử lý: {pending_count}",
        ]

        if other_count:
            lines.append(
                f"- Trạng thái khác/chưa xác định: {other_count}"
            )

        lines.extend([
            "",
            "**10 bài nộp gần nhất:**",
            "",
        ])

        for index, submission in enumerate(
            submissions[:10],
            start=1,
        ):

            submission_id = submission.get("id") or "Chưa xác định"
            exercise_id = (
                submission.get("exerciseId")
                or "Chưa xác định"
            )

            lines.extend([
                f"**{index}. Bài nộp: {submission_id}**",
                f"- Mã bài tập: {exercise_id}",
                f"- Ngôn ngữ: "
                f"{submission.get('language') or 'Chưa xác định'}",
                f"- Trạng thái: "
                f"{submission.get('gradingStatus') or 'Chưa xác định'}",
                f"- Điểm: "
                f"{submission.get('score') if submission.get('score') is not None else 'Chưa có'}",
                f"- Thời gian nộp: "
                f"{self._format_datetime(submission.get('submittedAt'))}",
            ])

            feedback = submission.get("feedback")

            if feedback:
                lines.append(f"- Nhận xét: {feedback}")

            lines.append("")

        return self._build_personal_result(
            answer="\n".join(lines),
            sources=["submission-service"],
            quality_reason=(
                "Lịch sử bài nộp được lấy trực tiếp "
                "từ Submission Service."
            ),
        )

    # =========================================================
    # SUBMISSION DETAIL HELPER
    # =========================================================

    @classmethod
    def _append_submission_details(
        cls,
        lines: list[str],
        submission: dict[str, Any],
    ) -> None:

        score = submission.get("score")
        status = submission.get("gradingStatus")

        lines.extend([
            f"- Điểm: **{score if score is not None else 'Chưa có điểm'}**",
            f"- Trạng thái chấm: {status or 'Chưa xác định'}",
            f"- Ngôn ngữ: {submission.get('language') or 'Chưa xác định'}",
            f"- Thời gian nộp: "
            f"{cls._format_datetime(submission.get('submittedAt'))}",
            f"- Thời gian chấm: "
            f"{cls._format_datetime(submission.get('gradedAt'))}",
        ])

        feedback = submission.get("feedback")

        if feedback:
            lines.append(f"- Nhận xét: {feedback}")

    # =========================================================
    # SUBMISSION ID EXTRACTION
    # =========================================================

    @staticmethod
    def _normalize_text(text: str) -> str:

        text = unicodedata.normalize("NFD", text.lower())

        text = "".join(
            char
            for char in text
            if unicodedata.category(char) != "Mn"
        )

        return text.replace("đ", "d")

    @classmethod
    def _extract_submission_id(
        cls,
        question: str,
    ) -> str | None:

        if not question:
            return None

        normalized = cls._normalize_text(question)

        # Ưu tiên các mẫu chỉ rõ ID của bài nộp.
        patterns = [
            r"\b(?:submission|bai\s*nop)\s*"
            r"(?:co\s*)?(?:id|ma)\s*"
            r"(?:la\s*)?[:=]?\s*"
            r"([a-zA-Z0-9][a-zA-Z0-9_-]*)",

            r"\b(?:id|ma)\s*"
            r"(?:bai\s*nop|submission)\s*"
            r"[:=]?\s*"
            r"([a-zA-Z0-9][a-zA-Z0-9_-]*)",

            r"\bsubmission\s+id\s*[:=]?\s*"
            r"([a-zA-Z0-9][a-zA-Z0-9_-]*)",
        ]

        for pattern in patterns:
            match = re.search(
                pattern,
                normalized,
                re.IGNORECASE,
            )

            if match:
                return match.group(1)

        return None

    # =========================================================
    # COMMON HELPERS
    # =========================================================

    @staticmethod
    def _filter_dict_list(
        data: Any,
    ) -> list[dict[str, Any]]:

        if not isinstance(data, list):
            return []

        return [
            item
            for item in data
            if isinstance(item, dict)
        ]

    @staticmethod
    def _normalize_status(value: Any) -> str:

        return str(value or "").strip().upper()

    @staticmethod
    def _build_personal_result(
        answer: str,
        sources: list[str],
        quality_reason: str = "",
        sufficient: bool = True,
        coverage: float = 1.0,
    ) -> dict[str, Any]:

        return {
            "answer": answer,
            "sources": sources,
            "sufficient": sufficient,
            "coverage": coverage,
            "matched_terms": 0,
            "quality_reason": quality_reason,
        }

    @staticmethod
    def _format_percentage(value: Any) -> str:

        if value is None:
            return "Chưa có dữ liệu"

        try:
            number = float(value)

            if not 0 <= number <= 100:
                return "Dữ liệu tiến độ không hợp lệ"

            return f"{number:g}%"

        except (TypeError, ValueError):
            return "Chưa có dữ liệu"

    @staticmethod
    def _format_datetime(value: Any) -> str:

        if not value:
            return "Chưa có thông tin"

        if isinstance(value, datetime):
            return value.strftime("%d/%m/%Y %H:%M")

        if isinstance(value, str):
            try:
                parsed = datetime.fromisoformat(
                    value.replace("Z", "+00:00")
                )

                return parsed.strftime("%d/%m/%Y %H:%M")

            except ValueError:
                return value

        return str(value)

    @staticmethod
    def _datetime_sort_key(value: Any) -> float:

        if not value:
            return 0.0

        try:
            if isinstance(value, datetime):
                parsed = value
            else:
                parsed = datetime.fromisoformat(
                    str(value).replace("Z", "+00:00")
                )

            if parsed.tzinfo is not None:
                return parsed.timestamp()

            return parsed.replace(
                tzinfo=None
            ).timestamp()

        except (ValueError, TypeError, OverflowError, OSError):
            return 0.0
