# Specification: Fix maplibre-gl-draw imports

## Problem
The project fails to build because `src/components/map/controls/DrawControl.tsx` is attempting to import `@mapbox/mapbox-gl-draw`, which is not installed. The project uses `maplibre-gl-draw` instead. Additionally, the CSS import path for `maplibre-gl-draw` is incorrect.

## Requirements
- Replace `@mapbox/mapbox-gl-draw` import with `maplibre-gl-draw`.
- Update the CSS import path to point to the correct file in `node_modules/maplibre-gl-draw/dist/mapbox-gl-draw.css`.
- Ensure the project builds successfully.

## Technical Details
- File to modify: `src/components/map/controls/DrawControl.tsx`
- New JS Import: `import MapboxDraw from 'maplibre-gl-draw';`
- New CSS Import: `import 'maplibre-gl-draw/dist/mapbox-gl-draw.css';`
