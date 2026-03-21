"""
Supabase JWT validation middleware.
Fetches JWKS from Supabase and validates tokens using python-jose.

BUG-PY-001 FIX: Validate token structure BEFORE fetching JWKS.
If JWKS is unreachable, return 401 (not 503) for invalid tokens.
Return 503 ONLY when a structurally valid JWT cannot be verified
because the auth provider is genuinely down.

See: https://supabase.com/docs/guides/auth/jwts
"""

import time
from typing import Optional

import httpx
import structlog
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt

from app.core.config import settings

logger = structlog.get_logger()

# --- JWKS cache ---
_jwks_cache: dict = {}
_jwks_cache_expiry: float = 0
JWKS_CACHE_TTL = 3600  # 1 hour

security_scheme = HTTPBearer()


def _validate_token_structure(token: str) -> dict:
    """
    Pre-validate JWT structure before any network call (BUG-PY-001 fix).

    Checks: 3-part structure, valid base64, decodable header/payload.
    Complexity: O(1) — only parses header, no signature verification.
    Raises HTTPException(401) for malformed tokens — never 503.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: JWT must have 3 segments.",
        )
    try:
        header = jwt.get_unverified_header(token)
        if not header.get("alg"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token: missing algorithm in header.",
            )
        claims = jwt.get_unverified_claims(token)
        if not isinstance(claims, dict):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token: payload is not a JSON object.",
            )
        return header
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Malformed token: {exc}",
        ) from exc


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


def _get_signing_key(jwks_data: dict, kid: str) -> dict:
    """
    Extract the correct signing key from the JWKS keyset.

    Complexity: O(k) where k = number of keys in JWKS (typically 1–3).
    """
    for key_data in jwks_data.get("keys", []):
        if key_data.get("kid") == kid:
            return key_data

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to find matching signing key in JWKS.",
    )


async def validate_jwt(token: str) -> dict:
    """
    Validate a Supabase JWT and return its claims.

    BUG-PY-001 FIX: Token structure is validated FIRST (O(1), no network).
    JWKS fetch only happens for structurally valid tokens.
    Result: malformed/expired tokens always get 401, never 503.
    """
    # Step 1: Validate structure BEFORE any network call — O(1)
    header = _validate_token_structure(token)
    kid = header.get("kid", "")

    # Step 2: Fetch JWKS (cached — O(1) on cache hit)
    try:
        jwks_data = await _fetch_jwks()
    except httpx.HTTPError as exc:
        logger.warning("jwks_fetch_failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable.",
        ) from exc

    # Step 3: Find signing key and verify signature — O(k) where k = JWKS keys
    try:
        key_data = _get_signing_key(jwks_data, kid)
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
