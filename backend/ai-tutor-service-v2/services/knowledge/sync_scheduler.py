import asyncio
import logging

from core.config import settings
from services.knowledge.indexing_service import IndexingService

logger = logging.getLogger(__name__)


async def sync_loop():
    interval = max(10, settings.SYNC_INTERVAL_SECONDS)

    while True:
        try:
            service = IndexingService()
            result = await service.index_all()

            logger.info("Knowledge sync completed: %s", result)

        except asyncio.CancelledError:
            raise

        except Exception:
            logger.exception("Knowledge sync failed")

        await asyncio.sleep(interval)