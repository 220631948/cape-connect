# Experiment Reproducibility README — Template
## CapeTown GIS Research Lab

> Copy this file to `experiments/EXP-NNN/REPRODUCIBILITY.md` for each experiment.
> Replace all `{{ placeholder }}` values with actual values after a successful run.

---

## Experiment: {{ EXP-ID }} — {{ Experiment Name }}

| Field | Value |
|-------|-------|
| Run date | {{ YYYY-MM-DD }} |
| Run ID | {{ run-YYYY-MM-DD-HH }} |
| Git commit | `{{ git_sha }}` |
| Container image | `{{ capegis-research:tag }}` |
| Container digest | `sha256:{{ digest }}` |
| Python version | `{{ python_version }}` |
| Dataset versions | See §2 |
| Seed | 42 |

---

## 1. Prerequisites

```bash
# Docker (recommended) — fully reproducible
docker pull capegis-research:{{ tag }}
# OR build from source:
docker build -t capegis-research:local -f containers/Dockerfile.{{ base|gpu }} .
```

```bash
# Conda alternative
conda env create -f containers/environment.yml
conda activate capegis-research
```

---

## 2. Dataset Checksums

| Dataset | Version | SHA-256 | Download URL |
|---------|---------|---------|-------------|
| {{ ds-001 }} | {{ version }} | `{{ sha256 }}` | {{ url }} |

---

## 3. Exact Reproduction Commands

```bash
# Clone repository at the experiment's commit
git clone https://github.com/your-org/capegis.git
git checkout {{ git_sha }}

# Run experiment inside container
docker run --rm \
  -v $(pwd)/research-lab:/workspace \
  -v /path/to/datasets:/data \
  capegis-research:{{ tag }} \
  experiments/EXP-{{ NNN }}/run.py \
  --config experiments/EXP-{{ NNN }}/manifest.yaml \
  --output /workspace/artifacts/EXP-{{ NNN }}/
```

---

## 4. Expected Outputs

| Artifact | Path | SHA-256 |
|---------|------|---------|
| Metrics | `results/metrics_summary.json` | `{{ sha256 }}` |
| Predictions | `results/{{ output_file }}` | `{{ sha256 }}` |
| Notebook | `notebooks/EXP-{{ NNN }}-analysis.ipynb` | `{{ sha256 }}` |

### Expected primary metric: `{{ metric_name }}` = `{{ value }}` ± `{{ ci }}`

---

## 5. Deviations from Manifest

> If the actual run deviated from the manifest, document here:

{{ None — run matched manifest exactly }}

---

## 6. Contact

Research Lab agent or project maintainer. See `AGENTS.md` for fleet contacts.
