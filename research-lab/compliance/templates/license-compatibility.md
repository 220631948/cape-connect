# License Compatibility Checker — Configuration

> Defines approved, conditional, and prohibited licenses for research datasets.
> Run this check before using any external dataset in experiments.

## Approved Licenses (free to use)

These licenses are pre-approved for research and product integration:

| SPDX ID | Name | Commercial Use | Attribution | Share-Alike |
|---------|------|---------------|-------------|-------------|
| CC0-1.0 | Creative Commons Zero | ✅ | ❌ | ❌ |
| CC-BY-4.0 | Creative Commons Attribution 4.0 | ✅ | ✅ | ❌ |
| ODbL-1.0 | Open Data Commons Open Database License | ✅ | ✅ | ✅ |
| PDDL-1.0 | Open Data Commons Public Domain Dedication | ✅ | ❌ | ❌ |
| MIT | MIT License | ✅ | ✅ | ❌ |
| Apache-2.0 | Apache License 2.0 | ✅ | ✅ | ❌ |

## Conditional Licenses (require review)

These require human review of specific terms before use:

| SPDX ID | Condition |
|---------|-----------|
| CC-BY-SA-4.0 | Share-alike — derived works must use same license |
| CC-BY-NC-4.0 | Non-commercial only — cannot use in product features |
| GPL-3.0-only | Copyleft — impacts code distribution |
| AGPL-3.0-only | Strong copyleft — impacts server-side usage |

## Prohibited Licenses

These are **not approved** for this project:

| SPDX ID | Reason |
|---------|--------|
| CC-BY-NC-ND-4.0 | No derivatives + no commercial = unusable |
| Proprietary | Requires legal review |
| Unknown | Must identify license before use |

## Dataset-Specific Rules

| Dataset Source | License Status | Notes |
|---------------|---------------|-------|
| CoCT GV Roll 2022 | Approved | Official government open data |
| OpenStreetMap | ODbL-1.0 (Conditional) | Attribution + share-alike required |
| SpaceNet | CC-BY-SA-4.0 (Conditional) | Share-alike for derived works |
| Lightstone | **PROHIBITED** | Per CLAUDE.md Rule 8 |

## Compatibility Check Process

1. Look up dataset license in manifest (`license.spdx_id`)
2. Check against tables above
3. If **Approved** → proceed
4. If **Conditional** → create review ticket, document conditions
5. If **Prohibited** or **Unknown** → STOP, escalate to human
6. Record check result in `compliance/audits/`
