# GIS Extension Ideas

> **TL;DR:** 10 domain-expanding features scored with RICE, aligned to `PLAN.md` milestones and `ROADMAP.md` six-pillar architecture. Phase 1 (M5-M10) focuses on low-regret usability gains. Phase 2 (M11-M13) introduces advanced analysis. Phase 3 (M14-M15+) requires stronger validation. See `CLAUDE.md` for rules.

## Scoring Method
- **RICE = Reach × Impact × Confidence / Effort**
- Reach: domain breadth (1–10) | Impact: user-value (1–5) | Confidence: evidence (0.3–1.0) | Effort: complexity (1–10)

## Extension Portfolio — Milestone Mapped

| Extension | Milestone | Reach | Impact | Confidence | Effort | RICE | Evidence Notes |
|---|---|---:|---:|---:|---:|---:|---|
| Job-specific default views | M3/M5 | 10 | 4 | 0.90 | 4 | 9.00 | Low technical risk; high usability for non-specialists |
| Real-time incident tracking | M5+ | 9 | 5 | 0.75 | 7 | 4.82 | Needs live-feed reliability validation |
| GeoFile batch analysis | M6/M8 | 8 | 4 | 0.80 | 6 | 4.27 | Strong need from multi-file workflows |
| Geo-storytelling dashboards | M11 | 7 | 3 | 0.85 | 5 | 3.57 | Governance controls required for published content |
| 4D immersive WorldView | M11+ | 7 | 5 | 0.70 | 8 | 3.06 | Depends on timeline sync and AI label UX maturity |
| Mobile field collection | M4c+ | 8 | 4 | 0.65 | 7 | 2.97 | Offline conflict resolution still uncertain |
| OSINT public map mashups | M5+ | 7 | 4 | 0.70 | 7 | 2.80 | Licensing/ethics boundaries must be enforced |
| NL spatial query copilot | M7+ | 9 | 4 | 0.55 | 8 | 2.48 | **[ASSUMPTION — UNVERIFIED]** intent disambiguation quality |
| Predictive hazard assistant | M15+ | 8 | 5 | 0.45 | 9 | 2.00 | **[ASSUMPTION — UNVERIFIED]** model accuracy tolerance |
| AI annotation suggestions | M15+ | 6 | 3 | 0.60 | 6 | 1.80 | Must avoid over-automation bias |

## Acceptance Criteria (All Extensions)
- [ ] Source badge visible: `[SOURCE · YEAR · LIVE|CACHED|MOCK]` (Rule 1)
- [ ] LIVE→CACHED→MOCK fallback implemented (Rule 2)
- [ ] Geographic scope: Cape Town + Western Cape only (Rule 9)
- [ ] POPIA annotations on files handling personal data (Rule 5)
- [ ] File size ≤ 300 lines (Rule 7)
- [ ] Tenant isolation via RLS + app-layer (Rule 4)

## 2026 Roadmap Alignment

| Phase | Extensions | Pillar |
|---|---|---|
| Phase 1 (M5-M10) | Job views, incident tracking, GeoFile batch | 4 (Domain), 6 (Formats) |
| Phase 2 (M11-M13) | Storytelling, 4D WorldView, mobile field, OSINT | 1 (Tiles), 2 (OSINT), 3 (AI) |
| Phase 3 (M14-M15+) | NL copilot, predictive hazard, AI annotations | 3 (AI), 4 (Domain) |

## Known Uncertainties
- Reach estimates are cross-domain approximations, not telemetry
- Confidence reflects documentation evidence, not production A/B outcomes
- Effort assumes existing architecture docs are implemented per plan

## References
- `PLAN.md` (milestone definitions M0-M15)
- `ROADMAP.md` (six-pillar architecture)
- `CLAUDE.md` (project rules)
- `docs/features/immersive-4d-reconstruction.md` (4D pipeline design)
