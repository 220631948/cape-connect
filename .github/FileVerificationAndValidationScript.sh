cd "/home/mr/Desktop/Geographical Informations Systems (GIS)"

# 1. Verify all files were created
echo "=========================================="
echo "1. File Count Verification"
echo "=========================================="
echo "Rules: $(find .claude/rules -name '*.md' | wc -l) (expected: 9)"
echo "Contexts: $(find .claude/contexts -name '*.md' | wc -l) (expected: 4)"
echo "New Agents: $(ls -1 .claude/agents/{planner,tdd-guide,database-reviewer-gis,refactor-cleaner,harness-optimizer}.md 2>/dev/null | wc -l) (expected: 5)"
echo "New Commands: $(ls -1 .claude/commands/{plan,tdd,test-coverage,db-review,quality-gate,harness-audit,agentshield-scan,compact-session,instinct-*}.md 2>/dev/null | wc -l) (expected: 12)"
echo "New Skills: $(ls -1d .claude/skills/{tdd-workflow-gis,continuous-learning-capegis,strategic-compact-gis,search-first,backend-patterns-supabase} 2>/dev/null | wc -l) (expected: 5)"
echo "Hooks: $(find .claude/hooks -name '*.js' -o -name '*.json' | wc -l) (expected: 4)"
echo ""

# 2. Verify documentation was updated
echo "=========================================="
echo "2. Documentation Update Verification"
echo "=========================================="
grep -c "planner.md" .claude/INDEX.md
grep -c "database-reviewer-gis.md" .claude/INDEX.md
grep -c "tdd-workflow-gis" .claude/INDEX.md
echo ""

# 3. Check for syntax errors in key files
echo "=========================================="
echo "3. Syntax Check"
echo "=========================================="
node -c .claude/hooks/block-secrets.js && echo "✓ block-secrets.js syntax OK"
node -c .claude/hooks/badge-enforcer.js && echo "✓ badge-enforcer.js syntax OK"
node -c .claude/hooks/audit-trail.js && echo "✓ audit-trail.js syntax OK"
echo ""

# 4. Test a simple command (if Claude Code CLI supports it)
echo "=========================================="
echo "4. Integration Test"
echo "=========================================="
echo "Run this in Claude Code to test:"
echo "  /plan 'simple test feature'"
echo ""

# 5. View the rules system
echo "=========================================="
echo "5. Rules System Check"
echo "=========================================="
head -20 .claude/rules/README.md
echo ""

echo "=========================================="
echo "✓ Validation Complete"
echo "=========================================="
