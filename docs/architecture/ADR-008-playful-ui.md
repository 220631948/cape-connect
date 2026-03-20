# ADR 008: Playful Documentation UI (Ralph Wiggum Theme)

> **TL;DR:** Adopted a playful "Ralph Wiggum" documentation style with a technical toggle to make complex GIS concepts (RLS, MVT, POPIA) accessible to non-technical stakeholders while preserving rigorous technical specs underneath.

**Status:** Accepted
**Date:** 2026-03-01
**Deciders:** Senior GIS Architect, Product Strategist

## Context

GIS applications and underlying architecture (Next.js 15, PostGIS, RLS, MVT) are complex to explain to non-technical stakeholders, students, and junior developers.

## Decision Drivers

- **Accessibility:** Literal analogies make RLS and three-tier fallback understandable
- **Engagement:** Attract students (18+) and regional professionals with unique brand identity
- **Clarity:** "Ralph Wiggum" literal lens demystifies technical debt and governance

## Considered Options

1. **Standard corporate documentation:** Safe but high friction for students
2. **Strict academic documentation:** Precise but alienating for field users
3. **Playful "Ralph" with technical toggle:** Hybrid analogies + raw specs

## Decision

Chosen option: **Playful "Ralph" Documentation with Technical Toggle**.

### Implementation Strategy

- **Theme:** Dark dashboard base with bright "crayon" accents
- **Interactivity:** SVG-based "Playground" to demo zoning and RLS
- **Dual mode:** Global toggle between playful analogies and raw technical specs

## Consequences

- **Good:** Dramatically lowers onboarding friction; creates memorable regional brand
- **Bad:** Risk of "unprofessional" perception if technical toggle isn't robust
- **Neutral:** Requires maintaining dual-language copy (Ralph vs. Tech)

## Acceptance Criteria

- [ ] Documentation toggle switches between playful and technical modes
- [ ] All Ralph analogies have corresponding technical explanations
- [ ] Dark mode theme with crayon accents renders correctly
- [ ] Non-technical stakeholders can understand core concepts without toggle
