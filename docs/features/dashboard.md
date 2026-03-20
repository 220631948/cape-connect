# Dashboard Screen — Feature Documentation

> **TL;DR:** The primary operational interface for the CapeTown GIS Hub, featuring real-time spatial data widgets, interactive map controls, and drag-and-drop data ingestion. Built with Next.js 15, MapLibre GL JS, and Tailwind CSS.

## Overview

The dashboard provides a unified view of geospatial activities in Cape Town and the Western Cape. It is designed for high-performance rendering of both vector and raster data, with a "Near-Black" dark mode to reduce eye strain during prolonged operational use.

## Core Widgets

### 1. Live Flight Telemetry (`LiveFlightTelemetry`)
The Live Flight Telemetry widget provides real-time tracking of aircraft within the Cape Town Flight Information Region (FIR).

- **Data Source:** OpenSky Network API (ADS-B).
- **Features:**
  - **Real-time Updates:** Position, altitude, velocity, and vertical rate.
  - **Visual Indicators:** Directional icons oriented to aircraft heading.
  - **Trace Toggle:** Option to view recent flight paths (trajectories).
  - **Alerts:** Highlighted alerts for emergency squawk codes or altitude deviations.
- **Visuals:** Uses `--accent-blue` (#00D1FF) for active aircraft and `--accent-pink` (#FF61EF) for alerts.

### 2. Quick-Drop Data Area (`QuickDropArea`)
The Quick-Drop Data Area is a high-visibility landing zone for rapid data ingestion.

- **Purpose:** Allows users to "drop" geospatial files directly onto the dashboard for immediate visualization without navigating complex import menus.
- **Supported Formats:** GeoJSON, KML, GPX, and CSV (with lat/long).
- **Functionality:**
  - **Drag-and-Drop:** Intuitive file handling with visual feedback.
  - **Instant Preview:** Data is parsed in the browser and rendered as a temporary layer on the map.
  - **Validation:** Immediate feedback on CRS (Coordinate Reference System) and data integrity.
- **Visuals:** Border glows with `--accent-cyan` (#66FCF1) during active hover/drag events.

## UI/UX Enhancements

### Near-Black Dark Mode
The dashboard utilizes a `#0B0C10` base palette, providing a deep, high-contrast environment that makes the "Crayon Accents" pop. This aesthetic is optimized for clarity in low-light environments (e.g., control rooms).

### Tailwind CSS Migration
The dashboard has been fully migrated to **Tailwind CSS**, replacing legacy CSS modules.
- **Performance:** Reduced CSS bundle size.
- **Consistency:** Uses a unified theme configuration (`tailwind.config.ts`) that matches the Design System.
- **Responsive Design:** Optimized for mobile, tablet, and desktop viewports using Tailwind's breakpoint system.

## Interactions

- **Map Linkage:** Clicking a flight in the telemetry widget pans the map to its current location.
- **Layer Control:** Widgets can be toggled on/off to declutter the workspace.
- **Persistent State:** Dashboard layout and active layers are persisted to local storage per tenant.

## Compliance

- **Data Source Badges:** Every widget displays a mandatory `[SOURCE · YEAR · STATUS]` badge.
- **POPIA:** No PII is displayed in the public dashboard; all valuation data is anonymized unless the user is authenticated with elevated privileges.
