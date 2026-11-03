import httpx
from typing import Any

from core.config import settings


class EnrollmentServiceClient:

    def __init__(self):
        self.base_url = settings.ENROLLMENT_SERVICE_BASE_URL.rstrip("/")

    async def get_my_enrollments(
        self,
        access_token: str
    ) -> list[dict[str, Any]]:

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(
            timeout=settings.SERVICE_TIMEOUT_SECONDS
        ) as client:

            response = await client.get(
                f"{self.base_url}/enrollments/me",
                headers=headers
            )

            response.raise_for_status()
            data = response.json()

        if data.get("code") != 200:
            raise RuntimeError(
                data.get("message", "Cannot get user enrollments")
            )

        return data.get("result") or []