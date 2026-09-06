from fastapi import Header, HTTPException

from app.config import INTERNAL_API_KEY


async def require_internal_key(x_internal_key: str = Header(default="")):
    if x_internal_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal API key")
