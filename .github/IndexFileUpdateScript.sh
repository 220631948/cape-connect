#!/bin/bash
# Documentation Update Script for ECC Integration
# Purpose: Update .claude/INDEX.md with 5 new ECC agents

PROJECT="/home/mr/Desktop/Geographical Informations Systems (GIS)"
INDEX_FILE="$PROJECT/.claude/INDEX.md"

echo "==========================================="
echo "ECC Integration Documentation Update"
echo "==========================================="

# Backup the original INDEX.md
cp "$INDEX_FILE" "$INDEX_FILE.backup-$(date +%Y%m%d-%H%M%S)"
echo "✓ Backed up INDEX.md"

# Create temporary file for editing
TEMP_FILE=$(mktemp)

# Read the file and insert the new agents in alphabetical order
awk '
/^    - 📄 \[agents\/data-agent\.md\]/ {
    print $0
    print "    - 📄 [agents/database-reviewer-gis.md](./agents/database-reviewer-gis.md) — DATABASE-REVIEWER-GIS 🔍 — PostGIS Schema & RLS Policy Reviewer — name: database-reviewer-gis"
    next
}
/^    - 📄 \[agents\/feature-builder\.md\]/ {
    print $0
    print "    - 📄 [agents/harness-optimizer.md](./agents/harness-optimizer.md) — HARNESS-OPTIMIZER ⚙️ — Agent Harness Performance Optimizer — name: harness-optimizer"
    next
}
/^    - 📄 \[agents\/overlay-agent\.md\]/ {
    print $0
    print "    - 📄 [agents/planner.md](./agents/planner.md) — PLANNER 📋 — Implementation Blueprint Creator — name: planner"
    next
}
/^    - 📄 \[agents\/refactor-specialist\.md\]/ {
    print $0
    print "    - 📄 [agents/refactor-cleaner.md](./agents/refactor-cleaner.md) — REFACTOR-CLEANER 🧹 — Dead Code Removal & File Splitter — name: refactor-cleaner"
    next
}
/^    - 📄 \[agents\/test-agent\.md\]/ {
    print $0
    print "    - 📄 [agents/tdd-guide.md](./agents/tdd-guide.md) — TDD-GUIDE 🧪 — Test-Driven Development Enforcer — name: tdd-guide"
    next
}
{ print }
' "$INDEX_FILE" > "$TEMP_FILE"

# Replace original file
mv "$TEMP_FILE" "$INDEX_FILE"
echo "✓ Updated agent entries in INDEX.md"

# Now add the commands section updates
TEMP_FILE=$(mktemp)
awk '
/^    - 📄 \[commands\/analyze-repo\.md\]/ {
    print $0
    print "    - 📄 [commands/agentshield-scan.md](./commands/agentshield-scan.md) — Command playbook for Agentshield Scan."
    next
}
/^    - 📄 \[commands\/coverage-report\.md\]/ {
    print $0
    print "    - 📄 [commands/compact-session.md](./commands/compact-session.md) — Command playbook for Compact Session."
    next
}
/^    - 📄 \[commands\/debug-issue\.md\]/ {
    print $0
    print "    - 📄 [commands/db-review.md](./commands/db-review.md) — Command playbook for Db Review."
    next
}
/^    - 📄 \[commands\/immersive-check\.md\]/ {
    print $0
    print "    - 📄 [commands/instinct-clear.md](./commands/instinct-clear.md) — Command playbook for Instinct Clear."
    print "    - 📄 [commands/instinct-export.md](./commands/instinct-export.md) — Command playbook for Instinct Export."
    print "    - 📄 [commands/instinct-import.md](./commands/instinct-import.md) — Command playbook for Instinct Import."
    print "    - 📄 [commands/instinct-status.md](./commands/instinct-status.md) — Command playbook for Instinct Status."
    next
}
/^    - 📄 \[commands\/milestone-audit\.md\]/ {
    print "    - 📄 [commands/harness-audit.md](./commands/harness-audit.md) — Command playbook for Harness Audit."
    print $0
    next
}
/^    - 📄 \[commands\/optimize-tiles\.md\]/ {
    print $0
    print "    - 📄 [commands/plan.md](./commands/plan.md) — Command playbook for Plan."
    next
}
/^    - 📄 \[commands\/provenance-record\.md\]/ {
    print $0
    print "    - 📄 [commands/quality-gate.md](./commands/quality-gate.md) — Command playbook for Quality Gate."
    next
}
/^    - 📄 \[commands\/refactor-module\.md\]/ {
    print "    - 📄 [commands/tdd.md](./commands/tdd.md) — Command playbook for Tdd."
    print "    - 📄 [commands/test-coverage.md](./commands/test-coverage.md) — Command playbook for Test Coverage."
    print $0
    next
}
{ print }
' "$INDEX_FILE" > "$TEMP_FILE"

mv "$TEMP_FILE" "$INDEX_FILE"
echo "✓ Updated command entries in INDEX.md"

# Now add the skills section updates
TEMP_FILE=$(mktemp)
awk '
/^    - 📁 \[skills\/assumption_verification\/\]/ {
    print "    - 📁 [skills/backend-patterns-supabase/](./skills/backend-patterns-supabase/) — Backend Patterns Supabase subtree (1 files, 0 subdirectories)."
    print "      - 📄 [skills/backend-patterns-supabase/SKILL.md](./skills/backend-patterns-supabase/SKILL.md) — Skill definition for Backend Patterns Supabase."
    print $0
    next
}
/^    - 📁 \[skills\/code_summarize\/\]/ {
    print $0
    print "    - 📁 [skills/continuous-learning-capegis/](./skills/continuous-learning-capegis/) — Continuous Learning Capegis subtree (1 files, 0 subdirectories)."
    print "      - 📄 [skills/continuous-learning-capegis/SKILL.md](./skills/continuous-learning-capegis/SKILL.md) — Skill definition for Continuous Learning Capegis."
    next
}
/^    - 📁 \[skills\/schema_smells\/\]/ {
    print $0
    print "    - 📁 [skills/search-first/](./skills/search-first/) — Search First subtree (1 files, 0 subdirectories)."
    print "      - 📄 [skills/search-first/SKILL.md](./skills/search-first/SKILL.md) — Skill definition for Search First."
    next
}
/^    - 📁 \[skills\/source_badge_lint\/\]/ {
    print $0
    print "    - 📁 [skills/strategic-compact-gis/](./skills/strategic-compact-gis/) — Strategic Compact Gis subtree (1 files, 0 subdirectories)."
    print "      - 📄 [skills/strategic-compact-gis/SKILL.md](./skills/strategic-compact-gis/SKILL.md) — Skill definition for Strategic Compact Gis."
    next
}
/^    - 📁 \[skills\/test_stub_gen\/\]/ {
    print $0
    print "    - 📁 [skills/tdd-workflow-gis/](./skills/tdd-workflow-gis/) — Tdd Workflow Gis subtree (1 files, 0 subdirectories)."
    print "      - 📄 [skills/tdd-workflow-gis/SKILL.md](./skills/tdd-workflow-gis/SKILL.md) — Skill definition for Tdd Workflow Gis."
    next
}
{ print }
' "$INDEX_FILE" > "$TEMP_FILE"

mv "$TEMP_FILE" "$INDEX_FILE"
echo "✓ Updated skill entries in INDEX.md"

# Update session info at bottom
TEMP_FILE=$(mktemp)
awk '
/^\[AGENT: docs-indexer \| SESSION:/ {
    print "[AGENT: ecc-integrator | SESSION: 2026-03-17T" strftime("%H:%M:%SZ") "]"
    next
}
{ print }
' "$INDEX_FILE" > "$TEMP_FILE"

mv "$TEMP_FILE" "$INDEX_FILE"
echo "✓ Updated session timestamp"

echo ""
echo "==========================================="
echo "Summary of INDEX.md Updates"
echo "==========================================="
echo "Added 5 new agents:"
echo "  - database-reviewer-gis"
echo "  - harness-optimizer"
echo "  - planner"
echo "  - refactor-cleaner"
echo "  - tdd-guide"
echo ""
echo "Added 12 new commands:"
echo "  - agentshield-scan, compact-session, db-review"
echo "  - harness-audit, instinct-clear, instinct-export"
echo "  - instinct-import, instinct-status, plan"
echo "  - quality-gate, tdd, test-coverage"
echo ""
echo "Added 5 new skills:"
echo "  - backend-patterns-supabase"
echo "  - continuous-learning-capegis"
echo "  - search-first"
echo "  - strategic-compact-gis"
echo "  - tdd-workflow-gis"
echo ""
echo "✓ Documentation update complete!"
echo ""
echo "Backup saved to: $INDEX_FILE.backup-*"
