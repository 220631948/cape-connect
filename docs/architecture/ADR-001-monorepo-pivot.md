# ADR 001: Next.js 15 Monorepo Pivot

> **TL;DR:** Adopted Turbo monorepo with Next.js 15 App Router to support multi-tenant white-label GIS with shared types, isolated database packages, and optimized builds. Replaces static HTML approach.

**Status:** Accepted
**Date:** 2026-03-01
**Deciders:** Senior GIS Architect, Technical Co-founder

## Context

The project initially targeted static HTML placeholders. However, as a multi-tenant white-label GIS platform with significant data processing requirements (e.g., ~830,000 property parcels), a simple static approach is insufficient for long-term maintainability, scalability, and developer ergonomics.

## Decision Drivers

- **Scalability:** Support multiple tenants with isolated data
- **Performance:** Next.js 15 App Router provides Server Components and optimized data fetching
- **Maintainability:** Monorepo (Turbo) shares types and database logic between packages
- **Offline support:** Native Serwist integration for PWA

## Considered Options

1. **Single Repo (Next.js):** Simple, but harder to separate migrations and shared types
2. **Monorepo (Turbo + Next.js 15):** More setup, better scaling for white-labeling
3. **Legacy Static HTML:** Rejected as unmaintainable for complex spatial logic

## Decision

Chosen option: **Monorepo (Turbo + Next.js 15)**.

- `apps/web`: Primary Next.js 15 application
- `packages/database`: PostGIS migrations and Supabase schema
- `packages/shared-types`: Type safety across the stack

## Consequences

- **Good:** Better code organization, strict type safety, optimized build times
- **Bad:** Increased initial infrastructure complexity (Turbo config, workspace management)
- **Neutral:** Requires developers to understand monorepo workflows

## Acceptance Criteria

- [ ] Turbo workspace configured with `apps/web` and `packages/*`
- [ ] Shared types importable across packages without circular dependencies
- [ ] `npm run build` completes from workspace root
- [ ] CI pipeline builds all packages in dependency order
