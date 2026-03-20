# Implementation Plan: Fix maplibre-gl-draw imports

## Phase 1: Code Changes
- [x] Task 1: Update imports in `src/components/map/controls/DrawControl.tsx`.
  - Replace `@mapbox/mapbox-gl-draw` with `maplibre-gl-draw`.
  - Update CSS path to `maplibre-gl-draw/dist/mapbox-gl-draw.css`.

## Phase 2: Verification
- [x] Task 2: Run `npm run build` to verify the fix.
- [x] Task 3: (Manual) Check the dashboard map to ensure drawing tools load correctly if possible.
