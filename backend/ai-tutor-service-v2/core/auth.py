import jwt

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import settings


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Thiếu access token.",
        )

    try:
        claims = jwt.decode(
            credentials.credentials,
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

        return str(account_id)

    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=401,
            detail="Token không hợp lệ hoặc đã hết hạn.",
        ) from exc