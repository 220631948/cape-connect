#!/usr/bin/env python3
"""Simple license compatibility checker for dataset manifests.
Reads a dataset-manifests.json and writes a license report JSON.
"""
import argparse
import json
import os
import sys
from datetime import datetime

# Permitted/compatible licenses (simple allow-list)
PERMITTED = {
    "MIT",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "Apache-2.0",
    "Apache-2.0 WITH LLVM-exception",
    "CC-BY-4.0",
    "CC0-1.0",
    "Public Domain",
}


def normalize_license(s):
    if not s:
        return None
    s = str(s).strip()
    # common variants
    if s.lower().startswith("mit"):
        return "MIT"
    if "apache" in s.lower():
        return "Apache-2.0"
    if "bsd" in s.lower():
        if "3" in s:
            return "BSD-3-Clause"
        return "BSD-2-Clause"
    if "cc0" in s.lower() or "public domain" in s.lower():
        return "CC0-1.0"
    if "cc-by" in s.lower():
        return "CC-BY-4.0"
    return s


def gather_datasets(manifest):
    # Returns list of dicts with keys: name, license
    datasets = []
    if isinstance(manifest, dict):
        # common shapes
        if "datasets" in manifest and isinstance(manifest["datasets"], list):
            for d in manifest["datasets"]:
                if isinstance(d, dict):
                    name = d.get("name") or d.get("id") or d.get("dataset") or "<unnamed>"
                    lic = d.get("license") or d.get("license_spdx") or d.get("license_name")
                    datasets.append({"name": name, "license": lic})
            return datasets
        # or mapping of name -> metadata
        all_keys_are_dicts = all(isinstance(v, dict) for v in manifest.values())
        if all_keys_are_dicts:
            for k, v in manifest.items():
                name = k
                lic = None
                if isinstance(v, dict):
                    lic = v.get("license") or v.get("license_spdx") or v.get("license_name")
                datasets.append({"name": name, "license": lic})
            return datasets
        # fallback single manifest
        name = manifest.get("name") or manifest.get("id") or "manifest"
        lic = manifest.get("license") or manifest.get("license_spdx") or manifest.get("license_name")
        datasets.append({"name": name, "license": lic})
        return datasets
    elif isinstance(manifest, list):
        for item in manifest:
            if not isinstance(item, dict):
                continue
            name = item.get("name") or item.get("id") or "<unnamed>"
            lic = item.get("license") or item.get("license_spdx") or item.get("license_name")
            datasets.append({"name": name, "license": lic})
        return datasets
    return datasets


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--manifest", default="/home/mr/.copilot/session-state/dataset-manifests.json")
    p.add_argument("--output", default="/home/mr/.copilot/session-state/license_report.json")
    args = p.parse_args()

    if not os.path.exists(args.manifest):
        print(f"ERROR: manifest not found: {args.manifest}", file=sys.stderr)
        sys.exit(2)

    try:
        with open(args.manifest, "r", encoding="utf-8") as mf:
            data = json.load(mf)
    except Exception as e:
        print("ERROR: failed to parse manifest:", e, file=sys.stderr)
        sys.exit(2)

    datasets = gather_datasets(data)
    report_items = []
    overall_ok = True

    for ds in datasets:
        raw = ds.get("license")
        norm = normalize_license(raw)
        compatible = norm in PERMITTED if norm else False
        if not compatible:
            overall_ok = False
        reason = "allowed" if compatible else ("unknown or restricted license" if norm else "no license found")
        report_items.append({
            "name": ds.get("name"),
            "raw_license": raw,
            "normalized_license": norm,
            "compatible": compatible,
            "reason": reason,
        })

    report = {
        "created_at": datetime.utcnow().isoformat() + "Z",
        "overall_compatible": overall_ok,
        "datasets": report_items,
    }

    outdir = os.path.dirname(args.output)
    if outdir and not os.path.exists(outdir):
        try:
            os.makedirs(outdir, exist_ok=True)
        except Exception:
            pass

    try:
        with open(args.output, "w", encoding="utf-8") as of:
            json.dump(report, of, indent=2)
    except Exception as e:
        print("ERROR: failed to write report:", e, file=sys.stderr)
        sys.exit(3)

    print(args.output)


if __name__ == "__main__":
    main()
