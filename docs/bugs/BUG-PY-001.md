# BUG-PY-001 — Invalid JWT Returns 503 Instead of 401

| Field                 | Value                |
|-----------------------|----------------------|
| **Discovery Date**    | 2026-03-21           |
| **Failing Check**     | QA-PY-03             |
| **Severity**          | **CRITICAL**         |
| **Responsible Agent** | PYTHON-BACKEND-AGENT |
| **Status**            | **OPEN**             |

## Expected Behaviour

When a client sends a request with an invalid, expired, or malformed JWT in the
`Authorization: Bearer` header, the server should return **HTTP 401 Unauthorized**
with a clear error message indicating the token is invalid.

## Actual Behaviour

The server returns **HTTP 503 Service Unavailable** with the message:
`"Unable to fetch JWKS from Supabase: ..."`.

## Root Cause

In `backend/app/core/auth.py`, the `validate_jwt()` function (line 57–82) follows
this execution order:

1. **Fetch JWKS** from Supabase (`_fetch_jwks()`) — makes an HTTP call
2. Extract signing key from JWKS
3. Decode and verify the JWT

When the JWKS endpoint is unreachable (e.g., Supabase down, network issue, cold
start with empty cache), step 1 raises `httpx.HTTPError`, which is caught at
line 78 and returns **503**.

The token itself is **never inspected**. Even an obviously malformed token
(e.g., `"expired.invalid.token"`) triggers a JWKS fetch attempt before any
token validation occurs.

## Security Impact

- Attackers cannot distinguish between "invalid token" and "auth service down"
  based on the 503 response — this is a minor information leak.
- More critically: if the JWKS cache is warm but the token is invalid, the code
  **does** return 401 correctly (via `JWTError` catch). The bug only manifests
  when the JWKS cache is cold or expired AND the JWKS endpoint is unreachable.
- In production on Railway with Supabase, the JWKS endpoint should be reachable,
  but any Supabase outage would cause ALL authenticated endpoints to return 503
  instead of processing cached JWKS.

## Recommended Fix

Add a try/except around `_fetch_jwks()` that falls back to cached JWKS if
available, and only returns 503 if both the fetch fails AND no cached JWKS
exists. Additionally, consider validating basic token structure (3-part JWT
format) BEFORE attempting the JWKS fetch.

```python
# Suggested fix in validate_jwt():
try:
    jwks_data = await _fetch_jwks()
except httpx.HTTPError:
    if _jwks_cache:
        jwks_data = _jwks_cache  # Use stale cache
    else:
        raise HTTPException(status_code=503, detail="Auth service unavailable")
```

## Reproduction

```bash
# With no Supabase running (or JWKS URL unreachable):
curl -H "Authorization: Bearer expired.invalid.token" http://localhost:8000/arcgis/layers
# Returns: 503 Service Unavailable
# Expected: 401 Unauthorized
```

## Test Reference

`tests/test_qa_mp8.py::TestQAPY03::test_expired_jwt_rejected` — marked as
`xfail` with reason "BUG-PY-001".
