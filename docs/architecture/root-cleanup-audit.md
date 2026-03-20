# Root Cleanup Audit — CapeTown GIS Hub (`capegis`)

> **TL;DR:** Audit of root directory files during repo cleanup, cataloguing every file with keep/remove/move recommendations and rationale.


> **Auditor:** Gemini (Antigravity) — Ralph Wiggum cognitive stance applied (childlike curiosity + rigorous skepticism)
> **Date:** 2026-03-05
> **Scope:** Root directory files ONLY (`./`) — no subdirectory traversal
> **Project:** Spatial AI / GIS Platform (Next.js 15 + MapLibre + Supabase/PostGIS + Martin)

---

## ⚠️ CRITICAL SECURITY FINDING — READ FIRST

> **`gemini-extension.json.bak` IS TRACKED BY GIT AND CONTAINS HARDCODED API KEYS.**
>
> Found real credentials for: **Context7**, **Exa**, and **Vercel**.
> File was committed in: `b13a76c` (HEAD → rebootstrap/cleanup-20260304T103943)
>
> **Action required BEFORE any cleanup:** Rotate all three keys, then purge from git history.
> See Section 5 — DANGER ZONE for remediation steps.

---

## 1. Root File Inventory

*27 files discovered. Directories excluded per audit scope.*

| File | Size | Modified | Apparent Purpose |
|------|------|----------|-----------------|
| `.env` | 639 B | Mar 1 | Active env secrets **(root-owned, not in git ✓)** |
| `.env.example` | 1,132 B | Mar 4 | Env template committed to git ✓ |
| `.env.local` | 339 B | Mar 4 | Local dev overrides **(not in git ✓)** |
| `.gemini-research.json` | 75 B | Mar 4 | Gemini CLI deep-research state cache |
| `.gitignore` | 998 B | Mar 5 | Git ignore rules |
| `10%` | 0 B | Mar 4 10:17 | **Empty ghost file — no purpose** |
| `3σ` | 0 B | Mar 4 10:17 | **Empty ghost file — no purpose** |
| `AGENTS.md.bak` | 2,428 B | Mar 3 | Old AGENTS.md backup **(tracked in git)** |
| `CLAUDE.md` | 7,782 B | Mar 4 | AI agent rules — core governance doc |
| `Dockerfile.experiment` | 594 B | Mar 4 | Python experiment container (Copilot-authored) |
| `PLAN.md` | 4,140 B | Mar 3 | Authoritative milestone plan (M0–M15) |
| `README.md` | 2,175 B | Mar 3 | Project overview |
| `agent-definitions-v2.md` | 63,548 B | Mar 5 | 1,377-line agent definitions doc **— wrong location** |
| `alert.` | 0 B | Mar 4 10:17 | **Empty ghost file — trailing dot, no extension** |
| `baseline` | 0 B | Mar 4 10:17 | **Empty ghost file — no purpose** |
| `build_tag.txt` | 45 B | Mar 4 | Experiment build tag: `capegis-experiment-20260304…` |
| `docker-compose.override.yml` | 64 B | Mar 4 | LocalStack override (3-line YAML) |
| `docker-compose.yml` | 1,341 B | Mar 4 | PostGIS + Martin + LocalStack local dev |
| `entrypoint-experiment.sh` | 115 B | Mar 4 | Experiment Docker entrypoint |
| `gemini-extension.json.bak` | 1,816 B | Mar 4 | **⚠️ BAK file with hardcoded API keys — in git!** |
| `license_checker.py` | 4,613 B | Mar 4 | License compatibility checker for dataset manifests |
| `notify` | 0 B | Mar 4 10:17 | **Empty ghost file — no purpose** |
| `omg-config.json` | 226 B | Mar 5 | Oh My Gemini tool-filter config |
| `package.json` | 1,050 B | Mar 3 | Node deps + scripts (Next.js 15, MapLibre, Supabase…) |
| `provenance.py` | 4,336 B | Mar 4 | Provenance JSON logger (git SHA, checksums, hyperparams) |
| `requirements-experiments.txt` | 87 B | Mar 4 | Python deps for experiment container |
| `train_sample.py` | 186 B | Mar 4 | 8-line trivial training stub |

---

## 2. Classification

### ✅ KEEP — Core Infrastructure

These files belong exactly where they are. The CLAUDE.md file structure spec validates all of them.

| File | Justification |
|------|---------------|
| `CLAUDE.md` | Non-negotiable AI agent rulebook. Every agent reads this first. |
| `PLAN.md` | Single source of truth for milestone sequencing (M0–M15). |
| `README.md` | Project entrypoint. Links to PLAN and key docs. |
| `package.json` | Node.js project manifest. Next.js 15 + MapLibre + Serwist etc. |
| `docker-compose.yml` | PostGIS 17 + Martin + LocalStack Pro. Local dev foundation. |
| `docker-compose.override.yml` | LocalStack service override. Pairs with main compose. |
| `.env.example` | Env template — safe to commit. Correctly documents all vars. |
| `.gitignore` | Good coverage, but **needs additions** (see Section 3). |

> **Note on CLAUDE.md File Structure (§8):** The canonical root structure lists `AGENTS.md` as a required root file. There is currently no `AGENTS.md` — only `AGENTS.md.bak`. The original was backed up and the content merged into `CLAUDE.md`. This is acceptable but worth noting.

---

### 🔍 REVIEW — Ambiguous / Suspicious

Files that need a decision before action. The skeptical brain needs more context.

#### `omg-config.json`

```json
{ "toolFilter": { "enabled": true, "modes": { "researcher": {"allowed":"*"}, "architect": {"allowed":"*"}, "executor": {"allowed":"*"} } } }
```

This is an ["Oh My Gemini" CLI config](https://github.com/crestalnetwork/oh-my-gemini) for the Gemini agent's tool-filter settings. It is legitimately placed in the root for the Gemini CLI to discover, analogous to `.prettierrc` or `.eslintrc`. **However**, it is not referenced in `CLAUDE.md`'s canonical file structure.

**Recommendation:** Keep, but add to `.gitignore` if it contains any env-specific preferences, OR add it to the canonical root file list in `CLAUDE.md`.

---

#### `provenance.py` + `license_checker.py`

Both are well-written, clearly purposeful Python utilities:
- `provenance.py`: Writes a JSON record (git commit SHA, dataset manifest versions, model artifact checksum). Used for reproducibility in ML/data pipelines.
- `license_checker.py`: Reads a `dataset-manifests.json` and reports license compatibility. Has a hardcoded default path: `/home/mr/.copilot/session-state/` — a machine-specific absolute path that will fail on any other developer's machine.

**Skeptical question:** These are ML pipeline utilities. The current `CLAUDE.md` tech stack is a GIS Web PWA — no ML pipeline is defined. Are these leftovers from an experimental phase, or planned infrastructure?

**Recommendation:** Move to a `scripts/` or `tools/pipeline/` directory. Fix the hardcoded local path in `license_checker.py` to use a relative path or env var.

---

#### `.gemini-research.json`

```json
{ "researchIds": [], "fileSearchStores": {}, "uploadOperations": {} }
```

Empty Gemini CLI deep-research state cache. Completely harmless. Auto-generated by the `gemini-deep-research` extension.

**Recommendation:** Add `*.json` local state artifacts to `.gitignore` (specifically `.gemini-research.json`). It is currently untracked but should be explicitly excluded.

---

#### `agent-definitions-v2.md` (63 KB, 1,377 lines!)

*"I found a book in the hallway. It was the size of a dictionary. Someone left it there. It has chapter names like 'OSINT Agent' and 'CesiumJS Layer Strategy.' I read three pages. I think it belongs in a library."* — Ralph Wiggum

This is a massive multi-agent definition document covering orchestrator, tile-agent, cesium-platform, OSINT, auth, data-source, and more. Its purpose is legitimate and its content is detailed. It is tracked in git. But **it categorically does not belong at the root** — it should be in `docs/architecture/` or `docs/planning/`.

**Recommendation:** Move to `docs/planning/agent-definitions-v2.md` (or `docs/architecture/`).

---

### 🗑️ REMOVE — Junk / Temporary

These files have zero purpose and are safe to delete without any risk to build, CI, or orchestration.

#### 5 Empty Ghost Files

All created at the exact same timestamp: `Mar 4 10:17`. Zero bytes. Almost certainly created by an AI agent that accidentally wrote stray tokens as filenames (e.g., a shell command fragment like `notify`, a statistics symbol `3σ`, a percentage `10%`).

```
10%
3σ
alert.
baseline
notify
```

**Verdict:** Delete immediately. No references to these files anywhere in the codebase. No build, CI, test, or config file touches them.

---

#### `AGENTS.md.bak` (2,428 B)

A backup of the old `AGENTS.md`. The current `AGENTS.md` has been consolidated into `CLAUDE.md`. The `.bak` is tracked in git — it will persist in history even after deletion, but it serves no ongoing purpose. Its full content is preserved in git history anyway.

**Verdict:** Delete. The content is in git history and was intentionally superseded.

---

#### `build_tag.txt` (45 B)

```
capegis-experiment-20260304T075033Z-c7044bf3
```

A timestamped tag from a Mar 4 experiment run (the same cluster as `Dockerfile.experiment` etc.). This is runtime artifact output, not a source file. It should be `.gitignore`-d, not committed.

**Verdict:** Delete. Add `build_tag.txt` to `.gitignore`.

---

#### `train_sample.py` (186 B)

```python
#!/usr/bin/env python3
import time
print("Starting sample training job")
for epoch in range(3): ...
print("Training complete")
```

8 lines. A trivial placeholder training loop. Never referenced from any config, CI, or entrypoint (the `entrypoint-experiment.sh` references it but that's also being removed). No ML training feature exists in this project's milestone plan.

**Verdict:** Delete along with the experiment cluster.

---

#### Experiment Cluster (4 files)

`Dockerfile.experiment`, `entrypoint-experiment.sh`, `requirements-experiments.txt`, `train_sample.py`, and `build_tag.txt` form a coherent group — a standalone Python ML experiment harness that was introduced by Copilot during a skunkworks session. The project's current stack and milestones contain no ML training component.

If this experiment cluster has future value, it should live in a dedicated branch or `experiments/` directory. At root, it contributes to noise and confusion.

**Verdict:** Delete all 5 experiment files. If you want to preserve them: `git mv Dockerfile.experiment entrypoint-experiment.sh requirements-experiments.txt train_sample.py build_tag.txt experiments/`

---

### 🚨 DANGER ZONE — Do Not Touch Without Permission

#### `.env` (639 B, root-owned by `root:root`)

Active secrets file. Correctly gitignored. Owned by root (interesting — suggests written by a `sudo` process, possibly `docker compose`). **Do not print, read, move, or delete.**

#### `.env.local` (339 B)

Local dev overrides. Correctly gitignored. **Do not touch.**

#### `gemini-extension.json.bak` ← **CRITICAL — SEE SECTION 5**

---

## 3. Skeptical Analysis — Root Health Assessment

### 3.1 Package Manager Conflict

`package.json` exists. No `yarn.lock`, no `pnpm-lock.yaml`, no `bun.lockb` found in root. Only npm is in play. **No conflict.** ✓

### 3.2 Stack Coherence vs. Experiment Artifacts

The project is a GIS Web PWA: Next.js 15, MapLibre GL JS, Supabase, Martin, Tailwind, Vitest, Playwright. The `package.json` confirms this perfectly.

The experiment cluster (`Dockerfile.experiment`, `train_sample.py`, `requirements-experiments.txt`) reflects a **completely different technology domain** — Python ML/data science. This cluster is orphaned from the main project direction. There is no `sklearn` or `numpy` use-case in any of the 14 specs or the milestone plan.

**Skeptical flag:** Who authorised this? Was it a Copilot agent experiment? It's consistent with Copilot's tendency to add ML scaffolding when asked to "set up a complete AI project."

### 3.3 Missing Root Files Per `CLAUDE.md §8`

CLAUDE.md specifies `AGENTS.md` as a required root file. It currently exists only as `AGENTS.md.bak`. The `README.md` also links to `AGENTS.md` in its repository structure diagram — that link is broken.

**Action:** Either restore `AGENTS.md` from `AGENTS.md.bak` (or create a concise new one pointing to CLAUDE.md), or update README.md to remove the broken reference.

### 3.4 `.gitignore` Gaps

The current `.gitignore` correctly excludes `.env`, `.env.local`, OS files, logs, and build artifacts. However, it **does not** exclude:

- `*.bak` files
- `build_tag.txt` (runtime artifact)
- `.gemini-research.json` (Gemini CLI state)
- `10%`, `3σ` etc. (not really ignorable by pattern — just delete them)

**Recommendation:** Add these patterns:

```gitignore
# Build tags & runtime artifacts
build_tag.txt

# Gemini CLI research state
.gemini-research.json

# Backup files
*.bak
```

### 3.5 Backup Directories at Root

Four backup-style directories exist:
- `.claude_backup/` — Claude agent backup
- `.claude_removed/` — Claude artifacts removed during cleanup
- `.github_backup/` — GitHub Copilot config backup
- `.github_removed/` — GitHub Copilot agents removed during cleanup

These appear to be cleanup-phase artifacts from the M0 repo reboot. They are almost certainly tracked in git given their presence. **Are they still needed?**

**Skeptical question:** If the cleanup phase is complete and the removals were intentional, these backup directories serve no purpose except as a rollback safety net. Their contents should be in git history. Recommend archiving or deleting after confirming M0 acceptance.

---

## 4. Proposed Actions

### 4A — Immediate Deletions (SAFE TO EXECUTE)

```bash
# 5 empty ghost files
rm "10%" "3σ" "alert." baseline notify

# Backup files (content preserved in git history)
rm AGENTS.md.bak

# Build tag (runtime artifact, should be gitignored)
rm build_tag.txt

# Experiment cluster (not part of the project's milestones)
rm Dockerfile.experiment entrypoint-experiment.sh train_sample.py requirements-experiments.txt
```

### 4B — File Relocations (APPROVAL NEEDED)

```bash
# Move oversized doc out of root
git mv agent-definitions-v2.md docs/planning/agent-definitions-v2.md

# Move pipeline scripts into scripts/ directory
mkdir -p scripts/pipeline
git mv provenance.py scripts/pipeline/provenance.py
git mv license_checker.py scripts/pipeline/license_checker.py
```

### 4C — `.gitignore` Updates

Add to `.gitignore`:
```gitignore
# Runtime artifacts
build_tag.txt

# AI agent local state
.gemini-research.json

# Backup files
*.bak
```

### 4D — DANGER ZONE: gemini-extension.json.bak (SEE SECTION 5)

---

## 5. 🚨 Security Remediation — `gemini-extension.json.bak`

### What Was Found

The file contains real API keys for three services:
- **Context7:** `CONTEXT7_API_KEY` — a `ctx7sk-...` format key
- **Exa:** `EXA_API_KEY` — a UUID format key  
- **Vercel:** `VERCEL_TOKEN` — a `vcp_...` format token

The file is **tracked in git** (committed in `b13a76c` on branch `rebootstrap/cleanup-20260304T103943`).

### Impact

Anyone with read access to this git repository can extract these credentials from history even after the file is deleted. The keys must be **rotated immediately**, regardless of what we do to the file.

### Remediation Steps

**Step 1 — ROTATE THE KEYS NOW (most important)**
1. Context7: Revoke at Context7 dashboard and generate new key
2. Exa: Revoke at Exa dashboard and generate new key
3. Vercel: Revoke token at https://vercel.com/account/tokens and create new one
4. Update `.gemini/` or wherever these keys are live-configured

**Step 2 — Remove file from git history**
```bash
# Remove the .bak file from all git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch gemini-extension.json.bak' \
  --prune-empty --tag-name-filter cat -- --all

# Force-push to remote (coordinate with team)
git push origin --force --all
git push origin --force --tags
```

Or use `git-filter-repo` (preferred modern approach):
```bash
pip install git-filter-repo
git filter-repo --path gemini-extension.json.bak --invert-paths
```

**Step 3 — Add to `.gitignore`**
```gitignore
*.bak
gemini-extension.json.bak
```

**Step 4 — Verify**
```bash
git log --all --full-history -- gemini-extension.json.bak
# Should return nothing after purge
```

> ⚠️ Even after git history purge, if this repo was ever pushed to a remote (GitHub, GitLab, etc.) or cloned by anyone, those copies may still have the old history. **Rotate the keys regardless.**

---

## 6. Post-Cleanup Expected Root State

After executing approved actions, the root should contain exactly:

```
capegis/
├── CLAUDE.md               ← AI agent rules
├── PLAN.md                 ← Milestone plan
├── README.md               ← Project overview
├── package.json            ← Node dependencies
├── docker-compose.yml      ← PostGIS + Martin + LocalStack
├── docker-compose.override.yml  ← LocalStack override
├── .env.example            ← Env template (committed)
├── .gitignore              ← Updated with new exclusions
├── omg-config.json         ← Oh My Gemini config (keep or add to CLAUDE.md §8)
├── .env                    ← Secrets (gitignored, not in git)
├── .env.local              ← Local overrides (gitignored, not in git)
├── docs/                   ← Documentation
├── supabase/               ← DB migrations
├── .github/                ← CI/CD + Copilot agents
├── .claude/                ← Claude agent config
├── .copilot/               ← Copilot config
├── .gemini/                ← Gemini CLI config
├── .vscode/                ← Editor config
└── .git/                   ← Git history
```

Files removed: 10 (5 ghost files + 2 bak files + 4 experiment files)
Files moved: 3 (`agent-definitions-v2.md`, `provenance.py`, `license_checker.py`)

---

## 7. Verification Plan

After executing removals:

```bash
# 1. Confirm deleted files are gone
ls -la "10%" "3σ" "alert." baseline notify AGENTS.md.bak build_tag.txt \
  Dockerfile.experiment entrypoint-experiment.sh train_sample.py requirements-experiments.txt \
  2>&1 | grep "No such"

# 2. Confirm core infrastructure files still present
ls -la CLAUDE.md PLAN.md README.md package.json docker-compose.yml .env.example

# 3. Confirm moved files at new locations
ls docs/planning/agent-definitions-v2.md
ls scripts/pipeline/provenance.py scripts/pipeline/license_checker.py

# 4. Confirm docker-compose still valid
docker compose config --quiet && echo "docker-compose: OK"

# 5. Confirm package.json parseable
node -e "require('./package.json')" && echo "package.json: OK"
```

---

*Report generated by Gemini (Antigravity) on 2026-03-05T11:29Z*
*Ralph says: "I cleaned my room. My room was the whole project. I found a sock with API keys in it. We threw the sock away and called the sock factory."*
