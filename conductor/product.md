# Product Context

This document defines what the project is, who it's for, and what it aims to achieve.

## Project Overview

**Name:** CapeTown GIS Hub (capegis)
**One-liner:** Multi-tenant PWA for spatial property intelligence in the City of Cape Town and Western Cape.

**Description:**
A comprehensive Geographical Information System (GIS) platform tailored for the Western Cape region, providing tools for property valuation (GV Roll 2022), spatial analysis, and multi-tenant access control.

---

## Problem Statement

Users in the Western Cape need a centralized, high-performance, and secure spatial intelligence hub to access property valuations, cadastral data, and flight tracking information with multi-tenant isolation and strict POPIA compliance.

---

## Target Users

### Primary Users
- **Tenant Admins**: City of Cape Town officials managing GIS data.
- **Analysts**: Professionals performing spatial analysis on property data.
- **Public/Guests**: Residents viewing basic GIS information.

### User Goals
1. Securely access property valuation data (GV Roll 2022).
2. Perform spatial analysis using vector tiles and high-performance mapping.
3. Track flights over the region using OpenSky data.

---

## Product Goals

### Current Phase (M7_PREP)
- [~] Prepare for M7 (OpenSky Flight Tracking) implementation.
- [ ] Implement live flight tracking components.

### Next Phase
- [ ] Milestone M8 implementation.

---

## Non-Goals

Things we're explicitly NOT trying to do:
- Provide data outside the Western Cape region.
- Support Mapbox GL JS (MapLibre GL JS only).
- Use Lightstone data.

---

## Key Features

### Implemented
- **Multi-tenancy**: RLS-based tenant isolation.
- **High-performance Mapping**: MapLibre GL JS with Martin MVT and PMTiles.
- **GV Roll 2022 Integration**: Authority valuation source.

### Planned
- **OpenSky Flight Tracking**: Live regional flight data.
- **Offline PWA Support**: Enhanced offline maps and storage.

---

## Success Metrics

- 100% POPIA compliance for PII handling.
- < 2s initial map load time.
- Zero data leakage between tenants.
