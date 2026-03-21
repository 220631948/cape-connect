---
name: check-popia-compliance
description: |
  Audit for South African POPIA (Protection of Personal Information Act) compliance in geospatial data and APIs.
  Ensures spatial data linked with PII is properly sanitized.
---

# POPIA Compliance Audit Skill

## Capability
Scans schemas, data ingestion scripts, and file diffs for potential POPIA privacy violations, leveraging a Knowledge Base of regulations.

## Triggers
- "Check POPIA compliance"
- "Is this data POPIA compliant?"
- "Audit [file/migration] for PII"

## Instructions
1. Scan target files for sensitive keywords: `owner`, `identity_number`, `phone`, `email`, `physical_address`, `erf_number`.
2. Use `mcp__notebooklm__ask_question` to query current POPIA constraints related to the identified fields and their geographical linkage.
3. Assess if PII is properly masked, redacted, or if there is a legitimate processing basis documented.
4. Flag any instances where raw PII is being written to logs or sent to external 3rd-party APIs.

## Tools / Commands
- `mcp__notebooklm-connector`: To query the POPIA knowledge base.
- `grep_search`: To find sensitive keywords in the codebase.

## Example
User: "Check if the new valuation migration is POPIA compliant."
Action: Scan the migration for owner names/IDs, query NotebookLM for POPIA rules on cadastral owner data, and recommend RLS or masking if needed.
