import jwt
from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class AuthContext:
    account_id: str
    access_token: str


def _extract_token_from_request(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None,
) -> Optional[str]:
    """Lấy token từ Header Authorization hoặc từ Cookie của trình duyệt."""
    if credentials is not None and credentials.credentials:
        return credentials.credentials

    # Lấy từ Cookie nếu request từ trình duyệt qua axios withCredentials
    if "accessToken" in request.cookies:
        return request.cookies.get("accessToken")
    if "access_token" in request.cookies:
        return request.cookies.get("access_token")

    # Kiểm tra header Authorization thủ công phòng trường hợp proxy forward
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()

    return None


async def get_current_auth_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthContext:
    token = _extract_token_from_request(request, credentials)

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Thiếu access token.",
        )

    try:
        claims = jwt.decode(
            token,
            settings.JWT_SIGNER_KEY,
            algorithms=["HS512"],
            issuer=settings.JWT_ISSUER,
            options={
                "require": [
                    "exp",
                    "iat",
                    "sub",
                    "accountId",
                    "iss",
                ]
            },
        )

        if claims.get("type") != "access":
            raise HTTPException(
                status_code=401,
                detail="Token không phải access token.",
            )

        account_id = claims.get("accountId")

        if not account_id:
            raise HTTPException(
                status_code=401,
                detail="Token không có accountId.",
            )

        return AuthContext(
            account_id=str(account_id),
            access_token=token,
        )

    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=401,
            detail="Token không hợp lệ hoặc đã hết hạn.",
        ) from exc


async def get_optional_auth_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> Optional[AuthContext]:
    """Dành cho các endpoint không bắt buộc đăng nhập (như phân tích lỗi code)."""
    try:
        return await get_current_auth_context(request, credentials)
    except HTTPException:
        return None


async def get_current_user_id(
    auth: AuthContext = Depends(get_current_auth_context),
) -> str:
    return auth.account_id
