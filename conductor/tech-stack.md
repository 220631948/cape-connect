# Technology Stack

This document defines the technical foundation of the project.

## Languages

### Primary
- **TypeScript**: ^5.0.0 - Frontend and API development.
- **SQL**: PostgreSQL 15 - Database schema and RLS.

---

## Frameworks & Libraries

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| Next.js | 15.5.12 | App Router and API Routes |
| Supabase | Latest | Auth, Database, Storage |
| Martin | Rust | MVT Tile Server |

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| MapLibre GL JS | Latest | Core Mapping Engine |
| Zustand | Latest | State Management |
| Tailwind CSS | ^4.0.0 | Styling |
| Recharts | Latest | Data Visualization |
| Serwist | Latest | PWA / Service Worker |
| Dexie.js | Latest | IndexedDB Storage |
| Turf.js | Latest | Geospatial Analysis |

### Testing
| Library | Version | Purpose |
|---------|---------|---------|
| Vitest | ^3.0.0 | Unit and Integration Testing |

---

## Infrastructure

### Hosting
- **Vercel**: Frontend and API hosting.
- **DigitalOcean**: Martin MVT tile server hosting.

### Database
- **Supabase (PostgreSQL)**: Multi-tenant data storage with PostGIS.

---

## Development Tools

### Package Manager
- npm

### Linting & Formatting
- ESLint: Next.js 15 config.
- Prettier: Code formatting.

---

## Naming Conventions

- **Files**: kebab-case (e.g., `spatial-view.tsx`).
- **Components**: PascalCase (e.g., `SpatialView`).
- **Functions**: camelCase.
- **Constants**: UPPER_SNAKE_CASE.

---

## Code Patterns

### Import Order
1. External libraries
2. Internal modules
3. Relative imports
4. Types/interfaces

### Error Handling
- Use try-catch in server actions and API routes.
- Graceful fallbacks to MOCK data for map components.

### API Conventions
- RESTful routes in `/app/api`.
- JSON response format.
