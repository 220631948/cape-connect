---
name: check-popia-compliance
description: Audit for South African POPIA (Protection of Personal Information Act) compliance in geospatial data and APIs.
version: 1.0.0
---

# POPIA Compliance Check

## Capability
This skill scans spatial datasets and API responses for potential POPIA violations, such as unmasked residential coordinates, cadastral owner details, or other PII linked to locations.

## Triggers
- User asks "Is this dataset POPIA compliant?"
- User asks to "audit privacy" for a new GIS layer.
- Before publishing any new dataset to the public portal.

## Instructions
1.  Identify the target dataset or API endpoint.
2.  Run the POPIA scanner script to detect PII patterns (e.g., owner names, full addresses).
3.  Check spatial resolution: Ensure residential point data is sufficiently aggregated or jittered.
4.  Verify that RLS policies are enabled on all tables containing sensitive attributes.

## Tools / Commands
- `python scripts/scan_popia_violation.py --input <dataset>`: Scans a local file for PII patterns.
- `mcp__postgres__query("SELECT ...")`: Used to audit RLS policies on spatial tables.

## Examples
User: "Audit the new valuation_data layer for POPIA compliance."
Action: `python scripts/scan_popia_violation.py --input valuation_data.gpkg`
