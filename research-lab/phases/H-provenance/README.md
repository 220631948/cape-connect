# Phase H — Provenance, Artifacts & Publication Packaging

> **Status:** COMPLETE — see `../../provenance/REPRODUCIBILITY_TEMPLATE.md` and `../../provenance/provenance-schema.json`

## Purpose

Store versioned artifacts and produce publication-ready reproducibility packages.

## Expected Inputs

- Completed experiment with all artifacts
- Model checkpoints, logs, metrics
- Environment descriptors

## Expected Outputs

- Versioned artifact archive
- Reproducibility README with exact rerun commands
- Publication-ready package (code + data manifest + Dockerfile + results)

## Artifact Types

| Artifact | Storage | Versioning |
|----------|---------|------------|
| Model checkpoints | `experiments/{id}/checkpoints/` | Git LFS or DVC |
| Training logs | `experiments/{id}/logs/` | Git |
| Metrics JSON | `registry/` | Git |
| Container images | Docker registry | Image tag |
| Notebooks | `notebooks/` | Git |

## Future Work

- [ ] Artifact archiver script
- [ ] Reproducibility README template
- [ ] Publication package generator
- [ ] DVC integration for large artifacts
