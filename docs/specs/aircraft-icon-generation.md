# Aircraft Icon Generation

**Spec:** M7 OpenSky Flight Tracking — Unit 6
**Asset:** `public/sprites/aircraft-icon.svg`
**Purpose:** Top-down aircraft silhouette for MapLibre GL JS `icon-rotate` symbol layer
**Created:** 2026-03-11

---

## 1. Source SVG

The canonical source is `public/sprites/aircraft-icon.svg`.

Key design decisions:
- **ViewBox:** `0 0 32 32` — matches MapLibre's default icon-size baseline
- **Orientation:** Nose points **UP** (toward `y=0`). MapLibre applies `icon-rotate`
  in clockwise degrees from north, so 0° heading must already face north in the sprite.
- **Fill:** `#ffffff` on transparent background. Tint per-feature via `icon-color`.
- **No stroke:** Pure fill paths — avoids aliasing artefacts in WebGL rasterisation.
- **Centre:** All shapes centred on `16,16` so the icon rotates around its own axis.

| Element | Description |
|---------|-------------|
| `<ellipse cx="16" cy="16" rx="2" ry="10">` | Fuselage — nose at y=6, tail at y=26 |
| Two `<polygon>` wings | Swept-back from mid-fuselage at y=14–18 |
| Two `<polygon>` tail fins | Small delta fins at y=24–28 |

---

## 2. Why PNG Is Needed for Production

MapLibre GL JS renders icons via WebGL, which requires rasterised bitmap images.
SVG cannot be passed directly to `map.addImage()` reliably across browsers:

- **Chrome/Edge:** SVG data-URL works in most cases.
- **Firefox:** SVG-sourced `HTMLImageElement` may not composite correctly at 32 px.
- **Safari:** Intermittent failures when SVG references external assets.

**Recommendation:** Convert to PNG for production. Use the SVG data-URL only for
local prototyping (see Option D).

---

## 3. Rasterisation Options

### Option A: ImageMagick

```bash
convert public/sprites/aircraft-icon.svg -resize 32x32 public/sprites/aircraft-icon.png
convert public/sprites/aircraft-icon.svg -resize 64x64 public/sprites/aircraft-icon@2x.png
```

Check SVG delegate: `convert -list delegate | grep svg`
If missing, install `librsvg2-bin` (Debian/Ubuntu) or use Option B.

---

### Option B: Sharp (Node.js) — recommended

```bash
npm install --save-dev sharp
```

`scripts/rasterise-sprites.mjs`:

```javascript
import sharp from 'sharp';

const sizes = [
  { size: 32, suffix: '' },
  { size: 64, suffix: '@2x' },
];

for (const { size, suffix } of sizes) {
  await sharp('public/sprites/aircraft-icon.svg')
    .resize(size, size)
    .png()
    .toFile(`public/sprites/aircraft-icon${suffix}.png`);
  console.log(`✓ aircraft-icon${suffix}.png (${size}×${size})`);
}
```

Add to `package.json`: `"sprites": "node scripts/rasterise-sprites.mjs"`

---

### Option C: Inkscape CLI

```bash
inkscape --export-type=png --export-width=32 --export-height=32 \
  --export-filename=public/sprites/aircraft-icon.png \
  public/sprites/aircraft-icon.svg

inkscape --export-type=png --export-width=64 --export-height=64 \
  --export-filename=public/sprites/aircraft-icon@2x.png \
  public/sprites/aircraft-icon.svg
```

Requires Inkscape ≥ 1.0.

---

### Option D: SVGR / Next.js (UI only — not MapLibre WebGL)

```bash
npm install --save-dev @svgr/webpack
```

Use the SVG as a React component for legend items, tooltips, and UI badges.
Do **not** use this path for the MapLibre symbol layer.

---

## 4. MapLibre Sprite Sheet Structure

```
public/sprites/
├── sprites.png          ← All icons packed into one PNG atlas
├── sprites@2x.png       ← Retina (2× pixel density)
├── sprites.json         ← Icon name → position/size descriptor
└── sprites@2x.json
```

`sprites.json` example:

```json
{
  "aircraft-icon": {
    "x": 0, "y": 0,
    "width": 32, "height": 32,
    "pixelRatio": 1, "sdf": false
  }
}
```

Reference in MapLibre style:

```typescript
new maplibregl.Map({
  style: {
    version: 8,
    sprite: '/sprites/sprites',   // MapLibre appends .json / @2x.json automatically
    sources: {}, layers: [],
  },
});
```

---

## 5. Loading a Single Icon Directly (Prototyping)

### Via PNG

```typescript
map.loadImage('/sprites/aircraft-icon.png', (error, image) => {
  if (error) throw error;
  if (!map.hasImage('aircraft-icon')) map.addImage('aircraft-icon', image!);
});
```

### Via SVG Data URL (development only)

```typescript
// Load aircraft icon into MapLibre
const img = new Image(32, 32);
img.src = '/sprites/aircraft-icon.svg';
img.onload = () => {
  if (!map.hasImage('aircraft-icon')) map.addImage('aircraft-icon', img);
};
```

> **Warning:** Replace with PNG before production (unreliable in Firefox/Safari WebGL).

---

## 6. Usage in FlightLayer Component

```typescript
/** Registers the aircraft icon and adds the flight symbol layer. */
export function addFlightLayer(map: maplibregl.Map): void {
  const img = new Image(32, 32);
  img.src = '/sprites/aircraft-icon.svg';
  img.onload = () => {
    if (!map.hasImage('aircraft-icon')) map.addImage('aircraft-icon', img);

    if (!map.getSource('flights')) {
      map.addSource('flights', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!map.getLayer('flights-icons')) {
      map.addLayer({
        id: 'flights-icons',
        type: 'symbol',
        source: 'flights',
        layout: {
          'icon-image': 'aircraft-icon',
          'icon-size': 0.8,
          'icon-rotate': ['get', 'heading'],  // degrees clockwise from north
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
        paint: { 'icon-opacity': 0.9 },
      });
    }
  };
}
```

---

## 7. Directory Structure After Generation

```
public/sprites/
├── aircraft-icon.svg        ← Source (committed to git)
├── aircraft-icon.png        ← Generated 32×32 PNG
├── aircraft-icon@2x.png     ← Generated 64×64 PNG
├── sprites.png              ← Packed atlas (future: multiple icons)
├── sprites@2x.png
├── sprites.json
└── sprites@2x.json
```

Add generated PNGs to `.gitignore` if they are build artefacts:

```gitignore
# Generated sprite PNGs — rebuild with `npm run sprites`
public/sprites/*.png
public/sprites/*.json
!public/sprites/**/*.svg
```

---

## 8. SDF Icons (Optional Enhancement)

MapLibre SDF icons allow runtime colour changes via `icon-color` paint property.
The aircraft icon is currently **not SDF** (`"sdf": false`).

To enable SDF:
1. Generate the PNG with an SDF-compatible tool.
2. Set `"sdf": true` in the sprite JSON descriptor.
3. `map.addImage('aircraft-icon', img, { sdf: true })`
4. Apply: `'icon-color': '#facc15'` (e.g., yellow for selected aircraft).

SDF is recommended if per-aircraft colour coding is needed (e.g., altitude bands).

---

*Generated by Claude Code · M7 Unit 6 · 2026-03-11*
