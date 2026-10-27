import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from api.v1.router import api_router
from core.config import settings
from core.database import connect_mongodb, close_mongodb
from services.knowledge.sync_scheduler import sync_loop


# Cấu hình logging mặc định của Python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Kết nối MongoDB
    await connect_mongodb()
    logger.info("MongoDB connected successfully.")

    # Khởi động tác vụ đồng bộ kiến thức nền
    sync_task = asyncio.create_task(sync_loop())
    logger.info("Knowledge sync scheduler started.")

    try:
        yield
    finally:
        # Dừng tác vụ đồng bộ
        sync_task.cancel()

        try:
            await sync_task
        except asyncio.CancelledError:
            pass
        except Exception:
            logger.exception(
                "Knowledge sync scheduler stopped with an error."
            )
        finally:
            # Đóng kết nối MongoDB
            await close_mongodb()
            logger.info("MongoDB connection closed.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Jlearn AI Tutor: Knowledge Engine, "
        "Code Assistant và Automatic Grading."
    ),
    lifespan=lifespan,
)

# Đăng ký API router
app.include_router(
    api_router,
    prefix=settings.API_PREFIX,
)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "UP",
    }