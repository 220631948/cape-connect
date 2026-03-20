# Cycle 1 Policy/Licensing Delta (Google Maps Tiles, Cesium, OpenSky, AI Models)

> **TL;DR:** Technical compliance notes on licensing for Google Maps Tiles, CesiumJS, OpenSky Network, and AI models — not legal advice, engineering input only.


> **Scope:** Technical compliance notes for architecture/operations.
> **Not legal advice.** Treat this as engineering compliance input for legal/product review.
> **Prepared:** 2026-03-05 (UTC)

## 1) Verified policy/licensing updates

### 1.1 Google Maps Tiles (direct + via Cesium)

**Verified from Google Map Tiles API Policies and Google/Cesium terms:**

- **Attribution is mandatory and explicit**: Google logo/"Google Maps" plus required third-party data attributions must remain visible and not obscured.
- **Caching/storage restrictions are strict**: no general prefetch/index/store/cache except limited conditions in terms and HTTP cache headers (`max-age`, `must-revalidate`, `private`, etc.).
- **Non-visualization extraction is prohibited**: no geodata extraction/resale, object detection/identification, or machine interpretation from Map Tiles content.
- **Offline use is prohibited** for restricted content/use cases.
- **Photorealistic 3D tiles root request lifecycle**: one root request supports at least ~3 hours of renderer tile requests before requesting a new root tileset.
- **EEA term split is active**: EEA billing addresses are governed by separate EEA terms/service-specific terms.
- **Cesium passthrough terms for Google content are stricter than generic renderer usage**:
  - no scraping/export/rehosting,
  - no caching unless expressly allowed,
  - no using content to recreate Google-like products,
  - no high-risk activity use,
  - explicit user privacy/location consent duties,
  - availability can be suspended if Cesium↔Google rights change.

### 1.2 Cesium (CesiumJS + Cesium ion)

- **CesiumJS remains Apache 2.0** (commercial/non-commercial use allowed under Apache terms).
- **Cesium ion is contractual SaaS licensing** with plan/usage constraints and updateable ToS.
- **Attribution obligations are explicit** in ion terms (including "Cesium ion" logo visibility requirements).
- **Offline restrictions apply to Cesium Data Output** except defined allowances (e.g., clips), and only limited caching behavior is allowed.
- **Third-party content in ion has separate legal terms** (OpenStreetMap/ODbL, Google Maps terms, Bing terms, etc.) and can be suspended if upstream licenses change.

### 1.3 OpenSky Network

- **Official OpenSky API docs explicitly state research/non-commercial positioning** and direct commercial users to contact OpenSky.
- **Citation/attribution expectation is explicit** in API docs (OpenSky paper + network URL for publications/public outputs).
- **Commercial live-flight use path is contract-dependent** (contact OpenSky for commercial terms/access).

### 1.4 AI model usage relevant to this project (Gemini + Anthropic via LiteLLM/proxy architecture)

- **Anthropic Commercial Terms:** for commercial/API services, Anthropic states customer keeps input rights/owns outputs and that Anthropic **may not train models on customer content from Services**.
- **Gemini API terms/policies split free vs paid behavior**:
  - Free tier: Google may use submitted content/outputs to improve products/models (per terms).
  - Paid services: Google states prompts/outputs are not used to improve products; processed under processor terms.
- **Gemini abuse monitoring policy states retention window**: prompts/context/outputs retained **55 days** for abuse policy enforcement; policy says this logged data is not used to train/fine-tune models.

---

## 2) Constraints likely to impact architecture or ops

### 2.1 Commercialization gates

- **OpenSky is a hard commercialization gate** for paid multi-tenant SaaS unless a commercial license/agreement is secured.
- **Cesium ion sublicensing/commercial embedding has limits**; if platform business model effectively resells ion capability, contract review is required.
- **Gemini free-tier usage is not compatible with confidential production workloads** where training/expert review of content is disallowed; paid tier policy alignment required.

### 2.2 Attribution/UI obligations

- Google and Cesium attributions must be persistent, readable, and non-obscured in all relevant map/3D states.
- For Google data with third-party overlays, UI must clearly disambiguate which content is Google vs non-Google.
- OpenSky attribution/citation must appear in product contexts where data is shown publicly/externally.

### 2.3 Caching, prefetch, offline, and retention controls

- Google tiles: cache behavior must follow strict header-driven controls; long-lived tile warehousing/offline archives are non-compliant unless explicitly allowed.
- Cesium third-party data caching is similarly constrained to HTTP-duration/explicit allowance.
- AI prompt retention policy differences (Gemini free/paid, monitoring windows) require environment-level routing controls so sensitive tenants cannot accidentally use non-compliant model paths.

### 2.4 Tenant isolation and privacy controls

- Contract/legal posture reinforces existing repo requirement: per-tenant request attribution, cache partitioning, and access isolation.
- Google/Cesium location/privacy clauses imply explicit user notice + consent flows for location data handling and no cross-tenant leakage of telemetry/location traces.
- Multi-provider AI routing (LiteLLM/proxy) should be treated as data-boundary infrastructure: per-tenant provider policy enforcement and auditable model-routing logs are required for defensible compliance.

---

## 3) Unverified areas needing legal/product review

1. **OpenSky commercial license scope for this exact business model**
   - We verified non-commercial/research language and contact requirement, but not signed terms specific to this product.
2. **Google Maps Service Specific Terms interpretation for planned caching/offline fallback patterns**
   - Policy pages are clear at high level; final legality of each cache topology (edge/CDN/proxy/mobile offline) needs counsel confirmation against full contractual terms.
3. **Cesium ion sublicensing boundary for multitenant SaaS packaging**
   - ToS references integration/sublicensing limits; exact applicability depends on distribution model and contract tier.
4. **GitHub Copilot retention/training details in enforceable contract terms for this tenant profile**
   - We found references to Trust Center and product-specific terms but did not successfully retrieve definitive retention controls from an authoritative public doc endpoint in this run.
5. **AI provider cross-border/data residency commitments per tenant geography**
   - Requires legal review of DPA/region commitments beyond high-level public pages.

---

## 4) Required updates to compliance sections in docs

Update these docs to align with verified constraints:

1. **`docs/integrations/google-maps-tile-api.md`**
   - Tighten language on cache/prefetch/offline prohibitions.
   - Add explicit attribution rendering requirements (logo + data source attribution + non-obscuring rules).
   - Add EEA terms split note and operational flag by billing entity region.

2. **`docs/integrations/cesium-platform.md`**
   - Clarify CesiumJS (Apache 2.0) vs Cesium ion (contractual SaaS) obligations.
   - Add explicit third-party term inheritance (Google/OSM/etc.) and availability-suspension risk.

3. **`docs/integrations/opensky-network.md`**
   - Upgrade commercial-use statement from warning to deployment gate.
   - Add required attribution/citation block in production checklist.

4. **`docs/specs/06-mobile-offline-architecture.md` and `docs/DATA_LIFECYCLE.md`**
   - Add provider-specific cache legality matrix (Google/Cesium/OpenSky) and prohibited offline scenarios for Google tiles.

5. **`docs/specs/10-popia-compliance.md` and `docs/specs/11-multitenant-architecture.md`**
   - Add explicit vendor-policy mapping for location/privacy and tenant-isolated telemetry retention.

6. **`docs/architecture/ai-content-labeling.md` + AI integration docs (`docs/research/litellm-proxy-research.md` / future AI ops spec)**
   - Add model-provider policy matrix (Anthropic commercial/API, Gemini free vs paid, retention windows, abuse-review handling).
   - Require per-tenant model-routing policy controls + auditability.

---

## 5) Traceability to roadmap actions (policy-critical)

**Priority scale (unambiguous):**
- **P0 = Legal/commercial blocker:** must be resolved before LIVE paid rollout.
- **P1 = Mandatory compliance control:** required before production promotion of affected feature.
- **P2 = Governance hardening:** should be completed in subsequent hardening cycle.

| Policy/licensing finding | Evidence status | Roadmap linkage | Priority | Next verification action |
|---|---|---|---|---|
| OpenSky non-commercial posture for default API path | **Verified** | `ROADMAP.md` Gate B | **P0** | Obtain and document product-specific commercial terms or maintain provider disabled for paid tenants. |
| Google/Cesium attribution + cache/offline limits | **Verified** | `ROADMAP.md` Gate A + offline scope constraints | **P1** | Add provider cache legality matrix and automated attribution visibility checks in QA. |
| EEA term split and regional obligations | **Verified** | Roadmap compliance gating under Foundation/Governance | **P1** | Add billing-entity region flag and region-aware legal review checklist to release gates. |
| Gemini free-vs-paid data handling differences | **Verified** | `ROADMAP.md` Gate E | **P1** | Enforce tenant-level provider/tier routing rules with audit logs and policy tests. |
| Copilot contractual retention specifics for this tenant profile | **Unverified** | Governance backlog (must not be assumed compliant) | **P2** | Retrieve authoritative product terms through approved legal channel and map to tenant policy controls. |
| Cross-border/data-residency commitments per provider | **Unverified** | `ROADMAP.md` Gate E + POPIA controls | **P1** | Complete provider DPA/region mapping and encode allowed-region routing constraints. |

## 6) References

### Primary sources reviewed (this delta)

- Google Map Tiles API Policies: https://developers.google.com/maps/documentation/tile/policies
- Google Photorealistic 3D Tiles doc: https://developers.google.com/maps/documentation/tile/3d-tiles
- Google Maps Platform Terms index: https://developers.google.com/maps/terms
- Cesium ion Terms of Service: https://cesium.com/legal/terms-of-service/
- Cesium Third-Party Terms: https://cesium.com/legal/third-party-terms/
- Cesium Terms for Google content: https://cesium.com/legal/terms-for-google/
- OpenSky API docs (official): https://openskynetwork.github.io/opensky-api/
- OpenSky Terms/FAQ URLs discovered but blocked for direct fetch in this run:
  - https://opensky-network.org/about/terms-of-use
  - https://opensky-network.org/about/faq
- Anthropic Commercial Terms: https://www.anthropic.com/legal/commercial-terms
- Gemini API Additional Terms: https://ai.google.dev/gemini-api/terms
- Gemini API Abuse Monitoring / retention: https://ai.google.dev/gemini-api/docs/usage-policies
- GitHub Copilot responsible use page (includes Trust Center pointer): https://docs.github.com/en/copilot/responsible-use/copilot-code-completion
- GitHub Terms for Additional Products and Features (Copilot terms pointer): https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features

### Existing project context used

- `docs/integrations/google-maps-tile-api.md`
- `docs/integrations/cesium-platform.md`
- `docs/integrations/opensky-network.md`
- `docs/specs/10-popia-compliance.md`
- `docs/specs/11-multitenant-architecture.md`
- `docs/DATA_LIFECYCLE.md`
- `docs/architecture/ai-content-labeling.md`
- `docs/research/litellm-proxy-research.md`
