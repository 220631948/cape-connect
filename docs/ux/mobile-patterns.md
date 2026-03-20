# Mobile UX Patterns — CapeTown GIS Hub

> **TL;DR:** Touch-first map interactions, clear offline indicators, graceful low-bandwidth fallbacks, and a guided PWA install flow. Designed for South African mobile users, including older devices and intermittent connectivity.

## Touch Interaction Patterns for Maps

### Core Gestures
| Gesture | Action | Notes |
|---------|--------|-------|
| Single tap | Select feature / dismiss popup | 44x44px minimum target |
| Double tap | Zoom in (centred on tap point) | 300ms debounce to avoid false trigger |
| Two-finger pinch | Zoom in/out | Smooth, momentum-based |
| One-finger drag | Pan map | Inertial scroll with deceleration |
| Two-finger drag | Tilt / rotate (3D mode) | Only in 3D view, otherwise pans |
| Long press (500ms) | Drop pin / context menu | Haptic feedback if supported |
| Two-finger tap | Zoom out one level | Alternative to pinch-out |
| Three-finger swipe | Undo last action | Recovers accidental changes |

### Touch Target Rules
- Minimum size: `44x44px` for all interactive controls (WCAG 2.5.5).
- Spacing between adjacent touch targets: ≥ `8px`.
- Map feature selection uses a `20px` hit area buffer around point/line features.
- Bottom nav items: `48x48px` with `12px` spacing.

### Gesture Conflict Prevention
- Scroll lock on map container when map is in focus (prevent accidental page scroll).
- Gesture hints appear on first use: "Pinch to zoom, drag to pan."
- Disable browser pull-to-refresh over map region.

## Offline Indicator UX

### Status Bar
- Persistent thin bar (4px) at top of viewport:
  - **Green** (`#4ECDC4`): Online, all feeds LIVE.
  - **Amber** (`#FFB347`): Degraded — some feeds CACHED, connection intermittent.
  - **Red** (`#FF6B6B`): Offline — all data from cache or mock.
- Bar includes text label for screen readers: "Online", "Limited connection", or "Offline".

### Transition Behaviour
- Online → Offline: bar animates to red, toast notification "You're offline. Cached data is available."
- Offline → Online: bar animates to green, toast "Back online. Syncing..." with progress indicator.
- Sync completion: brief toast "All changes synced" (auto-dismiss after 3 seconds).

### Per-Layer Indicators
- Each active layer shows its own status badge: `[LIVE]`, `[CACHED · 12 min ago]`, or `[MOCK]`.
- Staleness threshold: badges turn amber after 5 minutes without refresh.
- Critical layers (emergency mode): staleness warning escalates to pulsing border after 15 minutes.

### Cached Data Management
- Settings screen shows total cache size and per-layer breakdown.
- "Save for offline" button on frequently used layers (downloads PMTiles + last snapshot).
- Auto-eviction: oldest cached data removed when storage exceeds 80% of quota.
- User notification before eviction: "Storage full. Oldest cached data will be removed."

## Low-Bandwidth Fallback UI

### Detection
- Connection quality estimated via `navigator.connection.effectiveType` (where available).
- Fallback: measure response time of lightweight health-check endpoint.

### Adaptive Behaviour
| Connection | Tile Quality | Layer Limit | Animations | Images |
|------------|-------------|-------------|------------|--------|
| 4G / WiFi | Full resolution | All enabled | Full | Full |
| 3G | Reduced (256px tiles) | Max 3 active | Reduced (no transitions) | Compressed |
| 2G / Slow | Minimal (128px tiles) | Max 1 active | Disabled | Placeholders |
| Offline | Cached PMTiles | Cached only | Disabled | Cached only |

### User Override
- "Lite mode" toggle in settings forces low-bandwidth behaviour regardless of connection.
- Useful for users on data-capped plans common in South Africa.
- Lite mode persists across sessions until manually disabled.

### Progressive Loading
- Map tiles load centre-out (visible viewport first, then buffer).
- Layer data loads in priority order: basemap → active overlays → background layers.
- Skeleton placeholders (dark shimmer) shown during tile loading.
- Cancel in-flight requests when user pans away (no wasted bandwidth).

## PWA Install Prompt Flow

### Trigger Conditions
- User has visited ≥ 2 times within 7 days.
- User has interacted with the map (not just landing page bounce).
- User has not dismissed the prompt in the last 30 days.
- Device supports PWA installation (checked via `beforeinstallprompt` event).

### Prompt Design
- Bottom sheet (not modal): does not block map interaction.
- Content: "Add CapeTown GIS to your home screen for offline maps and faster access."
- Two actions: **Install** (primary, `--accent-blue`) and **Not now** (text-only, muted).
- If dismissed 3 times total, prompt is permanently suppressed (respects user choice).

### Post-Install
- Splash screen: dark background with CapeTown GIS logo and loading indicator.
- First offline experience: pre-cache basemap tiles for Cape Town bounding box (~15 MB).
- "Offline ready" confirmation toast after initial cache is complete.

### iOS Safari Handling
- iOS does not support `beforeinstallprompt`; show a custom instruction banner:
  - "Tap the share button, then 'Add to Home Screen' for offline maps."
  - Banner includes animated arrow pointing to Safari share icon.
  - Same 3-dismissal suppression rule applies.

## Bottom Sheet Navigation Pattern

### Structure
- Fixed to bottom of viewport with `border-radius: 16px 16px 0 0` on top corners.
- Three states:
  - **Collapsed** (peek): 60px visible, shows handle bar and summary text.
  - **Half-open**: 50% viewport height, shows primary content.
  - **Full-open**: 90% viewport height, shows all content with scroll.

### Interaction
- Drag handle: `40x4px` rounded bar, centred, `--text-muted` colour.
- Swipe up to expand, swipe down to collapse (velocity-aware snap).
- Tap handle to toggle between collapsed and half-open.
- Content scrolls internally when full-open; sheet does not scroll with page.

### Content Zones (Half-Open)
| Zone | Content |
|------|---------|
| Header (fixed) | Handle bar + title + close button |
| Primary | Feature details, layer info, or search results |
| Actions | Contextual buttons: Export, Share, Add to map |

### Behaviour Rules
- Bottom sheet opens automatically when user selects a map feature.
- If another feature is selected, content transitions without close/reopen animation.
- Sheet closes when user taps map background or swipes fully down.
- Keyboard users: `Escape` closes, `Tab` cycles through content.
- Sheet respects `prefers-reduced-motion`: snaps without animation if enabled.

## Responsive Breakpoints
| Breakpoint | Width | Layout Changes |
|------------|-------|---------------|
| Mobile | < 640px | Bottom sheet nav, stacked panels, map fills viewport |
| Tablet | 640–1024px | Side panel (320px) + map, bottom sheet for details |
| Desktop | > 1024px | Full sidebar + map + optional right panel |

## Acceptance Criteria
- [ ] All touch targets ≥ 44x44px verified on physical device.
- [ ] Offline indicator transitions within 2 seconds of connectivity change.
- [ ] Low-bandwidth mode detected and applied within 5 seconds.
- [ ] PWA install prompt appears only after ≥ 2 visits and map interaction.
- [ ] Bottom sheet snaps to correct state within 200ms of gesture completion.
- [ ] Cache pre-load completes within 60 seconds on 3G connection.
