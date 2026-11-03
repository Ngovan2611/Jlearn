import httpx
import logging

from fastapi import HTTPException

from core.config import settings


logger = logging.getLogger(__name__)


class UserServiceClient:

    def __init__(self):
        self.base_url = settings.USER_SERVICE_BASE_URL.rstrip("/")

    async def get_my_profile(self, access_token: str) -> dict:

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }

        try:
            async with httpx.AsyncClient(
                timeout=settings.SERVICE_TIMEOUT_SECONDS
            ) as client:

                response = await client.get(
                    f"{self.base_url}/profile/users/me",
                    headers=headers,
                )

                response.raise_for_status()

                data = response.json()

                if data.get("code") != 200:
                    raise HTTPException(
                        status_code=502,
                        detail="User Service không trả về hồ sơ hợp lệ.",
                    )

                profile = data.get("result")

                if not profile:
                    return {}

                return profile

        except httpx.HTTPStatusError as exc:
            logger.error(
                "User Service HTTP error: %s",
                exc.response.status_code,
            )

            if exc.response.status_code in (401, 403):
                raise HTTPException(
                    status_code=exc.response.status_code,
                    detail="Không thể xác thực khi truy cập User Service.",
                ) from exc

            raise HTTPException(
                status_code=502,
                detail="User Service trả về lỗi.",
            ) from exc

        except httpx.TimeoutException as exc:
            logger.exception("User Service timeout")

            raise HTTPException(
                status_code=504,
                detail="User Service phản hồi quá thời gian.",
            ) from exc

        except httpx.RequestError as exc:
            logger.exception("Cannot connect to User Service")

            raise HTTPException(
                status_code=503,
                detail="Không thể kết nối User Service.",
            ) from exc