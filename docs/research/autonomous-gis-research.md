# Autonomous GIS Research (Normalized)

> **TL;DR:** Autonomous GIS copilots are maturing from NL-to-SQL to multi-step, tool-constrained agents with CRS-aware reasoning. Production maturity is still prototype-level. Our approach: guided-assistance model with strict tool boundaries, provenance tracking, and human review checkpoints.
>
> **Roadmap Relevance:** M10+ (Phase 3 NL→Spatial) — informs the GIS Copilot agent architecture. Requires pgvector + LiteLLM proxy (Phase 2 prerequisites).

## Scope
Synthesis of repository material on autonomous or semi-autonomous GIS copilots/agents.

## Findings (evidence-tagged)
- **[Verified-Repo]** Repo research tracks an evolution from NL-to-SQL generation to tool-constrained, multi-step GIS agents (`nl-to-spatial-query.md`, `spatialintelligence-deep-dive-2026-03-05.md`).
- **[Verified-Repo]** Academic references for GIS Copilot / autonomous GIS frameworks are cataloged in project docs and verification notes (`verification_report.md`, `GIS_MASTER_CONTEXT.md` references).
- **[Verified-Repo]** Local architecture preference emphasizes tool registries, constrained execution, and CRS-aware reasoning to reduce hallucinations (`nl-to-spatial-query.md`).
- **[Verified-Repo]** Project governance requires human-auditable outputs and staged rollout rather than unrestricted autonomy (`CLAUDE.md`, `GIS_MASTER_CONTEXT.md`).

## Skeptical Notes
- **[Unverified]** “Autonomous” systems in cited research are mostly prototype/research maturity, not broadly proven production SaaS patterns.
  - **Verification needed:** independent production case studies with reliability and safety metrics.
- **[Unverified]** Plugin/version maturity claims can drift across websites, plugin registries, and papers.
  - **Verification needed:** date-stamped cross-check against plugin registry + repository tags + publication metadata.

## Practical Implication for This Repo
Use autonomous GIS as a guided-assistance model with strict tool boundaries, provenance, and human review checkpoints.

## References
- `docs/research/nl-to-spatial-query.md`
- `docs/research/spatialintelligence-deep-dive-2026-03-05.md`
- `docs/research/verification_report.md`
- `docs/context/GIS_MASTER_CONTEXT.md`
- `CLAUDE.md`
