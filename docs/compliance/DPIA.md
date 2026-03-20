# DPIA — Data Protection Impact Assessment
## CapeConnect GIS Hub

> **POPIA §33 Compliance** | Document version 1.0  
> **Date:** 2026-03-13  
> **Prepared by:** CapeConnect Engineering Team  
> **Information Officer:** ___________________ (To be signed before go-live)

---

## 1. Processing Overview

| Field | Value |
|---|---|
| **System** | CapeConnect GIS Hub — Multi-tenant PWA for spatial property intelligence |
| **Responsible Party** | CapeConnect (Pty) Ltd |
| **Information Officer** | TBD — Required before production |
| **Processing Purpose** | Provide geospatial property analytics, zoning intelligence, flight tracking, and spatial analysis for City of Cape Town stakeholders |
| **Legal Basis** | Legitimate interest (property analytics), public interest (open data re-use), consent (user-drawn features & account data) |

---

## 2. Data Asset Inventory

### 2.1 Personal Information

| Data Asset | Source | PII Present | Mitigation | Legal Basis |
|---|---|---|---|---|
| **User Profiles** | Supabase Auth | Yes (email, name) | Encrypted at rest, RLS-isolated per tenant | Consent (sign-up) |
| **GV Roll 2022** | CoCT Open Data | **Stripped** — `Full_Names` column removed during ETL | `scripts/import-gv-roll.py` explicitly drops PII | Public interest |
| **User Features** | User-drawn polygons | Indirect (location data) | Tenant-scoped RLS, private to user | Consent |
| **Search Queries** | User input | Indirect (query content) | Tenant-scoped, anonymized logging | Legitimate interest |

### 2.2 Non-Personal Data

| Data Asset | Source | Retention | Notes |
|---|---|---|---|
| **IZS Zoning Polygons** | CoCT ArcGIS / Mock | Indefinite (public record) | No PII |
| **OpenSky ADS-B** | OpenSky Network API | `api_cache` 24h TTL | Guest-filtered (POPIA §12) |
| **CesiumJS 3D Tiles** | Cesium Ion / Self-hosted | Indefinite | Public terrain/buildings |
| **API Cache** | `api_cache` table | `expires_at` column, max 24h | Auto-purged |

---

## 3. Data Flow Diagram

```
┌─────────────┐    HTTPS     ┌──────────────┐    SQL/RLS     ┌─────────────┐
│   Browser   │ ──────────→  │  Next.js API  │ ───────────→  │  Supabase   │
│  (MapLibre  │ ←──────────  │   Routes      │ ←───────────  │  (PostGIS)  │
│   Cesium)   │    JSON      │  middleware.ts │   Tenant-     │  RLS + GIST │
└─────────────┘              └───────┬───────┘   scoped       └─────────────┘
                                     │
                              ┌──────┴───────┐
                              │  OpenSky API  │  Rate-limited, guest-filtered
                              │  Cesium Ion   │  Token-auth, public tiles
                              │  CARTO CDN    │  Public basemap tiles
                              └──────────────┘
```

See also: [`POPIA-DATA-FLOW.md`](./POPIA-DATA-FLOW.md) for interactive Mermaid diagram.

---

## 4. Processing Principles (POPIA §4)

| Principle | Implementation |
|---|---|
| **Accountability** | This DPIA; Information Officer designated |
| **Processing Limitation** | Only property/spatial data required for platform function |
| **Purpose Specification** | Geospatial analytics only; no secondary marketing use |
| **Further Processing** | None — data not shared beyond tenant boundary |
| **Information Quality** | Source badges show data provenance and freshness |
| **Openness** | Privacy policy link in login footer; POPIA banner on first visit |
| **Security Safeguards** | RLS, RBAC, encrypted transport (TLS), GIST spatial indexes |
| **Data Subject Participation** | Delete-account clears profiles + user_features |

---

## 5. Third-Party Processors

| Processor | Data Shared | Contract | Location |
|---|---|---|---|
| **Supabase** | Auth profiles, DB records | DPA in place | US/EU (configurable region) |
| **Vercel** | Edge compute, IP logs | DPA in Vercel TOS | Global edge |
| **Cesium Ion** | 3D tile requests (no PII) | TOS | US |
| **OpenSky Network** | Outbound API calls (no PII) | Public API TOS | EU |
| **CARTO CDN** | Basemap tile requests (no PII) | Public CDN | Global |

---

## 6. Retention Schedule

| Data Type | Retention Period | Deletion Method |
|---|---|---|
| User profiles | Until account deletion | `DELETE FROM profiles WHERE user_id = ?` |
| User features | Until account deletion | Cascade from profiles |
| API cache | Max 24 hours | `expires_at` TTL + periodic cleanup |
| GV Roll 2022 | Indefinite (public record) | Not PII after ETL strip |
| Search logs | 90 days rolling | Auto-purge cron |
| OpenSky cache | 24 hours | `expires_at` TTL |

---

## 7. Security Controls

| Control | Implementation | Status |
|---|---|---|
| Row-Level Security | All tables have `ENABLE/FORCE RLS` | ✅ Verified (M14) |
| Tenant Isolation | `current_setting('app.current_tenant')` | ✅ Verified |
| Transport Encryption | HTTPS only (Vercel edge) | ✅ |
| Auth | Supabase Auth + JWT claims | ✅ |
| RBAC | `viewer`/`editor`/`admin` roles | ✅ |
| CSP Headers | `next.config.ts` (M15 — pending) | 🏗️ In progress |
| Rate Limiting | `/api/*` sliding window (M15 — pending) | 🏗️ In progress |
| PII Stripping | `scripts/import-gv-roll.py` | ✅ Verified |

---

## 8. Data Subject Rights (POPIA §23-25)

| Right | Mechanism |
|---|---|
| **Access** | User can view profile + drawn features via dashboard |
| **Correction** | Profile edit via Supabase Auth |
| **Deletion** | Account deletion cascades to profiles + user_features |
| **Objection** | Contact Information Officer; account deactivation |
| **Portability** | GeoJSON export of user_features (future M16) |

---

## 9. Residual Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| IP logging by Vercel edge | High | Low | Standard for all web services; no PII correlation |
| OpenSky polling cadence exposure | Low | Low | Rate-limited to 10s intervals; no user data sent |
| Spatial inference from user features | Medium | Medium | RLS ensures features visible only to owner + tenant admins |
| Supabase region data residency | Low | Medium | Configurable to EU region; contractual DPA in place |

---

## 10. Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Information Officer | | | |
| Engineering Lead | | | |
| Product Owner | | | |

> **This document must be signed before production deployment under POPIA §33.**
