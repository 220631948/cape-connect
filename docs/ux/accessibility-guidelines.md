# Accessibility Guidelines for GIS Spatial Intelligence UX

> **TL;DR:** Accessibility is a core product requirement, not a post-release patch. These guidelines adapt WCAG 2.1 AA to map-heavy and 3D geospatial workflows while keeping interfaces understandable to non-specialists.

## WCAG 2.1 AA for Geospatial Interfaces
- Meet WCAG 2.1 AA contrast, keyboard, focus-order, and screen-reader requirements across map and non-map UI.
- Provide non-visual alternatives for map state (text summaries of selected layers, coordinates, and alerts).
- Ensure every critical action (search, layer toggle, timeline scrub, export) is available without pointer-only interaction.
- Avoid conveying risk/status with color alone; pair with iconography and labels.

## ARIA Patterns for Map Components

### Map Container
```html
<div role="application" aria-label="Interactive map of Cape Town"
     aria-roledescription="map" tabindex="0">
  <div aria-live="polite" aria-atomic="true" class="sr-only"
       id="map-status">
    <!-- Announces: "Viewing Cape Town CBD, zoom level 14, 3 layers active" -->
  </div>
</div>
```

### Layer Panel
```html
<div role="region" aria-label="Map layers">
  <ul role="list">
    <li role="listitem">
      <button role="switch" aria-checked="true"
              aria-label="Zoning overlay, data source: CoCT 2022, status: LIVE">
        Zoning
      </button>
    </li>
  </ul>
</div>
```

### Timeline Scrubber
```html
<div role="slider" aria-label="Event timeline"
     aria-valuemin="0" aria-valuemax="100"
     aria-valuenow="45" aria-valuetext="12:30 PM, 15 March 2025"
     tabindex="0">
</div>
```

### Data Source Badge
```html
<span role="status" aria-label="Data source: OpenSky, year: 2025, status: LIVE">
  [OpenSky · 2025 · LIVE]
</span>
```

### Confidence Indicator
```html
<span role="status" aria-label="Data confidence: medium, last updated 12 minutes ago">
  <span aria-hidden="true">⚠️</span> Medium confidence — 12 min old
</span>
```

## Keyboard Shortcut Reference

| Shortcut | Action | Context |
|----------|--------|---------|
| `Arrow keys` | Pan map (N/S/E/W) | Map focused |
| `+` / `-` | Zoom in / out | Map focused |
| `Space` | Play/pause timeline | Timeline focused |
| `←` / `→` | Step timeline back/forward | Timeline focused |
| `L` | Toggle layer panel | Global |
| `S` | Open search | Global |
| `T` | Jump to timeline controls | Global |
| `D` | Toggle data source badges | Global |
| `H` | Open keyboard help overlay | Global |
| `Escape` | Close panel/overlay/dialog | Global |
| `Tab` | Move focus to next control | Global |
| `Shift+Tab` | Move focus to previous control | Global |
| `Enter` | Activate focused control | Global |
| `F` | Toggle fullscreen map | Map focused |
| `C` | Centre map on current location | Map focused |

- All shortcuts displayed in a dismissible overlay accessible via `H` key or help button.
- Shortcuts are disabled inside text input fields.

## Colour-Blindness Safe Palettes
- Recommended palettes: **Okabe-Ito** and **Viridis** for quantitative overlays.
- Avoid red/green-only hazard encodings; use dual encoding (shape + pattern + text).
- Test overlays at low opacity and high-density conditions to ensure boundaries remain legible.
- Provide user-selectable palette presets by domain (emergency, environment, planning, public mode).

## Screen Reader Testing Checklist

### Setup
- [ ] Test with NVDA (Windows), VoiceOver (macOS/iOS), and TalkBack (Android).
- [ ] Verify browser compatibility: Chrome, Firefox, Safari with each reader.

### Map Interaction
- [ ] Map container announced as "Interactive map" with current location and zoom.
- [ ] Layer toggle announces layer name, data source, and current state (on/off).
- [ ] Zoom changes announce new zoom level and visible area description.
- [ ] Pan announces new centre coordinates in human-readable format.
- [ ] Feature selection announces feature type, name, and key attributes.

### Timeline Controls
- [ ] Slider announces current time position in human-readable format.
- [ ] Play/pause state change announced.
- [ ] Step forward/back announces new timestamp.

### Data Badges
- [ ] Source badge content read aloud including source name, year, and status.
- [ ] Status changes (LIVE→CACHED) announced via `aria-live` region.

### Workflows
- [ ] Complete search → select → view workflow without mouse.
- [ ] Complete layer toggle → inspect → export workflow without mouse.
- [ ] Upload file dialog accessible and announces validation results.
- [ ] Export dialog announces format options and completion status.

### Error States
- [ ] Network errors announced with actionable recovery guidance.
- [ ] Form validation errors linked to input fields via `aria-describedby`.
- [ ] Offline mode transition announced with current data age.

## Screen Reader Navigation and Keyboard 3D Controls
- Use clear ARIA landmarks: main map region, layer panel, timeline controls, provenance panel.
- Announce map state changes in concise live regions (for example, “Layer X enabled, data age 12 minutes”).
- Provide a keyboard help overlay that is reachable and dismissible without mouse.

## Mobile-First Design (Touch, Offline, Low Bandwidth)
- Minimum touch target: 44x44 px for core controls.
- Keep frequently used controls within thumb-reachable zones.
- Support low-bandwidth fallback tiers (LIVE → CACHED → MOCK) with explicit labeling.
- Cache essential basemap tiles and last-known overlays for degraded connectivity use.
- Show lightweight mode automatically when device/network constraints are detected.

## Cognitive Accessibility and Progressive Complexity
- Start each domain in "Essential View" with minimal controls and plain-language labels.
- Offer step-up detail layers only when user asks for advanced mode.
- Prefer sentence-case microcopy and concrete terms ("Flight path confidence: low") over jargon.
- Display short "What this means" explanations beside confidence/uncertainty indicators.
- Keep error messages actionable: what failed, why, and what to do next.

## High-Contrast Emergency Mode
- One-click high-contrast mode for incident operations and low-visibility environments.
- Preserve legibility for perimeters, hazard zones, and call-to-action controls under glare/night conditions.
- Ensure AI/watermark labels remain readable in high contrast and inverted themes.
- Validate with color contrast analyzers and field simulation screenshots.

## Internationalisation and Coordinate Format Localisation
- Support localised number/date/time formats and UTC visibility for multi-agency coordination.
- Accept and normalize common coordinate inputs (decimal degrees, DMS where feasible) with user confirmation.
- Explain detected coordinate interpretation in plain language before plotting.
- Do not silently reinterpret ambiguous coordinate strings.

## AI Content Watermark Accessibility
- AI labels must remain visible at all zoom levels where reconstructed content is visible.
- Watermark text and icons must pass contrast checks in standard and high-contrast themes.
- Provide non-visual equivalent announcements for screen-reader users when AI-generated content enters view.
- Block export pathways that remove or obscure required AI disclosure markers.

## Validation Checklist
- [ ] Keyboard-only completion of core workflows in each domain guide.
- [ ] Screen-reader pass for layer toggling, timeline control, and export steps.
- [ ] Color-blind simulation checks for all hazard and status palettes.
- [ ] Mobile touch target and low-bandwidth behavior verified.
- [ ] High-contrast mode verified for map labels and AI disclosure overlays.
- [ ] All ARIA patterns validated against WAI-ARIA 1.2 spec.
- [ ] Keyboard shortcut overlay is reachable and dismissible via keyboard.

## Known Uncertainties
- Some 3D globe interaction paradigms remain harder to make fully screen-reader-native.
- Domain-specific terminology simplification needs iterative testing with real users.
- Offline behavior UX may differ by platform/browser storage constraints.

## References
- WCAG 2.1: https://www.w3.org/TR/WCAG21/
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- Okabe-Ito palette reference: https://jfly.uni-koeln.de/color/
- Viridis design notes: https://bids.github.io/colormap/
- `docs/prompts/GIS_FLEET_PLAN_PROMPT_V3.md` (Pillar 4 requirements)
