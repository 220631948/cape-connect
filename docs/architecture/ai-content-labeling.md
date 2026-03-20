# AI Content Labeling — Mandatory Specification

## TL;DR + Legal Rationale
AI-reconstructed outputs can be mistaken for ground truth. Therefore, labeling, watermarking, provenance metadata, and human-review export controls are **non-negotiable safety requirements**, not optional UI settings.

## Verified Facts vs Assumptions

### Verified Facts
- Project constitution mandates non-removable watermark and metadata labels for AI-generated geometry.
- `humanReviewed=false` must block verified evidence export.
- Tenant isolation requires `tenantId` tagging on all assets and metadata.

### [ASSUMPTION — UNVERIFIED]
- Jurisdiction-specific evidentiary standards may require additional declarations beyond this baseline schema.

---

## Mandatory `AIContentMetadata` Schema

```yaml
aiContentMetadata:
  isAiGenerated: true                          # always true
  generationMethod: string                     # 3dgs|nerf|controlnet|hybrid
  generationFramework: string                  # splatfacto|instant-ngp|controlnet++
  sourceImagesCount: integer
  sourceImagesVerified: boolean
  controlnetConditioning: string[]
  reconstructionDate: ISO8601
  eventId: string
  tenantId: string
  confidenceLevel: "low | medium | high"
  psnrScore: number | null
  ssimScore: number | null
  humanReviewed: boolean                       # MUST be true before evidence export
  displayWatermark: true                       # NEVER false — non-removable
  watermarkText: "⚠️ AI-reconstructed — not verified ground truth"
  watermarkPosition: "bottom-left"
  exportAllowed: boolean
  citationRequired: true
  citationTemplate: string
```

---

## Confidence Threshold Table

| Confidence | PSNR Guidance | Suggested SSIM | Source Images | Conditioning Breadth | Human Review Requirement |
|---|---|---|---:|---|---|
| low | < 25 dB | < 0.75 | < 8 | Single/weak | Mandatory before any professional use |
| medium | 25–30 dB | 0.75–0.85 | 8–20 | Multi-conditioning | Mandatory before evidence/legal use |
| high | > 30 dB | > 0.85 | > 20 | Multi + verified | Still required for verified export |

---

## Visual Watermark Specification
- Text: `⚠️ AI-reconstructed — not verified ground truth`
- Position: bottom-left (default), never fully occluded.
- Style: high-contrast semi-opaque background; legible in dark/light themes.
- Policy: watermark rendering is immutable in viewer and export workflows.

---

## Professional Export Gate (Human Review)

### Enforcement Logic
1. If `isAiGenerated=true` and `humanReviewed=false` → set `exportAllowed=false` for verified-evidence profile.
2. Allow exploratory export only with warning banner + citation template.
3. Persist gate decision and reviewer actions in immutable audit log.

### Human Review Checklist
- Source provenance verified (`sourceImagesVerified=true`).
- Reconstruction date consistent with event timeline.
- Hallucination risk assessed against independent references.
- Confidence level accepted with domain-specific rationale.

---

## Citation Template Format

```text
AI-reconstructed scene for Event {eventId} (Tenant {tenantId}), generated via {generationFramework} ({generationMethod}) on {reconstructionDate}. Confidence={confidenceLevel}; PSNR={psnrScore}; SSIM={ssimScore}. Source image count={sourceImagesCount}. Mandatory watermark retained. Not verified ground truth unless explicitly documented by human review record.
```

---

## Per-Tenant Enforcement
- Labels and gate logic execute per tenant; no shared bypass mechanism.
- Export policies are tenant-configurable only toward **stricter** settings, never weaker.
- Cross-tenant asset sharing carries original labeling metadata unchanged.

## Model Provider Policy Routing Matrix (Cycle 1 Delta)

| Provider Path | Policy Signal | Tenant Routing Rule | Audit Requirement |
|---|---|---|---|
| Anthropic commercial/API | Commercial terms indicate customer-content protections for service usage | Allowed for sensitive workloads when tenant policy permits | Log provider/model/tenant/reason code |
| Gemini free-tier | Content-use posture differs from paid services | Block for sensitive/confidential tenant workloads | Log blocked-route decision + fallback |
| Gemini paid-tier | Different data-use posture than free tier | Allow only when tenant policy explicitly enables paid Gemini path | Log contract tier + retention policy tag |
| Any provider (abuse monitoring windows) | Provider-specific retention windows may apply | Route based on tenant data class and allowed retention profile | Persist policy snapshot per request |

- [ASSUMPTION — UNVERIFIED] exact contract language/version pinning for each provider must be validated at procurement/legal checkpoints.

## Evidence Boundary (Authoritative Wording)
- AI output is an analysis aid by default and cannot be represented as factual ground truth without completed human review controls.
- `confidenceLevel`, PSNR, and SSIM inform quality but do not replace provenance verification.
- Tenant policy may tighten export rules; no tenant can weaken baseline controls.

## ⚖️ Compliance Section
- This policy supports responsible use in journalism, legal, insurance, and public-sector contexts.
- It does not replace legal counsel; jurisdictional evidentiary requirements may add constraints.
- Any attempt to remove/disable watermarking is treated as policy violation.

## Ralph Q/A
- **Q:** What if an editor crops out the watermark?
  **A:** Verified-evidence export must embed watermark and metadata in both visual and sidecar records; tamper checks required.
- **Q:** What if confidence is high but inputs are questionable?
  **A:** Provenance failure overrides numerical quality; keep export gate closed.

## Known Unknowns
- Standardized international machine-readable disclosure schema is still evolving.
- Automated hallucination detection recall/precision thresholds need further study.

## References
- `docs/context/GIS_MASTER_CONTEXT.md` (§9, §10, §14)
- `docs/prompts/GIS_FLEET_PLAN_PROMPT_V3.md` (AI content labeling requirements)
