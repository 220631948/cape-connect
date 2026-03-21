# Junie Guidelines — CapeTown GIS Hub

## Architecture

This project follows **hexagonal (ports & adapters) architecture** for the Python backend
and **modular layered architecture** for the Next.js frontend.

### Backend Structure (backend/)

```
backend/app/
├── domain/          # Pure business logic — NO framework imports
│   ├── entities/    # Identity-bearing objects (AnalysisJob, GISLayer, TenantContext)
│   ├── value_objects/ # Immutable by-value types (BoundingBox, SuitabilityScore, GeoJSONGeometry)
│   ├── services/    # Domain services (pure logic, no I/O)
│   └── exceptions/  # Business rule violations (BBoxOutOfRange, CRSMissing, etc.)
├── ports/           # Abstract interfaces (ABC classes)
│   ├── inbound/     # Use case boundaries (what the API exposes)
│   └── outbound/    # Repository, Storage, ArcGIS, FileProcessor ports
├── adapters/        # Concrete implementations
│   ├── inbound/api/ # FastAPI routes (thin — delegate to application layer)
│   └── outbound/    # PostGIS repos, R2 storage, ArcGIS client, ML adapters
├── infrastructure/  # Cross-cutting: config, auth, database engine, Celery
├── core/            # Legacy location — config.py, auth.py, database.py
├── services/        # Application services (orchestrate domain + ports)
├── api/routes/      # FastAPI route handlers
└── tasks/           # Celery async tasks
```

### Frontend Structure (src/)

```
src/
├── app/             # Next.js App Router pages and API routes
├── components/      # React components (presentation layer)
├── hooks/           # Custom React hooks (application logic)
├── lib/             # Utilities, clients, validation (infrastructure)
├── types/           # TypeScript type definitions
└── test/            # Test utilities
```

### Cross-Cutting

```
shared/              # Constants and contracts shared between frontend and backend
infra/               # Deployment configs, CI/CD documentation
```

## Mandatory Code Quality Rules

### Rule 1 — Design Patterns

Apply proven design patterns where they solve real problems:

- **Repository** for all data access (never raw SQL in routes/services)
- **Strategy** for format-specific GIS processing (detect → dispatch)
- **Factory** for creating domain entities with validation
- **Value Object** for immutable domain concepts (bbox, scores, geometry)
- **Port/Adapter** for all external dependencies (DB, storage, APIs)

Do NOT apply patterns cargo-cult style. Every pattern must be justified by the
problem context. If a simple function suffices, use a simple function.

### Rule 2 — Big O Complexity

Include Big O reasoning for non-trivial logic:

```python
def find_nearest(features: list, point: tuple) -> Feature:
    """
    Find nearest feature to point.
    Complexity: O(n) linear scan — acceptable for n < 10,000.
    For larger datasets, use PostGIS ST_DWithin with spatial index: O(log n + k).
    """
```

Critical paths requiring O analysis:

- Spatial queries (must use PostGIS spatial index → O(log n + k))
- Coordinate flattening from GeoJSON (iterative, not recursive → O(n) time, O(d) stack)
- Format detection (O(1) via magic bytes + extension lookup)
- Role permission checks (O(1) via hash map)
- Cache key generation (O(1) string formatting)

### Rule 3 — Secure Coding

- Never pass raw SQL — all queries parameterized via SQLAlchemy/GeoAlchemy2
- Never hardcode credentials — .env only (CLAUDE.md Rule 3)
- Validate all inputs at API boundary (Pydantic models)
- Enforce tenant_id isolation at every data access layer
- DXF files: NEVER assume CRS (GOTCHA-PY-004)
- POPIA annotations on any file handling personal data

### Rule 4 — Validate Before Implement

Before implementing non-trivial architectural or algorithmic decisions:

1. Check existing codebase for similar patterns
2. Consult docs/gotchas.md for known pitfalls
3. Reference authoritative documentation (PostGIS docs, FastAPI docs, etc.)
4. If uncertain, document the decision in docs/ASSUMPTIONS_LOG.md

### Rule 5 — No Duplication

- Constants: defined once in shared/ or domain/value_objects/, referenced elsewhere
- Cape Town bbox: `BoundingBox.cape_town()` or `shared/constants/bbox.ts`
- Role hierarchy: `shared/constants/roles.ts` or domain entities
- Error types: domain/exceptions/ — translated to HTTP at adapter layer

### Rule 6 — File Size Limit

Source files ≤ 300 lines. If a file exceeds this:

- Split by responsibility (e.g., ingest vs export functions)
- Extract domain logic to domain/services/
- Extract data access to adapters/outbound/

## Documentation References

When implementing, consult these authoritative sources:

- PostGIS spatial functions: https://postgis.net/docs/reference.html
- FastAPI best practices: https://fastapi.tiangolo.com/tutorial/
- SQLAlchemy async: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- GeoAlchemy2: https://geoalchemy-2.readthedocs.io/en/latest/
- Supabase Auth JWTs: https://supabase.com/docs/guides/auth/jwts
- Cloudflare R2 S3 API: https://developers.cloudflare.com/r2/api/s3/api/
- GeoJSON RFC 7946: https://datatracker.ietf.org/doc/html/rfc7946
- POPIA Act: https://popia.co.za/

## Testing Requirements

- All new code must have tests
- Backend: pytest with TestClient (httpx)
- Test tenant isolation on every data-access endpoint
- Test auth enforcement (401 without JWT, 403 cross-tenant)
- Mock external services (ArcGIS, R2, GEE) — never call real APIs in tests

## Git Conventions

- Conventional commits: `feat(scope):`, `fix(scope):`, `test(scope):`, `docs:`, `ci:`
- Co-author trailer: `--trailer "Co-authored-by: Junie <junie@jetbrains.com>"`
- Rebase onto main before push
- Never force-push to main
