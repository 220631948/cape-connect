# Task M7: OpenSky Flight Tracking — Readiness Checklist

> **Status:** READY TO START
> **Date:** 2026-03-09
> **Priority:** HIGH (Recommended first implementation task)

---

## Pre-Implementation Checklist

### Documentation Verified
- [x] `task-M7-opensky-flight-layer.md` — Comprehensive specification exists
- [x] `docs/research/spatialintelligence-milestone-complete.md` — Research milestone documented
- [x] `docs/OPEN_QUESTIONS.md` — OQ-016 updated with implementation path
- [x] `docs/PLAN_DEVIATIONS.md` — DEV-007 added (free tier usage)

### Skill Dependencies Available
- [x] `.claude/skills/opensky_flight_tracking/SKILL.md` — OpenSky API integration
- [x] `.claude/skills/spatial_validation/SKILL.md` — CRS handling, bbox validation
- [x] `.claude/skills/three_tier_fallback/SKILL.md` — LIVE→CACHED→MOCK pattern
- [x] `.claude/skills/popia_spatial_audit/SKILL.md` — POPIA compliance for spatial data

### Blocking Questions Resolved
| Question | Status | Notes |
|----------|--------|-------|
| OpenSky commercial licensing | ✅ PARTIALLY — Free tier available for development | Commercial terms only required for multi-tenant deployment |
| Cape Town airspace bbox | ✅ RESOLVED | `lamin=-34.5, lamax=-33.0, lomin=18.0, lomax=19.5` |
| ADS-B coverage quality | ⏳ TESTING REQUIRED | Will be validated during implementation |
| Aircraft icon assets | ⏳ ASSET REQUIRED | SVG/PNG icon needed for MapLibre sprite |

---

## Implementation Prerequisites

### Environment Setup
```bash
# 1. Create OpenSky Network account
# Visit: https://opensky-network.org/register

# 2. Add to .env file
OPENSKY_USERNAME=your_username
OPENSKY_PASSWORD=your_password
```

### Required Files to Create
```
app/src/components/map/
├── FlightLayer.tsx             # MapLibre 2D flight tracking layer
└── aircraft-icon.svg           # Aircraft icon for sprite

app/src/lib/
├── opensky-api.ts              # OpenSky API client
└── flight-data-transformer.ts  # Response → GeoJSON converter

app/src/hooks/
└── useLiveData.ts              # Three-tier fallback hook

public/mock/
└── flights-cape-town.geojson   # Mock fallback data

app/sprites/
└── aircraft-icon.png           # Sprite sheet icon
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Days 1-5)
- [ ] OpenSky API client with rate limiting
- [ ] Cape Town bounding box filter
- [ ] Three-tier fallback (LIVE→CACHED→MOCK)
- [ ] MapLibre 2D layer with aircraft icons
- [ ] Data source badge component

### Phase 2: Polish & Compliance (Days 6-8)
- [ ] Callsign labels with styling
- [ ] Zoom-gated visibility (zoom 6-18)
- [ ] POPIA guest mode filtering
- [ ] "Last updated" timestamp
- [ ] Rate limit 429 handling with backoff

### Phase 3: 3D Enhancement (Days 9-13)
- [ ] CesiumJS 3D entities (if M5 hybrid view complete)
- [ ] Historical track API integration
- [ ] Temporal replay for 4DGS pipeline
- [ ] Performance optimization

---

## Acceptance Criteria Summary

| Criterion | Target |
|-----------|--------|
| Rate limiting | ≤100 req/day (anonymous) or ≤4000 req/day (authenticated) |
| Polling interval | ≥10 seconds between requests |
| Cache TTL | 30 seconds |
| Bounding box | `lamin=-34.5, lamax=-33.0, lomin=18.0, lomax=19.5` |
| Icon rotation | By `true_track` heading (0-360°) |
| Label styling | 11px, cyan (#00d4ff), 2px dark halo |
| Zoom visibility | Zoom levels 6-18 only |
| Guest mode | Airline callsigns only, no private aircraft tracking |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Rate limit exhaustion | Aggressive caching, mock fallback, exponential backoff |
| ADS-B coverage gaps | Coverage quality indicator, alternative source evaluation |
| POPIA violation | Guest mode aggregation, no persistence of private flights |
| Performance (>200 aircraft) | GeoJSON source with buffer:256, LOD management |

---

## Next Steps

1. **Confirm OpenSky account creation** — Register at https://opensky-network.org/register
2. **Create aircraft icon asset** — Simple SVG aircraft silhouette (pointing up/0°)
3. **Begin Phase 1 implementation** — Start with `opensky-api.ts` client

---

*Document created: 2026-03-09 | Ready for /task session*
