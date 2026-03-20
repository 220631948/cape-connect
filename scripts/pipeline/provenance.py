#!/usr/bin/env python3
"""Lightweight provenance logger
Writes a JSON provenance record to a specified output path.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime


def get_git_commit_sha():
    try:
        sha = subprocess.check_output(["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL).decode().strip()
        return sha
    except Exception:
        return None


def sha256_file(path):
    if not path or not os.path.exists(path):
        return None
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def extract_manifest_versions(manifest_path):
    if not manifest_path or not os.path.exists(manifest_path):
        return None
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return None
    versions = {}
    if isinstance(data, dict):
        # common shape: {"datasets": [{"name":..., "version":...}, ...]}
        if "datasets" in data and isinstance(data["datasets"], list):
            for d in data["datasets"]:
                name = d.get("name") or d.get("id") or "<unnamed>"
                ver = d.get("version") or d.get("manifest_version")
                versions[name] = ver
            return versions
        # or: {"dataset_name": {"version": ...}, ...}
        for k, v in data.items():
            if isinstance(v, dict) and ("version" in v or "manifest_version" in v):
                versions[k] = v.get("version") or v.get("manifest_version")
        if versions:
            return versions
        # fallback: top-level version
        if "version" in data:
            return {"manifest": data.get("version")}
        return {"manifest": None}
    elif isinstance(data, list):
        for item in data:
            if not isinstance(item, dict):
                continue
            name = item.get("name") or item.get("id") or "<unnamed>"
            ver = item.get("version") or item.get("manifest_version")
            versions[name] = ver
        return versions
    return None


def main():
    p = argparse.ArgumentParser(description="Write provenance JSON record.")
    p.add_argument("--output", required=True, help="Output JSON file path")
    p.add_argument("--dataset-manifest", help="Path to dataset manifests JSON")
    p.add_argument("--experiment-id", help="Experiment identifier")
    p.add_argument("--hyperparams", help="Hyperparameters as JSON string or path to JSON file")
    p.add_argument("--model-artifact", help="Path to model artifact to checksum")
    p.add_argument("--container-image", help="Container image tag (optional)")
    args = p.parse_args()

    record = {}
    record["created_at"] = datetime.utcnow().isoformat() + "Z"
    record["git_commit_sha"] = get_git_commit_sha()
    record["container_image_tag"] = args.container_image or os.environ.get("CONTAINER_IMAGE_TAG") or os.environ.get("IMAGE_TAG") or None

    record["dataset_manifest_versions"] = extract_manifest_versions(args.dataset_manifest) if args.dataset_manifest else None
    record["experiment_id"] = args.experiment_id or os.environ.get("EXPERIMENT_ID")

    # hyperparameters: try parse as JSON string or as file
    hyper = None
    if args.hyperparams:
        try:
            if os.path.exists(args.hyperparams):
                with open(args.hyperparams, "r", encoding="utf-8") as hf:
                    hyper = json.load(hf)
            else:
                hyper = json.loads(args.hyperparams)
        except Exception:
            hyper = None
    record["hyperparameters"] = hyper

    record["model_artifact_checksum"] = sha256_file(args.model_artifact) if args.model_artifact else None

    outdir = os.path.dirname(os.path.abspath(args.output))
    if outdir and not os.path.exists(outdir):
        try:
            os.makedirs(outdir, exist_ok=True)
        except Exception:
            pass
    try:
        with open(args.output, "w", encoding="utf-8") as of:
            json.dump(record, of, indent=2, sort_keys=True)
    except Exception as e:
        print("ERROR: failed to write output:", e, file=sys.stderr)
        sys.exit(2)
    print(args.output)


if __name__ == "__main__":
    main()
