#!/bin/bash
# Status Dashboard - Unified view of project progress
# Usage: ./scripts/status-dashboard.sh

set -e

echo "📊 PROJECT STATUS"
echo "================"
echo ""

# Count active specs
SPECS_COUNT=$(find docs/specs -maxdepth 1 -type d 2>/dev/null | grep -v templates | grep -v "^docs/specs$" | wc -l | tr -d ' ')
echo "📋 Active Specs: $SPECS_COUNT"

# Count active plans
PLANS_COUNT=$(find plans -name "*.md" -type f 2>/dev/null | grep -v ".gitkeep" | wc -l | tr -d ' ')
echo "📝 Active Plans: $PLANS_COUNT"

# Count active todos
TODOS_COUNT=$(find todos -name "*.md" -type f 2>/dev/null | grep -v ".gitkeep" | grep -v "archive" | wc -l | tr -d ' ')
echo "✅ Active Todos: $TODOS_COUNT"

echo ""

# Compound Health
echo "🏥 Compound Health"
SOLUTIONS_COUNT=$(find docs/solutions -name "*.md" -type f 2>/dev/null | grep -v template | grep -v schema | grep -v README | wc -l | tr -d ' ')
PATTERNS_COUNT=$(grep -c "^### Pattern" docs/solutions/patterns/critical-patterns.md 2>/dev/null || echo "0")
echo "   Solutions: $SOLUTIONS_COUNT"
echo "   Patterns: $PATTERNS_COUNT ✅"

echo ""

# Recent Workflows
echo "🔧 Recent Workflows (last 5)"
if [ -f ".agent/logs/workflow_usage.log" ]; then
    tail -5 .agent/logs/workflow_usage.log | while read line; do
        workflow=$(echo "$line" | cut -d'|' -f2)
        echo "   $workflow"
    done
else
    echo "   No workflow logs found"
fi

echo ""

# Git Status
echo "📁 Git Status"
MODIFIED=$(git status --short 2>/dev/null | grep "^ M\|^M " | wc -l | tr -d ' ')
UNTRACKED=$(git status --short 2>/dev/null | grep "^??" | wc -l | tr -d ' ')
echo "   Modified: $MODIFIED"
echo "   Untracked: $UNTRACKED"

echo ""
echo "================"
echo "Run /housekeeping before push"
