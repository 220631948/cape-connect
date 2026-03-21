# shared/ — Cross-Cutting Contracts

Shared types, constants, and API contracts used by both frontend and backend.

## Purpose

This directory enforces a **single source of truth** for:

- API request/response schemas (JSON Schema or TypeScript types → Python Pydantic)
- Geographic constants (Cape Town bbox, CRS codes)
- Role hierarchy and permission definitions
- Error code enums shared across frontend error handling and backend responses

## Structure

```
shared/
├── constants/
│   ├── bbox.ts          # Cape Town bounding box — mirrors domain/value_objects/bbox.py
│   ├── roles.ts         # GUEST → VIEWER → ANALYST → POWER_USER → TENANT_ADMIN → PLATFORM_ADMIN
│   └── formats.ts       # Supported GIS import/export formats
├── schemas/
│   ├── api-errors.ts    # Standardized error response shape
│   └── spatial.ts       # Suitability score, GeoJSON geometry contracts
└── README.md
```

## Rules

1. **No framework dependencies** — shared/ must be importable by both Next.js and Python
2. **Constants only** — no business logic, no I/O, no state
3. **Single source of truth** — if a value exists here, do not duplicate it elsewhere
4. **Version together** — changes here require updates to both frontend and backend consumers
