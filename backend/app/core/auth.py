"""
Supabase JWT validation middleware.
Fetches JWKS from Supabase and validates tokens using python-jose.
See: https://supabase.com/docs/guides/auth/jwts
"""

import time
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt

from app.core.config import settings

# --- JWKS cache ---
_jwks_cache: dict = {}
_jwks_cache_expiry: float = 0
JWKS_CACHE_TTL = 3600  # 1 hour

security_scheme = HTTPBearer()


async def _fetch_jwks() -> dict:
    """Fetch JWKS from Supabase, with TTL-based caching."""
    global _jwks_cache, _jwks_cache_expiry

    now = time.time()
    if _jwks_cache and now < _jwks_cache_expiry:
        return _jwks_cache

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(settings.supabase_jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_expiry = now + JWKS_CACHE_TTL

    return _jwks_cache


def _get_signing_key(jwks_data: dict, token: str) -> dict:
    """Extract the correct signing key from the JWKS keyset."""
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    for key_data in jwks_data.get("keys", []):
        if key_data.get("kid") == kid:
            return key_data

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to find matching signing key in JWKS.",
    )


async def validate_jwt(token: str) -> dict:
    """Validate a Supabase JWT and return its claims."""
    try:
        jwks_data = await _fetch_jwks()
        key_data = _get_signing_key(jwks_data, token)
        public_key = jwk.construct(key_data)

        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience="authenticated",
            options={"verify_exp": True},
        )
        return payload

    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to fetch JWKS from Supabase: {exc}",
        ) from exc


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    """FastAPI dependency — extracts and validates the Bearer token."""
    return await validate_jwt(credentials.credentials)


async def get_optional_user(
    request: Request,
) -> Optional[dict]:
    """FastAPI dependency — returns user claims or None (for guest access)."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        return None

    try:
        return await validate_jwt(token)
    except HTTPException:
        return None
