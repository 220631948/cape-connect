# 🖍️ Cape Town Web GIS Platform — Copilot Instructions

> "I'm a GIS expert! I ated the purple markers." — Ralph Wiggum

## 🤡 The Ralph Wiggum Protocol: Core Philosophy

This project isn't just a website; it's a technical masterpiece wrapped in a childlike hug. Follow these rules to keep Ralph happy:

1.  **Atomic Task Loops**: One task at a time. Refer to `PLAN.md`.
2.  **Trust But Verify (Search First)**: Always use `grep_search` or `codebase_search` before implementing. Avoid duplicate logic.
3.  **No Stubs, No Placeholders**: If you build it, build it fully. No `// TODO` or `/* implementation here */`.
4.  **Character Loyalty**: Use the "Ralph Language" for user-facing strings but maintain professional documentation and technical comments.
5.  **Backpressure & Validation**: Run linting and tests (`npm test`) before committing.
6.  **Disposable Plans**: If the requirements shift, update the code first, then the plan.

---

## 🏗️ Technical Architecture

### Core Stack
- **Frontend**: Next.js 15 App Router (Strict TS), Tailwind CSS, shadcn/ui.
- **Mapping**: **MapLibre GL JS** — NOT Leaflet, NOT Mapbox GL JS.
- **Backend**: PostgreSQL 18 + PostGIS 3.6 via **Supabase**.
- **PWA**: Custom service worker (`service-worker.js`) and `manifest.json`.
- **Animation**: Anime.js for micro-interactions and the Avatar.

### The Interactive Avatar ("Ralph Buddy")
- **Behavior**: Track mouse movement, idle time (>7s), and scroll progress.
- **Dialogue**: Must be non-sequitur, curious, and playful.
- **Logic**: Use `data-context` attributes on UI elements to trigger context-aware speech bubbles.
- **Animations**: Avatar must "peek" from the bottom-right. Use smooth `cubic-bezier` transitions.

---

## 🇿🇦 South African GIS Standards (MANDATORY)

- **Currency**: `ZAR` (e.g., `R1,250,000`). No cents. Comma thousands separator.
- **Spatial Reference**: 
  - Store/Export: `EPSG:4326` (WGS84).
  - Calculations (Area/Dist): `Lo19` (`EPSG:22279`) for Cape Town accuracy.
- **Data Governance**:
  - **POPIA**: Tag all PII-handling code with `// [POPIA]`. Mandatory consent checkboxes.
  - **Attribution**: Always show `© OpenStreetMap contributors © CARTO`.
- **Infrastructure Constraints**:
  - **Loadshedding Resilience**: Cache the PWA shell aggressively.
  - **Bandwidth**: Target 1MB initial bundle; use PMTiles for large layers.

---

## 🏦 Data & Fallback Strategy

1.  **Tier 1 (Live)**: ArcGIS REST APIs (CoCT Open Data Portal).
2.  **Tier 2 (Cache)**: Supabase `api_cache` table for high-traffic endpoints.
3.  **Tier 3 (Mock)**: Static GeoJSON stored locally for offline/demo modes. Use the `[MOCK]` badge.

---

## 🎨 Code Quality & Cleanliness

- **Strict Types**: Absolutely no `any`. Use generics where applicable.
- **Module Size**: Keep files `< 300` lines. If larger, refactor into hooks or components.
- **Error Handling**: Every async call must have a `try-catch` with a user-friendly (Ralph-style) error message.
- **Documentation**: Every file starts with a comment block detailing:
  - `Goal`: What this file does.
  - `Milestone`: Which project milestone it belongs to.
  - `Status`: Experimental, Stable, or Mock.

---

## ✅ Final Check (The Ralph Test)
- "Is it funny?"
- "Is it technical?"
- "Does it work without internet?"
- "Is it unpossible to break?"
