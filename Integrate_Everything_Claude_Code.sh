cd "/home/mr/Desktop/Geographical Informations Systems (GIS)" && \
git add .claude/rules/ .claude/contexts/ \
  .claude/agents/{planner,tdd-guide,database-reviewer-gis,refactor-cleaner,harness-optimizer}.md \
  .claude/commands/{plan,tdd,test-coverage,db-review,quality-gate,harness-audit,agentshield-scan,compact-session,instinct-*}.md \
  .claude/skills/{tdd-workflow-gis,continuous-learning-capegis,strategic-compact-gis,search-first,backend-patterns-supabase}/ \
  .claude/hooks/ docs/integration/ .claude/INDEX.md && \
git commit -m "feat(claude): integrate Everything-Claude-Code (ECC) harness system

## What Changed

Integrated 43 files from affaan-m/everything-claude-code:
- 9 rules (testing, security, performance, patterns + TypeScript)
- 4 contexts (dev, research, review, milestone)
- 5 agents (planner, tdd-guide, database-reviewer-gis, refactor-cleaner, harness-optimizer)
- 12 commands (/plan, /tdd, /test-coverage, /db-review, /quality-gate, etc.)
- 5 skills (tdd-workflow-gis, continuous-learning-capegis, etc.)
- 3 hooks (block-secrets, badge-enforcer, audit-trail)

## Why

Adds plan-first workflow, TDD enforcement, quality gates, context management,
pattern learning, and security automation. Complements CLAUDE.md rules.

## How to Use

/plan \"<feature>\"  # Blueprint before coding
/tdd                 # Enforce RED-GREEN-REFACTOR
/quality-gate        # Pre-merge validation
/db-review          # PostGIS + RLS review

Source: https://github.com/affaan-m/everything-claude-code (MIT)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
