# Contributing — CapeTown GIS Hub

## Architecture Overview

This project uses **hexagonal architecture** (Ports & Adapters) for the Python backend
and **modular layered architecture** for the Next.js frontend. Read `CLAUDE.md` before
making any changes — it contains non-negotiable rules.

## Setup

```bash
# Frontend
npm install
cp .env.example .env   # Fill in Supabase credentials
npm run dev

# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
docker compose up -d   # PostGIS + Redis
uvicorn main:app --reload
```

## Code Standards

### Design Patterns (apply when justified)

- **Repository** — all data access via abstract ports, never raw SQL in routes
- **Strategy** — format-specific GIS processing dispatched by format enum
- **Value Object** — immutable domain types (`BoundingBox`, `SuitabilityScore`)
- **Factory** — validated entity creation via `@classmethod` constructors

### Big O Documentation

Document complexity on non-trivial functions:

```python
async def query_within_bbox(self, layer: str, bbox: BoundingBox) -> dict:
    """O(log n + k) — PostGIS GiST spatial index scan + result materialization."""
```

### Security Checklist

- [ ] No raw SQL — parameterized queries only
- [ ] No hardcoded credentials — `.env` only
- [ ] Tenant isolation enforced in every data query
- [ ] POPIA annotation on personal data handlers
- [ ] DXF: CRS prompt (never assume)
- [ ] Shapefile: reject without `.prj`

### File Limits

Source files ≤ 300 lines. Split by responsibility if exceeded.

## Testing

```bash
# Backend tests (262 passing)
cd backend && source .venv/bin/activate
PYTHONPATH=. python -m pytest tests/ -v

# Frontend tests
npm run test
```

Every PR must:

- Pass all existing tests
- Add tests for new functionality
- Test auth enforcement (401/403)
- Test tenant isolation

## Git Workflow

1. Create feature branch: `git checkout -b feature/description`
2. Make changes following architecture rules
3. Run tests: `pytest tests/` and `npm test`
4. Commit with conventional format: `feat(scope): description`
5. Rebase onto main: `git fetch origin main && git rebase origin/main`
6. Push and create PR

## Key Files

| File                              | Purpose                              |
|-----------------------------------|--------------------------------------|
| `CLAUDE.md`                       | Non-negotiable rules — always wins   |
| `.junie/guidelines.md`            | Junie AI agent coding standards      |
| `.claude/ARCHITECTURE.md`         | Architecture brain map               |
| `.github/copilot/instructions.md` | Copilot coding rules                 |
| `docs/gotchas.md`                 | Known pitfalls                       |
| `docs/OPEN_QUESTIONS.md`          | Blocking decisions                   |
| `shared/constants/`               | Single source of truth for constants |
