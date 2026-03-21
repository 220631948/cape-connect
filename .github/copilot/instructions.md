# GitHub Copilot Instructions — CapeTown GIS Hub

## Project Context

Multi-tenant PWA for geospatial intelligence (City of Cape Town / Western Cape Province).
Frontend: Next.js 15 App Router + MapLibre GL JS. Backend: FastAPI on Railway.

## Architecture

- **Backend**: Hexagonal (Ports & Adapters) in `backend/app/`
    - `domain/` — pure business logic, NO framework imports
    - `ports/` — abstract interfaces (ABC classes)
    - `adapters/` — concrete implementations (FastAPI, PostGIS, R2)
    - `services/` — application services orchestrating domain + ports
- **Frontend**: Modular layers in `src/`
    - `app/` — Next.js App Router pages and API routes
    - `components/` — presentation layer
    - `hooks/` — application logic
    - `lib/` — utilities and infrastructure clients
- **Shared**: `shared/` — cross-cutting constants and contracts

## Mandatory Rules for Generated Code

### Design Patterns

- Use Repository pattern for all data access
- Use Strategy pattern for format-specific processing
- Use Value Objects for immutable domain concepts (bbox, scores)
- Use Factory methods for validated entity creation
- Do NOT apply patterns without justification

### Algorithm Efficiency

- Document Big O complexity on non-trivial functions
- Spatial queries MUST use PostGIS spatial index → O(log n + k)
- Use iterative algorithms over recursive for coordinate processing
- Use frozenset/Set for O(1) membership checks, not list scans
- Use hash maps (dict) for O(1) lookups where applicable

### Security

- Never generate raw SQL — always use parameterized queries (SQLAlchemy)
- Never hardcode credentials or API keys
- Always validate inputs at API boundary (Pydantic models)
- Always enforce tenant_id isolation on data access
- DXF files: never assume CRS (prompt user)
- POPIA annotations required on personal data handlers

### Code Quality

- Source files ≤ 300 lines
- EPSG:4326 for storage, EPSG:3857 for rendering — never mix
- ST_DWithin MUST cast to geography for metre distances
- Cape Town bbox: use `BoundingBox.cape_town()` or `shared/constants/bbox.ts`
- Three-tier fallback: LIVE → CACHED → MOCK for all external data
- Data source badge on every data display

### When Uncertain

- Check `docs/gotchas.md` for known pitfalls
- Check `docs/OPEN_QUESTIONS.md` for blocking decisions
- Reference authoritative docs (PostGIS, FastAPI, Supabase)
- Document assumptions in `docs/ASSUMPTIONS_LOG.md`

## Testing

- pytest for backend, vitest for frontend
- Test tenant isolation and auth enforcement on every endpoint
- Mock external services — never call real APIs in tests
