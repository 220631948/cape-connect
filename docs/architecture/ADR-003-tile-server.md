# ADR 003: Tile Server (Martin)

> **TL;DR:** Selected Martin (Rust MVT server) over pg_tileserv and GeoServer for low-latency, lightweight vector tile serving from PostGIS with auto-discovery and dynamic SQL function support.

**Status:** Accepted
**Date:** 2026-03-01
**Deciders:** Senior GIS Architect

## Context

We need to serve dynamic vector tiles from a PostGIS database with support for on-the-fly filtering (e.g., properties by value or zone type).

## Decision Drivers

- **Performance:** Low latency tile generation
- **Ease of config:** Auto-discovery of PostGIS tables and functions
- **Dynamic queries:** Pass parameters to SQL functions through tile URLs

## Considered Options

1. **pg_tileserv (Crunchy Data):** Go-based, solid, but Martin shows better high-concurrency performance
2. **GeoServer:** Java-based, feature-rich but heavy and complex for simple MVT serving
3. **Martin:** Rust-based, fast, lightweight, designed specifically for MVT from PostGIS

## Decision

Chosen option: **Martin**. Rust performance benefits and auto-discovery simplicity make it ideal.

## Consequences

- **Good:** Extremely low resource usage, fast response times, easy Docker scaling
- **Bad:** Smaller community than GeoServer
- **Neutral:** Requires `martin.yaml` configuration for complex functions

## Acceptance Criteria

- [ ] Martin auto-discovers PostGIS tables on startup
- [ ] MVT tiles served at <50ms latency for cached requests
- [ ] Dynamic SQL functions support parameter passing via tile URLs
- [ ] Docker container runs with <256MB RAM
