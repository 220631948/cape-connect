---
name: gis-layer-wiring
description: Automates the setup of new GIS layers, including Martin configuration, MapLibre registry, and THREE-TIER fallbacks.
---

# GIS Layer Wiring Skill

## Purpose

Rapidly provision new geospatial layers in `capegis`. Reduces the time to add an overlay from days to minutes by automating boilerplate and registry updates.

## Inputs

- **Layer Name:** (e.g., `flood_zones`)
- **PostGIS Table:** (e.g., `spatial.coct_flood_risk`)
- **Zoom Range:** `{ min: number, max: number }`
- **Layer Type:** `fill` | `line` | `circle` | `symbol`

## Procedure

### 1. Martin Configuration

- Invoke `martin-admin` tool `wire_layer` with the input parameters.
- Add the returned MapLibre source configuration to the project's source registry.

### 2. Mock Generation

- Queries 5 representative features from the PostGIS table.
- Normalizes them to the `capegis` property model.
- Writes the result to `public/mock/{layer_name}.geojson`.

### 3. API Route Creation

- Creates `src/app/api/{layer_name}/route.ts`.
- Implements the mandatory `LIVE→CACHED→MOCK` fallback pattern.

### 4. Layer Registry (CLAUDE.md)

- Adds the layer to the `CLAUDE.md` Z-Order stack in the correct position.
- Updates the layer permissions in Supabase (`layer_permissions` table).

### 5. Verification

- Writes a tier-reachability test in `src/__tests__/layers/{layer_name}.test.ts`.
- Confirms that the layer renders in MapLibre when the mock is targeted.

## Outputs

- **Modified Files:** `src/app/api/...`, `public/mock/...`, `CLAUDE.md`.
- **New Files:** Layer-specific Vitest files.

## Registration

- Manual execution by developer to bootstrap new features.
- CI post-deployment task for environment-specific wiring.
