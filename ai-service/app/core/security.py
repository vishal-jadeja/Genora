import secrets

from fastapi import Header, HTTPException, status

from app.core.config import settings


async def require_internal_secret(x_internal_secret: str = Header(default="")) -> None:
    """Gate every non-health route to callers holding the shared secret (Next.js / Trigger.dev)."""
    if not secrets.compare_digest(x_internal_secret, settings.internal_service_secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid internal secret"
        )
