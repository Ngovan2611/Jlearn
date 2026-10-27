
from fastapi import APIRouter
from api.v1.conversation_routes import router as conversation_router

from api.v1.health import router as health_router
from api.v1.tutor_chat import router as tutor_router

api_router = APIRouter()
api_router.include_router(conversation_router)
api_router.include_router(health_router)
api_router.include_router(tutor_router)
