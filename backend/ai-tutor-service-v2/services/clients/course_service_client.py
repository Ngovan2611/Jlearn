import httpx

from core.config import settings


class CourseServiceClient:
    def __init__(self):
        self.base_url = settings.COURSE_SERVICE_BASE_URL.rstrip("/")

    async def get_published_courses(self) -> list[dict]:
        url = f"{self.base_url}/internal/courses/published"

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            response.raise_for_status()

        data = response.json()

        if not isinstance(data, list):
            raise ValueError(
                "Course Service phải trả về danh sách khóa học."
            )

        return data

    async def get_course_lessons(
        self,
        course_id: str,
    ) -> list[dict]:
        url = (
            f"{self.base_url}/internal/lessons/course/"
            f"{course_id}"
        )

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()

        data = response.json()

        if not isinstance(data, list):
            raise ValueError(
                "Course Service phải trả về danh sách bài học."
            )

        return data