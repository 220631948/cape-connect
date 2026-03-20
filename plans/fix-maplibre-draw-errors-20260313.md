# Implementation Plan: Fix MapLibre Draw Module Resolution & Cache Corruption

## Root Cause Analysis
1. **Symptom:** `Module not found: Can't resolve '@mapbox/mapbox-gl-draw'` in `DrawControl.tsx`.
   - **Root Cause:** The project is standardized on MapLibre, but the component is attempting to import the legacy Mapbox-branded package which is not present in `package.json`.
2. **Symptom:** `Module not found: Can't resolve 'maplibre-gl-draw/dist/maplibre-gl-draw.css'`.
   - **Root Cause:** Incorrect path for the CSS file. Even in the `maplibre-gl-draw` package, the distribution file retains the original `mapbox-gl-draw.css` filename.
3. **Symptom:** `Error: incorrect header check` during `npm run dev`.
   - **Root Cause:** Next.js/Webpack cache corruption in the `.next` directory, likely caused by interrupted builds or file system sync issues.

## Investigation Steps
1. **Verify Package:** Check `node_modules/maplibre-gl-draw/dist/` to confirm the actual filename of the CSS and JS bundles.
2. **Check Cache Status:** Verify the size and state of the `.next` directory.

## Fix Plan
### 1. Source Code Correction
Modify `src/components/map/controls/DrawControl.tsx`:
- Change JS import: `import MapboxDraw from '@mapbox/mapbox-gl-draw';` → `import MapboxDraw from 'maplibre-gl-draw';`
- Change CSS import: `import 'maplibre-gl-draw/dist/maplibre-gl-draw.css';` → `import 'maplibre-gl-draw/dist/mapbox-gl-draw.css';`

### 2. Cache Purge
Since `rm -rf .next` may be restricted in some environments, use the standard Next.js clean approach or manual deletion:
- Manually remove the `.next` directory to force a full re-compilation.

### 3. Verification
- Run `npm run build` to ensure production compilation passes.
- Run `npm run dev` to ensure the development server starts without cache errors.

## Timeline
| Phase | Duration |
|-------|----------|
| Investigation | 5 min |
| Code Fixes | 5 min |
| Cache Purge | 2 min |
| Verification | 10 min |
| **Total** | **22 min** |

## Rollback Plan
- Revert changes in `DrawControl.tsx` using `git checkout src/components/map/controls/DrawControl.tsx`.
- Note: Cache purge cannot be rolled back, but will be recreated on next run.

## Security Checklist
- [x] Input validation (N/A)
- [x] Auth checks (N/A)
- [x] Rate limiting (N/A)
- [x] Error handling (Added try/catch around map control initialization if needed)
