#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import re
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
MONITORED = {
    "docs": ROOT / "docs",
    ".claude": ROOT / ".claude",
    ".gemini": ROOT / ".gemini",
    ".github": ROOT / ".github",
}
AUTO_HEADER = (
    "<!-- AUTO-MAINTAINED: Updated by AI agents via skills, agentSwitching, hooks, "
    "MCP servers, and MoE routing. Do not edit this header. -->"
)
BEGIN_AUTO = "<!-- BEGIN AUTO -->"
END_AUTO = "<!-- END AUTO -->"
END_AUTO_SECTION = "<!-- END AUTO-SECTION -->"
PROMINENT_NOTE = (
    "This index is automatically maintained by AI agents using skills, "
    "agentSwitching, hooks, MCP servers, and MoE routing."
)
AUTO_FILES = {
    "docs/INDEX.md",
    ".claude/INDEX.md",
    ".gemini/INDEX.md",
    ".github/INDEX.md",
    "docs/CHANGELOG_AUTO.md",
}
GROUP_DIRS = {".git", "node_modules", "dist", "build", "coverage", "target", "servers"}
ROOT_META = {
    "docs": (
        "# 📚 docs/ master index",
        "Master documentation map for CapeTown GIS Hub. Start here for repo-level "
        "governance, architecture, research, and workflow references.",
    ),
    ".claude": (
        "# 🧠 .claude/ index",
        "Claude-specific workspace map covering orchestration docs, command playbooks, "
        "reference guides, hooks, and reusable skills.",
    ),
    ".gemini": (
        "# 🪄 .gemini/ index",
        "Gemini workspace map covering repo-level guidance, hooks, skills, and bundled "
        "extensions.",
    ),
    ".github": (
        "# 🤖 .github/ index",
        "GitHub-facing automation map for Copilot agents, prompts, skills, hooks, and "
        "repository workflows.",
    ),
}
DIR_SUMMARIES = {
    "docs:agents": "Agent-fleet audits, swarm reports, and MCP registry references.",
    "docs:architecture": "System design, ADRs, and implementation architecture briefs.",
    "docs:assets": "Binary reference assets used by the documentation set.",
    "docs:backlog": "Planning backlogs and risk-prioritisation matrices.",
    "docs:context": "Project constitution and canonical background context.",
    "docs:docker": "Local Docker stack guidance and environment configuration notes.",
    "docs:features": "Feature concept documents and expansion ideas.",
    "docs:infra": "Operational references for hooks, MCP servers, and skills.",
    "docs:integrations": "Integration notes and provider-specific implementation guides.",
    "docs:planning": "Planning material, execution guides, and fleet coordination notes.",
    "docs:research": "Research findings, validation notes, and data-source evidence.",
    "docs:specs": "Feature specifications and acceptance-criteria documents.",
    ".claude:agents": "Claude agent definitions and bootstrap helpers.",
    ".claude:commands": "Slash-style command playbooks for common GIS tasks.",
    ".claude:guides": "Claude-facing implementation and domain reference guides.",
    ".claude:skills": "Reusable Claude skill packs grouped by GIS capability.",
    ".gemini:agents": "Gemini-specific agent definitions and bootstrap helpers.",
    ".gemini:extensions": "Bundled Gemini extensions, including authored entry points and grouped machine-managed trees.",
    ".gemini:hooks": "Gemini hook helpers and local automation utilities.",
    ".github:agents": "Canonical GitHub Copilot agent definitions for the active fleet.",
    ".github:copilot": "GitHub Copilot configuration, skills, prompts, hooks, and instruction packs.",
    ".github:copilot/agents": "GitHub Copilot agent definitions mirrored for the active project fleet.",
    ".github:copilot/hooks": "Copilot hook registration and lifecycle automation.",
    ".github:copilot/instructions": "Instruction packs for framework, mapping, security, and data governance.",
    ".github:copilot/prompts": "Reusable Copilot prompts for common delivery and review workflows.",
    ".github:copilot/skills": "Project-specific GitHub Copilot skills organised by capability.",
    ".github:workflows": "GitHub Actions workflows for CI, docs sync, and governance checks.",
}
FILE_SUMMARIES = {
    "AGENTS.md": "Universal agent instructions for this workspace.",
    "CHANGELOG_AUTO.md": "Auto-maintained log of documentation sync activity.",
    "copilot-hooks.json": "Hook registration map for GitHub Copilot automation.",
    "copilot-instructions.md": "Top-level GitHub Copilot instruction reference for the repo.",
    "gemini-extension.json": "Extension manifest for this Gemini bundle.",
    "GEMINI.md": "Primary Gemini operating guide for this repository.",
    "INDEX.md": "Living table of contents for this workspace.",
    "LICENSE": "License text for this component.",
    "mcp-planned.json": "Planned MCP server additions and future Copilot integrations.",
    "mcp.json": "Active MCP server configuration for GitHub Copilot.",
    "package-lock.json": "JavaScript dependency lockfile for this component.",
    "package.json": "Node package manifest for this component.",
    "README.md": "Primary README for this component.",
    "settings.json": "Shared workspace settings configuration.",
    "settings.local.json": "Local-only workspace settings overrides.",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def slug_title(text: str) -> str:
    return " ".join(part.capitalize() for part in re.split(r"[-_.]+", text) if part)


def tidy(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[`*_>#]", " ", text)
    return re.sub(r"\s+", " ", text).strip(" -")


def trim(text: str, limit: int = 180) -> str:
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def preserved_tail(path: Path) -> str:
    if not path.exists():
        return ""
    lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    for marker in (END_AUTO_SECTION, END_AUTO):
        for index, line in enumerate(lines):
            if line.strip() == marker:
                return "\n".join(lines[index + 1 :]).strip("\n")
    return ""


@lru_cache(maxsize=None)
def descendant_counts(path_text: str) -> tuple[int, int]:
    files = dirs = 0
    for _, dir_names, file_names in os.walk(path_text):
        dirs += len(dir_names)
        files += len(file_names)
    return files, dirs


def rel_key(root_name: str, path: Path) -> str:
    rel = path.relative_to(MONITORED[root_name]).as_posix()
    return f"{root_name}:{rel}"


def md_summary(path: Path) -> str:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    heading = ""
    for line in raw.splitlines():
        if line.lstrip().startswith("#"):
            heading = tidy(line.lstrip("# ").strip())
            break
    body = ""
    for line in raw.splitlines():
        candidate = tidy(line)
        if not candidate or candidate == heading or candidate == "---" or candidate.startswith("title:"):
            continue
        if line.lstrip().startswith("#") or line.lstrip().startswith("<!--"):
            continue
        body = candidate
        break
    if heading and body and heading.lower() != body.lower():
        return trim(f"{heading} — {body}")
    return trim(heading or body)


def file_summary(root_name: str, path: Path) -> str:
    rel = path.relative_to(MONITORED[root_name]).as_posix()
    if path.name == "SKILL.md":
        return f"Skill definition for {slug_title(path.parent.name)}."
    if rel.startswith("workflows/") and path.suffix in {".yml", ".yaml"}:
        return f"GitHub Actions workflow for {slug_title(path.stem)}."
    if rel.startswith("copilot/prompts/"):
        return f"Reusable prompt for {slug_title(path.stem.replace('.prompt', ''))}."
    if rel.startswith("commands/"):
        return f"Command playbook for {slug_title(path.stem)}."
    if rel.startswith("guides/"):
        return f"Reference guide for {slug_title(path.stem)}."
    if path.name.endswith(".agent.md"):
        return f"Agent definition for {slug_title(path.name.replace('.agent.md', ''))}."
    if path.name in FILE_SUMMARIES:
        return FILE_SUMMARIES[path.name]
    if path.suffix.lower() == ".md":
        summary = md_summary(path)
        if summary:
            return summary
    if path.suffix.lower() == ".pdf":
        return "PDF reference asset stored alongside documentation."
    if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".gif", ".webp"}:
        return "Image asset used by repository documentation or agent tooling."
    if path.suffix.lower() in {".json", ".jsonc", ".toml", ".yml", ".yaml", ".cjs", ".mjs", ".js"}:
        return f"Configuration or implementation asset for {slug_title(path.stem)}."
    return f"Workspace asset for {slug_title(path.stem or path.name)}."


def directory_summary(root_name: str, path: Path, grouped: bool) -> str:
    mapped = DIR_SUMMARIES.get(rel_key(root_name, path))
    if mapped:
        return mapped
    files, dirs = descendant_counts(str(path))
    if files == 0 and dirs == 0:
        return f"Reserved location for {slug_title(path.name).lower()}; currently empty."
    base = f"{slug_title(path.name)} subtree ({files} files, {dirs} subdirectories)."
    return base + (" Grouped here to keep the index readable." if grouped else "")


def link(root_name: str, path: Path) -> str:
    rel = path.relative_to(MONITORED[root_name]).as_posix()
    return f"./{quote(rel, safe='/._-')}"


def should_group(root_name: str, path: Path, depth: int) -> bool:
    files, dirs = descendant_counts(str(path))
    if path.name in GROUP_DIRS:
        return True
    if root_name == ".gemini":
        return depth >= 2 and (files > 80 or dirs > 20)
    return depth >= 3 and (files > 120 or dirs > 30)


def iter_children(path: Path) -> tuple[list[Path], list[Path]]:
    children = [child for child in path.iterdir()]
    files = sorted((child for child in children if child.is_file()), key=lambda item: item.name.lower())
    dirs = sorted((child for child in children if child.is_dir()), key=lambda item: item.name.lower())
    return files, dirs


def render_tree(root_name: str, path: Path, depth: int, lines: list[str]) -> None:
    files, dirs = iter_children(path)
    indent = "  " * (depth + 1)
    for file_path in files:
        summary = file_summary(root_name, file_path)
        lines.append(f"{indent}- 📄 [{file_path.relative_to(MONITORED[root_name]).as_posix()}]({link(root_name, file_path)}) — {summary}")
    for dir_path in dirs:
        grouped = should_group(root_name, dir_path, depth)
        summary = directory_summary(root_name, dir_path, grouped)
        lines.append(f"{indent}- 📁 [{dir_path.relative_to(MONITORED[root_name]).as_posix()}/]({link(root_name, dir_path)}/) — {summary}")
        if not grouped:
            render_tree(root_name, dir_path, depth + 1, lines)


def related_links(root_name: str) -> list[str]:
    labels = {
        "docs": "Master documentation index",
        ".claude": "Claude workspace index",
        ".gemini": "Gemini workspace index",
        ".github": "GitHub workspace index",
    }
    lines = ["## 🔗 Related indexes", ""]
    for other_name in ("docs", ".claude", ".gemini", ".github"):
        if other_name == root_name:
            continue
        if root_name == "docs":
            rel = f"../{other_name}/INDEX.md" if other_name.startswith(".") else f"./{other_name}/INDEX.md"
        elif other_name == "docs":
            rel = "../docs/INDEX.md"
        else:
            rel = f"../{other_name}/INDEX.md"
        lines.append(f"- 🔗 [{rel}]({rel}) — {labels[other_name]}.")
    return lines


def build_index(root_name: str, index_path: Path, stamp: str) -> str:
    title, intro = ROOT_META[root_name]
    root = MONITORED[root_name]
    lines = [AUTO_HEADER, "", BEGIN_AUTO, "", title, "", intro, "", f"> {PROMINENT_NOTE}", ""]
    lines.extend(related_links(root_name))
    lines.extend(["", "## 📄 Root files", ""])
    root_files, root_dirs = iter_children(root)
    for file_path in root_files:
        lines.append(f"- 📄 [{file_path.name}]({link(root_name, file_path)}) — {file_summary(root_name, file_path)}")
    lines.extend(["", "## 📁 Directory map", ""])
    for dir_path in root_dirs:
        grouped = should_group(root_name, dir_path, 0)
        lines.append(f"- 📁 [{dir_path.name}/]({link(root_name, dir_path)}/) — {directory_summary(root_name, dir_path, grouped)}")
        if not grouped:
            render_tree(root_name, dir_path, 1, lines)
    lines.extend(["", f"[AGENT: docs-indexer | SESSION: {stamp}]", "", END_AUTO, END_AUTO_SECTION])
    tail = preserved_tail(index_path)
    text = "\n".join(lines).rstrip() + "\n"
    if tail:
        text += "\n" + tail.rstrip() + "\n"
    return text


def extract_rows(path: Path) -> list[str]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line.startswith("|"):
            continue
        stripped = line.strip()
        if stripped.startswith("| Timestamp ") or stripped.startswith("| ---"):
            continue
        rows.append(stripped)
    return rows


def normalize_changed(values: list[str]) -> list[str]:
    changed = []
    for value in values:
        path_text = value.replace("\\", "/").strip()
        if path_text and path_text not in AUTO_FILES:
            changed.append(path_text)
    return changed or ["manual-sync"]


def build_changelog(stamp: str, changed: list[str]) -> str:
    path = MONITORED["docs"] / "CHANGELOG_AUTO.md"
    rows = extract_rows(path)
    for item in normalize_changed(changed):
        row = f"| {stamp} | `{item}` | synced monitored indexes | docs-indexer |"
        if row not in rows:
            rows.append(row)
    lines = [
        AUTO_HEADER,
        "",
        BEGIN_AUTO,
        "",
        "# CHANGELOG_AUTO.md",
        "",
        "Auto-maintained log of documentation sync activity for monitored directories.",
        "",
        f"> {PROMINENT_NOTE}",
        "",
        "| Timestamp | Changed path | Action | Agent |",
        "| --- | --- | --- | --- |",
        *rows,
        "",
        END_AUTO,
        END_AUTO_SECTION,
    ]
    tail = preserved_tail(path)
    text = "\n".join(lines).rstrip() + "\n"
    if tail:
        text += "\n" + tail.rstrip() + "\n"
    return text


def write_or_check(path: Path, content: str, check: bool, changed: list[Path]) -> None:
    current = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else ""
    if current != content:
        changed.append(path)
        if not check:
            try:
                path.write_text(content, encoding="utf-8")
            except PermissionError:
                print(f"[sync_doc_indexes] WARNING: permission denied, skipping {path} (run: sudo chown $USER {path})")


def main() -> int:
    parser = argparse.ArgumentParser(description="Regenerate monitored documentation indexes.")
    parser.add_argument("--changed", action="append", default=[], help="Changed file path to record in CHANGELOG_AUTO.md")
    parser.add_argument("--check", action="store_true", help="Exit non-zero if generated files are out of date.")
    args = parser.parse_args()
    stamp = utc_now()
    changed_paths: list[Path] = []
    changelog_path = MONITORED["docs"] / "CHANGELOG_AUTO.md"
    changelog = build_changelog(stamp, args.changed)
    write_or_check(changelog_path, changelog, args.check, changed_paths)
    for root_name, root_path in MONITORED.items():
        index_path = root_path / "INDEX.md"
        write_or_check(index_path, build_index(root_name, index_path, stamp), args.check, changed_paths)
    if changed_paths and args.check:
        print("Out-of-date auto-doc files:")
        for path in changed_paths:
            print(f" - {path.relative_to(ROOT).as_posix()}")
        return 1
    if not args.check:
        for path in changed_paths:
            print(f"updated {path.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
