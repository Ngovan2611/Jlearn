from fastapi import APIRouter, Depends

from core.auth import (
    AuthContext,
    get_current_auth_context,
)
from services.personal.personal_context_service import (
    PersonalContextService,
)


router = APIRouter(
    prefix="/personal",
    tags=["Personal Learning Assistant"],
)

personal_context_service = PersonalContextService()


@router.get("/me")
async def get_my_profile(
    auth: AuthContext = Depends(get_current_auth_context),
):
    profile = await personal_context_service.get_user_profile(
        auth.access_token
    )

    return {
        "success": True,
        "message": "Lấy thông tin cá nhân thành công.",
        "result": profile,
    }