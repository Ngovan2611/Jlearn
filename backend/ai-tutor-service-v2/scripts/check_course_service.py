import asyncio
import httpx

from core.config import settings


async def main():
    url = (
        f"{settings.COURSE_SERVICE_BASE_URL}"
        "/internal/courses/published"
    )

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(url)
        print("Status:", response.status_code)
        response.raise_for_status()

        courses = response.json()
        print("Số khóa học:", len(courses))

        for course in courses:
            print(
                "ID:", course.get("id"),
                "| Tiêu đề:", course.get("title"),
            )


if __name__ == "__main__":
    asyncio.run(main())