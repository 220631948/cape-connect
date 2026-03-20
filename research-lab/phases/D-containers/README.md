# Phase D — Reproducible Compute & Containers

> **Status:** COMPLETE — see `../../containers/` for Dockerfile.base, Dockerfile.gpu, requirements-research.txt, requirements-gpu.txt

## Purpose

Build container images and reproducible environments for every experiment.

## Expected Inputs

- Experiment manifest (from registry)
- Requirements files (Python, system deps)
- Training code and data loaders

## Expected Outputs

- Docker/Podman images tagged with experiment ID
- Environment hash stored in experiment manifest
- Exact launch commands documented

## Current Assets

- `containers/Dockerfile.research` — base geospatial ML image
- `containers/requirements-research.txt` — pinned Python dependencies

## Future Work

- [ ] GPU-enabled Dockerfile variant (CUDA base image)
- [ ] Multi-stage builds for smaller inference images
- [ ] CI pipeline to build and push images on experiment creation
- [ ] Podman support for rootless containers
- [ ] Environment hash generation script
