# Development Guidelines — CapeTown GIS Hub

This document provides essential information for developers working on the CapeTown GIS Hub project.

## 1. Build and Configuration Instructions

### Infrastructure Setup

The project relies on a local spatial stack managed via Docker Compose.

- **PostGIS**: PostgreSQL 17 with PostGIS 3.5 extensions.
- **Martin**: A high-performance PostGIS vector tile server (MVT).
- **LocalStack**: Used for simulating AWS services locally.

**Commands:**

```bash
# Start the spatial infrastructure
docker compose up -d

# Verify services are healthy
docker compose ps
```

### Node.js Environment

The project uses **Next.js 15 (App Router)** and **pnpm** as the package manager.

**Setup:**

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Environment Variables

Copy `.env.example` to `.env.local` and populate the following keys:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for administrative tasks.
- `DATABASE_URL`: Connection string for PostGIS (e.g., `postgres://postgres:postgres@localhost:5432/capegis`).
- `MARTIN_URL`: URL to the Martin tile server (default: `http://localhost:3005`).

### Codebase Restoration (Critical)

If you find the repository root missing key files (like `package.json` or the full `src/` directory), it is likely in a "stripped" state awaiting consolidation. You can restore the canonical state using the backup tag:

```bash
git checkout backup/auto-resume-master-20260315T080754 -- .
```

---

## 2. Testing Information

### Frameworks

- **Unit/Integration Testing**: [Vitest](https://vitest.dev/) with `jsdom` environment.
- **E2E Testing**: [Playwright](https://playwright.dev/).

### Running Tests

```bash
# Run all Vitest tests
pnpm test

# Run Vitest in watch mode
pnpm test:watch

# Run Playwright E2E tests
pnpm test:e2e
```

### Adding New Tests

Tests should be placed in `__tests__` directories relative to the code they test. Use the `.test.ts` or `.spec.ts` suffix.

**Example Test (`src/lib/__tests__/math.test.ts`):**

```typescript
import { describe, it, expect } from "vitest";

describe("Spatial Calculations", () => {
  it("correctly calculates a buffer distance", () => {
    // Example logic
    const distance = 100 + 200;
    expect(distance).toBe(300);
  });
});
```

**Verification:**
Run the specific test to verify:
`pnpm vitest run src/lib/__tests__/math.test.ts`

---

## 3. Additional Development Information

### Code Style & Standards

- **Component Pattern**: Use functional components with `React.FC` and Tailwind CSS for styling.
- **Naming Conventions**:
  - Components: `PascalCase` (e.g., `FeatureGrid.tsx`).
  - Hooks: `camelCase` starting with `use` (e.g., `useUrlState.ts`).
  - Variables/Functions: `camelCase`.
- **Geographic Scope**: The application is strictly limited to **Cape Town and the Western Cape Province**.
- **Data Integrity**: Every data display must show a `SourceBadge` indicating `[SOURCE · YEAR · STATUS]` (LIVE, CACHED, or MOCK).
- **Security**:
  - **RLS**: Row-Level Security is mandatory for all tables.
  - **Multi-tenancy**: Ensure all queries are scoped to `tenant_id` using the `current_setting('app.current_tenant')` pattern in SQL or the application-layer tenant provider.

### Specialized Stack Components

- **MapLibre GL JS**: Primary 2D mapping engine.
- **CesiumJS**: Used for 3D terrain and building extrusions in Hybrid View.
- **Martin MVT**: Serves vector tiles directly from PostGIS functions or tables.
- **Serwist**: Manages PWA and service worker logic for offline support.
