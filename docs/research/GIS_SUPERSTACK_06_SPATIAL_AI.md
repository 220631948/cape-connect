/**
 * POPIA ANNOTATION
 * Personal data handled: None directly in this research doc. References to imagery that may contain personal data: high-resolution aerial imagery, street-level imagery.
 * Purpose: Research and architectural guidance for Spatial AI components in CapeTown GIS Hub.
 * Lawful basis: legitimate interests (research & system design) — any production use must obtain lawful basis and minimise PII processing.
 * Retention: This document does not store personal data. Any derived datasets containing PII must follow tenant policies and be removed after project approval.
 * Subject rights: access ✓ | correction ✓ | deletion ✓ | objection ✓
 */

# GIS_SUPERSTACK_06_SPATIAL_AI — Spatial AI research

This document surveys Spatial AI approaches relevant to the CapeTown GIS Hub (capegis). It covers segmentation, object detection, change detection, geospatial LLMs, retrieval-augmented grounding (RAG) for geospatial data, model choices, inference pipelines, tooling, and data-privacy considerations (POPIA). It is written to align with CLAUDE.md constraints; any conflict is flagged with "> ⚠️ PLAN_DEVIATION required".

---

### Executive summary [Tool v1.0] – https://example.org/spatial-ai-summary

Tooling highlighted: Raster processing, model training (PyTorch/TensorFlow), EO toolkits (EO-Learn, Orfeo), model orchestration (Docker, Kubernetes), and RAG for geospatial QA.

CLI example (inference entrypoint):

python inference.py --model weights.pt --tiles /data/tiles --out /tmp/predictions.geojson

Rollback note: If model introduces regressions in map overlays, revert to previous model weights and route traffic to cached/canned outputs (Supabase api_cache / public/mock/*.geojson).

---

### 1. Semantic segmentation (landcover / landuse) [Tool v0.8] – https://github.com/azavea/raster-vision

- Use cases: classifying impervious surfaces, vegetative cover, building footprints at city scale.
- Typical models: U-Net, DeepLabv3+, HRNet.

Example inference command (RasterVision style):

rastervision run predict --config config_segmentation.yaml --output /tmp/seg_out

Rollback note: Maintain a canonical baseline segmentation run stored in object storage; roll back by swapping the tile source URL to a cached vector layer (api_cache -> MOCK) and re-deploying prior pipeline.

---

### 2. Object detection (cars, roofs, trees) [Tool v2.0] – https://github.com/tensorflow/models/tree/master/research/object_detection

- Use cases: counting vehicles, rooftop solar detection, tree canopy extraction.
- Typical models: Faster R-CNN, RetinaNet, YOLOv5/YOLOv8 (note: licensing for YOLO variants must be reviewed).

CLI example (PyTorch/YOLOv5 inference):

python detect.py --weights yolov5s.pt --source /data/ortho_tiles --save-txt --project /tmp/detections

Rollback note: Keep pre-computed detection layers in Supabase `api_cache`; on model failure fall back to last-stable detection layer and publish as LIVE=CACHED in the UI badge.

---

### 3. Change detection (time-series differencing) [Tool v1.2] – https://github.com/airbusgeo/remote-sensing-change-detection

- Use cases: construction detection, flood extent change, deforestation/vegetation loss.
- Methods: image differencing, Siamese networks, temporal CNNs, transformer-based time-series models.

Example pipeline call (simple CLI):

python change_detect.py --before /data/2024-01-01.tif --after /data/2025-01-01.tif --out /tmp/change.geojson

Rollback note: If recent change masks are noisy, revert to last validated time-slice and mark UI as showing CACHED data until new results pass QA.

---

### 4. Supervised vs self-supervised pretraining [Tool v1.0] – https://arxiv.org/abs/1911.06377

- Pretraining: Large-scale self-supervised on Sentinel/Landsat archives reduces labelled-data needs. Fine-tune on local high-resolution datasets.

Model call example (PyTorch Lightning fine-tune):

python train.py --pretrained selfsup.ckpt --train-samples annotations.geojson --epochs 50

Rollback note: Keep checkpoints and an immutable tag for the production model. In case of degraded performance, re-deploy previous checkpoint and re-run QA.

---

### 5. Geospatial LLMs and natural language queries [Tool v0.3] – https://example.org/geospatial-llm

- Use cases: natural-language spatial queries ("show me areas within 500m of schools with high flood risk"). Combine LLM reasoning with deterministic geospatial queries (PostGIS).
- Pattern: LLM -> translate to parameterised SQL/GeoJSON filters -> PostGIS execution -> LLM formats answer + RAG grounding.

Example interaction (pseudo-code):

POST /api/llm-query { "prompt": "areas within 500m of schools with flood risk > 0.7" }

Rollback note: LLM outputs must always be validated by deterministic checks; on unexpected outputs fall back to parameterised, human-reviewed queries (no LLM) and flag deviations in audit_log.

---

### 6. Retrieval-Augmented Generation (RAG) with geospatial grounding [Tool v1.0] – https://example.org/geospatial-rag

- Approach: index vector embeddings of spatial documents (layer metadata, feature attributes, past analyses) and associate them with geometries (bounding boxes / centroids). When answering, retrieve nearest spatial + semantic chunks and run LLM over the retrieved context.

CLI snippet (indexing):

python rag_index.py --input docs/ --geo-index geo_index.parquet --emb-model sentence-transformers/all-MiniLM

Rollback note: Ensure RAG indexes are versioned and that a fallback non-RAG QA endpoint exists for sensitive tenants.

---

### 7. Edge inference and offline pipelines [Tool v0.9] – https://www.rust-lang.org/ (example: ONNX runtime)

- For PWA/offline use: run lightweight models in WebAssembly or ONNX on-device; heavy inference runs server-side and keeps cached outputs for offline clients.

Example ONNX runtime call (node):

node run_inference.js --model model.onnx --input tile.bin

Rollback note: If on-device models misbehave, disable client inference and fetch precomputed layers from Supabase Storage (PMTiles or GeoJSON) and serve MOCK data.

---

### 8. Tooling: EO-Learn, Orfeo Toolbox, Rasterio, GDAL [Tool v1.5] – https://www.eolearn.io

- Purpose: preprocessing, tiling, cloud masking, band math, reprojection (observe CLAUDE.md CRS rules).

CLI example (gdal_translate):

gdal_translate -of GTiff input.jp2 out.tif

Rollback note: Keep preprocessed tiles in versioned object storage. If preprocessing pipeline changes break downstream models, revert to last-trailed preprocessing manifest and re-run only the model.

---

### 9. Tooling: RasterVision and TorchGeo [Tool v0.7] – https://github.com/microsoft/torchgeo

- RasterVision: high-level orchestration for training/inference across tiled imagery. TorchGeo: datasets + models for remote sensing.

Example training invocation:

rv train -c config_rastervision_segmentation.yml

Rollback note: Always publish the UI badge as [SOURCE · YEAR · CACHED] while moving models between train runs until the new model passes acceptance tests.

---

### 10. Data augmentation and synthetic data [Tool v0.4] – https://imgaug.readthedocs.io

- Techniques: spectral shift, rotation/flip, cutmix, adversarial augmentation, multi-temporal stacking.

CLI snippet (augmentation run):

python augment.py --input tiles/ --out augmented/ --methods flip,noise,spectral_shift

Rollback note: Validate augmentation does not introduce geographic artefacts (e.g., label misalignment). If it does, disable augmentation and re-train with conservative transforms.

---

### 11. Privacy-first practices, POPIA alignment, and PII removal [Tool v1.0] – https://www.justice.gov.za

- High-resolution imagery can contain PII (faces, car license plates). Strategies:
  - Tile-level anonymisation (blurring) before storage
  - Limit access to tenant-admins and PLATFORM_ADMIN roles only
  - Apply RLS on any table containing sensitive features (see CLAUDE.md Rule 4)

CLI snippet (blur faces using OpenCV):

python blur_faces.py --input streetview/ --out streetview_blurred/

Rollback note: If anonymisation reduces utility, document trade-offs and seek human approval before reprocessing with less aggressive filters. > ⚠️ PLAN_DEVIATION required

---

### 12. Model deployment and orchestration (Kubernetes, Docker, Martin for tiles) [Tool v1.1] – https://kubernetes.io

- Models run in dedicated inference services behind API gateways. Use Martin only for tiles (as per CLAUDE.md). Keep model state outside of the tile server.

Example docker run (inference service):

docker run --rm -v /data/models:/models -p 8501:8501 my-spatial-model:latest

Rollback note: Use rolling deployments and feature flags. If new deployment misbehaves, rollback to previous image tag and route traffic to cached outputs.

---

### 13. QA, acceptance tests, and monitoring [Tool v0.6] – https://sentry.io

- Evaluate precision/recall on holdout sets per-tenant. Monitor model drift via periodic re-evaluation.

Example test command:

python evaluate.py --pred /tmp/predictions.geojson --truth /data/ground_truth.geojson

Rollback note: If QA fails, block promotion to production branch and publish failing metrics in docs/CHANGELOG_AUTO.md.

---

### 14. Integration with capegis architecture (RLS, Three-tier fallback) [Tool v1.0] – https://example.org/capegis-integration

- Always show Data Source Badge: [SOURCE · YEAR · LIVE|CACHED|MOCK].
- Three-tier fallback: LIVE -> CACHED (Supabase api_cache) -> MOCK (public/mock/*.geojson) — segmentation and detection layers must follow this.

Example enforcement (server-side pseudo-code):

if live_available(tile): serve(live) elif cached(tile): serve(cached) else: serve(mock)

Rollback note: If live model produces unexpected PII, switch to CACHED and notify tenant admin. > ⚠️ PLAN_DEVIATION required

---

### Appendix: Model choices and licensing notes [Tool v1.0] – https://choosealicense.com

- Prefer permissively licensed models and vet model hubs for licensing (avoid GPL-incompatible stacks unless approved).
- Proprietary APIs (e.g., commercial satellite analytics) require contract review and may conflict with non-commercial data constraints.

CLI snippet (list models on hub):

huggingface-cli repo ls my-org

Rollback note: If a chosen model has licensing problems, remove it from the pipeline, re-run acceptance tests, and publish a PLAN_DEVIATION entry in docs/PLAN_DEVIATIONS.md.

---

References and further reading
- EO-Learn, RasterVision, TorchGeo, GDAL, Orfeo Toolbox, Sentinel Hub, Hugging Face model hub.



> Notes on CLAUDE.md conflicts
- Any use of external commercial tile providers or Mapbox-satellite that requires MAPBOX_TOKEN must be gated (CLAUDE.md lists MAPBOX_TOKEN optional). If a model workflow requires Mapbox or other paid APIs for data ingestion, add PLAN_DEVIATION.
- High-resolution street-level imagery ingestion must follow POPIA rules and RLS policies. > ⚠️ PLAN_DEVIATION required




