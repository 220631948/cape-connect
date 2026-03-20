# Phase J — Integration with PWA GIS Product Workflow

> **Status:** Stubbed

## Purpose

Map experiment outputs to capegis product features and automate packaging for PWA deployment.

## Integration Points

| Research Output | Product Feature | Target Milestone |
|----------------|----------------|-----------------|
| Building segmentation models | Automated building layers | M4 (Layer Management) |
| Optimized PMTiles configs | Offline tile bundles | M6 (PWA + Offline) |
| NL-to-spatial-query models | Natural language search | M8 (Search) |
| 3DGS reconstructions | Immersive 3D views | M11+ (3D Visualization) |
| ML inference models | On-device prediction | M10+ (Advanced Features) |

## Packaging for PWA

1. **TensorFlow.js** — convert PyTorch models to TF.js for browser inference
2. **ONNX Runtime Web** — ONNX models with WebAssembly backend
3. **WebAssembly** — compiled spatial algorithms for offline use
4. **PMTiles** — pre-generated tile bundles for Serwist caching

## CI Pipeline (Future)

```
experiment complete
  → artifact published
    → model conversion (ONNX/TF.js)
      → integration tests on device profiles
        → PR to capegis main branch
```

## Future Work

- [ ] Model conversion scripts (PyTorch → ONNX → TF.js)
- [ ] Device profile test matrix (mobile, tablet, desktop)
- [ ] CI workflow for automated model integration
- [ ] Size budget enforcement for PWA artifacts
