---
name: repo_graph
description: >
  Traverse src/ and supabase/migrations/ to map exported hooks, API routes, and
  component dependencies. Detects circular imports and orphaned components.
__generated_by: aris-unit-3
__timestamp: "2026-03-14T00:00:00Z"
---

## Purpose

Maps the repository's module dependency graph by traversing `app/src/` (components,
hooks, lib) and `supabase/migrations/`. Identifies exported hooks, API routes, component
import chains, and flags circular dependencies or orphaned (unreferenced) files.
Used by FEATURE-BUILDER before scaffolding and by REPO-ARCHITECT for ARCHITECTURE.md updates.

## Trigger Conditions

- FEATURE-BUILDER session start (before scaffolding a new feature)
- REPO-ARCHITECT `/analyze-repo` or `/explain-architecture` command
- When a circular import is suspected in a failing build
- Before REFACTOR-SPECIALIST executes a module split
- Monthly ARIS self-evolution architecture review

## Procedure

1. **Enumerate source files:** list all `.tsx` and `.ts` files in `app/src/` recursively,
   excluding `node_modules/`, `.next/`, and `*.test.ts`.

2. **Extract imports per file:** for each file, read `import` statements and categorise:
   - `internal` — relative path (`./`, `../`)
   - `aliased` — project alias (`@/`, `~/`)
   - `external` — npm package name

3. **Build adjacency list:** `{ file → [imported_files] }` (internal + aliased only).

4. **Enumerate API routes:** traverse `app/src/app/api/` — list all `route.ts` files
   with their HTTP method exports (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).

5. **Enumerate custom hooks:** traverse `app/src/hooks/` — list all exported hook
   names with their dependencies.

6. **Enumerate migrations:** traverse `supabase/migrations/` — list all `.sql` files
   with timestamp, target table name (parsed from `CREATE TABLE` statement).

7. **Detect cycles:** DFS traversal of adjacency list with visited/recursion-stack tracking.
   Report each cycle as: `A → B → C → A`.

8. **Output structured map** with sections: API Routes, Custom Hooks, Component Graph,
   Migration Timeline, Warnings (cycles + orphans).

## Output Format

```
=== REPO GRAPH ===
Date: 2026-03-14

API ROUTES (N)
  GET  /api/analysis    → app/src/app/api/analysis/route.ts
  POST /api/export      → app/src/app/api/export/route.ts

CUSTOM HOOKS (N)
  useMapStore     → app/src/hooks/useMapStore.ts
  useAuth         → app/src/hooks/useAuth.ts

COMPONENT GRAPH (N nodes, N edges)
  MapView → [useMapStore, MapLegend, LayerControl]
  LayerControl → [useLayerStore]

MIGRATIONS (N)
  20240101_profiles.sql → profiles
  20240102_rls.sql      → (all tables)

WARNINGS
  ⚠️ CYCLE: ComponentA → ComponentB → ComponentA
  ⚠️ ORPHAN: app/src/components/OldWidget.tsx (no imports found)
```

## When NOT to Use

- On single-file edits (overhead not justified for small changes)
- When only checking one specific import — use the Read tool directly
- For non-TypeScript files (images, CSS, SQL — not part of module graph)
