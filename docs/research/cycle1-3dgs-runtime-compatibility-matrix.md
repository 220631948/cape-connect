# Cycle 1: 3DGS Runtime Compatibility Matrix (Cesium + MapLibre)

## 1) Test matrix dimensions

This matrix defines docs-only readiness expectations for 3DGS workflows in the planned hybrid architecture (`2d | 3d | hybrid`) and associated fallback tiers (`LIVE | CACHED | MOCK`). (docs/architecture/tasks/task-M5-hybrid-view.md:3,44,296-301; CLAUDE.md:62-67)

### Dimension A — View/runtime mode
- **2D runtime (MapLibre only):** Baseline mode for constrained/mobile clients and guaranteed fallback path. (docs/architecture/tasks/task-M5-hybrid-view.md:148-151,322-324; docs/architecture/ADR-002-mapping-engine.md:28-29)
- **3D runtime (Cesium + 3D tiles/3DGS):** Preferred immersive path when 3D dependencies are available and healthy. (docs/architecture/tasks/task-M5-hybrid-view.md:16-17,237-239; docs/integrations/cesium-platform.md:45-55)
- **Hybrid runtime (Cesium base + MapLibre overlays):** Synchronized 2D/3D stack with transparent MapLibre overlay. (docs/architecture/tasks/task-M5-hybrid-view.md:67-73,82-85,284-290)

### Dimension B — Data tier state
- **LIVE:** Primary APIs/assets available (e.g., Google 3D tiles or live feeds). (docs/architecture/tasks/task-M5-hybrid-view.md:298-299; docs/architecture/ADR-009-three-tier-fallback.md:100-103)
- **CACHED:** Served from cache/self-hosted path when LIVE unavailable. (docs/architecture/tasks/task-M5-hybrid-view.md:299; docs/integrations/cesium-platform.md:94-97)
- **MOCK:** Last-resort no-blank-screen mode; must still render meaningful UI. (CLAUDE.md:65-67; docs/architecture/ADR-009-three-tier-fallback.md:34-35,105-107)

### Dimension C — Browser/device class
- **Chromium-class test baseline:** Chrome DevTools throttling is the documented verification harness (`Fast 3G`, `6x CPU`). (docs/PERFORMANCE_BUDGET.md:41-43)
- **iOS Safari class:** Requires custom PWA install guidance (no `beforeinstallprompt`), affecting install/offline UX parity. (docs/ux/mobile-patterns.md:99-103)
- **Low-end / older hardware class:** Explicitly expected to demote via LOD chain or 2D fallback when GPU/WebGL2 constraints appear. (docs/integrations/nerf-3dgs-integration.md:24-25,101-102,133-134)

### Dimension D — Capability gates
- **3D tile key gate:** Missing 3D key => skip Cesium path and run 2D. (docs/architecture/tasks/task-M5-hybrid-view.md:202-207,305-307,403-404)
- **3DGS capability gate:** Cesium 1.139+ is the documented minimum tested floor for Gaussian splat stability assumptions. (docs/integrations/cesium-platform.md:46-49)
- **Mobile safety gate:** mobile detection can force 2D-only mode. (docs/architecture/tasks/task-M5-hybrid-view.md:33,363-364,395)

---

## 2) Pass/fail KPIs

A runtime/browse-device combination is considered **PASS** only if all mandatory KPIs below are met.

### Core platform KPIs
- **Time to Interactive (TTI):** `< 5s` (PASS) / `>= 5s` (FAIL). (docs/PERFORMANCE_BUDGET.md:17)
- **Initial map load:** `< 3s` (PASS) / `>= 3s` (FAIL). (docs/PERFORMANCE_BUDGET.md:18)
- **Vector tile load (z15):** `< 500ms` (PASS) / `>= 500ms` (FAIL). (docs/PERFORMANCE_BUDGET.md:19)
- **Initial payload:** `< 2MB` (PASS) / `>= 2MB` (FAIL). (docs/PERFORMANCE_BUDGET.md:20)

### Runtime responsiveness KPIs
- **60 FPS target budget:** sustained frame-time budget `~16.67ms/frame` (PASS target). (docs/architecture/3d-scene-composition.md:41-43)
- **Lite-mode trigger threshold:** if frame rate drops `< 20 FPS`, runtime should simplify/demote; failure to demote is FAIL. (docs/PERFORMANCE_BUDGET.md:29-33)
- **Camera sync SLA in hybrid mode:** Cesium->MapLibre sync within ~1 frame (`16ms` tolerance) and MapLibre->Cesium instant (`duration: 0`). (docs/architecture/tasks/task-M5-hybrid-view.md:388-390)

### Fallback integrity KPIs
- **No blank map/error-only state:** mandatory PASS condition. (CLAUDE.md:66-67; docs/architecture/ADR-009-three-tier-fallback.md:17,115)
- **Tier badge visibility:** `[SOURCE · YEAR · LIVE|CACHED|MOCK]` must be always visible. (CLAUDE.md:61-63; docs/architecture/ADR-009-three-tier-fallback.md:81-84)

---

## 3) Known incompatibilities

1. **Cross-runtime splat parity is not yet validated across all browsers/devices.**
   - Explicitly listed as unresolved benchmark gap. (docs/integrations/nerf-3dgs-integration.md:151-153)
2. **Low-end GPU/WebGL2 environments may not sustain 3DGS path.**
   - Documented fallback expectation exists because old hardware may fail splat rendering. (docs/integrations/nerf-3dgs-integration.md:24-25,101-102,133-134)
3. **Cesium payload cost is heavy for mobile bandwidth class (3–5 Mbps baseline context).**
   - Cesium bundle risk identified at ~30–50 MB and marked critical for SA network realities. (docs/architecture/tasks/task-M5-hybrid-view.md:359,379; docs/architecture/ADR-007-offline-first.md:11-14)
4. **`KHR_gaussian_splatting` is RC, not final ratified standard.**
   - Standards maturity remains conditional, so compatibility posture is conservative. (docs/integrations/cesium-platform.md:48; docs/architecture/tasks/task-M8-4DGS-temporal-scrubbing.md:10,247)
5. **iOS Safari install-flow parity differs from other browsers.**
   - PWA install UX is custom/manual on iOS Safari. (docs/ux/mobile-patterns.md:99-103)

---

## 4) Fallback behavior expectations

Expected behavior by failure condition:

- **3D init failures (missing key, timeout, runtime error):** runtime must degrade to MapLibre 2D and continue operating. (docs/architecture/tasks/task-M5-hybrid-view.md:303-324,402-404)
- **Ion/remote asset failures:** degrade to cached/self-hosted assets, then MOCK/2D pathways as needed. (docs/integrations/cesium-platform.md:94-97,104-107; docs/architecture/ADR-009-three-tier-fallback.md:100-106)
- **Performance pressure (frame-time, memory, mobile constraints):** execute LOD cascade `3DGS -> point cloud -> mesh -> 2D`. (docs/architecture/3d-scene-composition.md:60-66; docs/architecture/tasks/task-M8-4DGS-temporal-scrubbing.md:275)
- **Connectivity degradation:** force cached behavior and maintain visible tier/status indicators. (docs/PERFORMANCE_BUDGET.md:33; docs/ux/mobile-patterns.md:33-37,45-47)
- **Global rule:** never blank screen; always show a meaningful rendered state + badge provenance. (CLAUDE.md:62-67; docs/architecture/ADR-009-three-tier-fallback.md:21-24,81-84)

---

## 5) Measurement and reporting protocol

### Test procedure (docs-only baseline)
1. **Mode coverage:** execute checks for `2d`, `3d`, and `hybrid` view modes where applicable. (docs/architecture/tasks/task-M5-hybrid-view.md:44,181-183,385)
2. **Network/CPU harness:** run with Chrome DevTools `Fast 3G` + `6x CPU slowdown`. (docs/PERFORMANCE_BUDGET.md:41-43)
3. **KPI capture:** record TTI, map load, tile latency, payload, FPS/frame-time, and fallback tier transitions. (docs/PERFORMANCE_BUDGET.md:15-20,29-33; docs/architecture/3d-scene-composition.md:41-43)
4. **Fallback drills:** intentionally simulate key-missing/API-timeout/offline conditions and verify LIVE->CACHED->MOCK transitions + no blank map. (docs/architecture/tasks/task-M5-hybrid-view.md:305-307,313-324; docs/architecture/ADR-009-three-tier-fallback.md:100-107)
5. **Badge verification:** verify always-visible badge state and correctness of tier label. (CLAUDE.md:61-63; docs/architecture/ADR-009-three-tier-fallback.md:81-84)

### Reporting template
For each browser/device/runtime row, report:
- Environment (browser/version, OS/device class, runtime mode)
- KPI results (numeric)
- Pass/Fail outcome by threshold
- Observed fallback chain (if invoked)
- Badge state transitions
- Notes on incompatibility/assumption exposure (if any)

### Readiness status (Cycle 1)
- **Status:** **Docs-only ready**, implementation/runtime evidence pending.
- **Reason:** repository documents define thresholds, fallback policy, and acceptance criteria, but also explicitly mark cross-runtime parity and some 3DGS behavior as unverified. (docs/integrations/nerf-3dgs-integration.md:151-153; docs/integrations/cesium-platform.md:125-129)

---

## 6) References

- `CLAUDE.md`
- `docs/PERFORMANCE_BUDGET.md`
- `docs/architecture/ADR-002-mapping-engine.md`
- `docs/architecture/ADR-007-offline-first.md`
- `docs/architecture/ADR-009-three-tier-fallback.md`
- `docs/architecture/3d-scene-composition.md`
- `docs/architecture/tasks/task-M5-hybrid-view.md`
- `docs/architecture/tasks/task-M8-4DGS-temporal-scrubbing.md`
- `docs/integrations/cesium-platform.md`
- `docs/integrations/nerf-3dgs-integration.md`
- `docs/ux/mobile-patterns.md`
