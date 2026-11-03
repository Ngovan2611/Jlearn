import logging
from typing import Any
import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class ExerciseServiceClient:
    def __init__(self):
        self.base_url = settings.EXERCISE_SERVICE_BASE_URL.rstrip("/")

    async def get_exercise_execution_data(self, exercise_id: str) -> dict[str, Any]:
        """Lấy dữ liệu bài tập từ exercise-service để làm đề bài đối chiếu khi chấm."""
        url = f"{self.base_url}/internal/exercises/{exercise_id}/execution-data"
        try:
            async with httpx.AsyncClient(timeout=settings.SERVICE_TIMEOUT_SECONDS) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("result") or {}
                logger.warning(
                    "Exercise service returned status %s for exercise %s",
                    response.status_code,
                    exercise_id,
                )
                return {}
        except Exception as exc:
            logger.error("Failed to connect to exercise-service: %s", exc)
            return {}
