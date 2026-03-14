#!/usr/bin/env bash
# PreToolUse hook to block dangerous Bash commands
# Logs blocked commands to .claude/security.log

set -euo pipefail

# Absolute paths
PROJECT_DIR="/home/mr/Desktop/Geographical Informations Systems (GIS)"
HOOKS_DIR="$PROJECT_DIR/.claude/hooks"
LOG_FILE="$PROJECT_DIR/.claude/security.log"

# Ensure hooks dir and log exist
mkdir -p "$HOOKS_DIR"
# Create log if missing but DO NOT truncate existing logs
touch "$LOG_FILE" 2>/dev/null || true

# Read entire stdin (the PreToolUse tool input JSON)
INPUT_JSON="$(cat -)"

# Require jq for safe JSON parsing. Deny by default if jq is not installed to avoid unsafe parsing.
if ! command -v jq >/dev/null 2>&1; then
  # Try to log the attempted command (best-effort) without parsing JSON
  ATTEMPT_CMD="$(printf '%s' "$INPUT_JSON" | tr '\n' ' ' | sed -n 's/.*\"command\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p' | head -n1 || true)"
  TIMESTAMP="$(date --iso-8601=seconds 2>/dev/null || date +%s)"
  printf '%s\tUSER=%s\tPATTERN=%s\tCMD=%s\n' "$TIMESTAMP" "unknown" "jq_missing" "$ATTEMPT_CMD" >> "$LOG_FILE" 2>/dev/null || true
  # Emit deny JSON and exit
  jq -n --arg d "deny" --arg r "jq_not_installed: require jq for safe parsing" '{hookSpecificOutput: {permissionDecision: $d, permissionDecisionReason: $r}}'
  exit 0
fi

# Path to destructive regex file (if exists)
REGEX_FILE="$PROJECT_DIR/.claude/config/destructive-regex.txt"
COMBINED_FILE="$PROJECT_DIR/.claude/config/combined-destructive-regex.txt"

# Load combined regex from file if present, otherwise fall back to built-in DENY_REGEX
if [ -f "$COMBINED_FILE" ]; then
  DENY_REGEX="$(sed -n '1p' "$COMBINED_FILE")"
else
  DENY_REGEX='(rm\s+-rf|sudo\s+rm\s+-rf|git\s+push(\s+.*)?(--force|--force-with-lease|-f)|git\s+reset\s+--hard|git\s+clean\s+-fd|git\s+push\s+--mirror|git\s+push\s+--delete|chmod\s+-R\s+777\s+/|chown\s+-R|dd\s+if=|mkfs(\.|\s)|\bshutdown\b|\breboot\b|curl\s+\|\s*sh|wget\s+\|\s*sh|:\(\)\s*\{)'
fi

# Try to extract the command string using jq if available
extract_command() {
  local in="$1"
  local cmd=""
  # jq is guaranteed available here
  cmd="$(printf '%s' "$in" | jq -r '(.command // .tool_input.command // .toolInput.command // .input.command // .tool_input.tool_input.command // .input.command_string // .tool_input.cmd // .cmd // .input.cmd // (.args // [] | join(" ")) // "") | tostring' 2>/dev/null || true)"
  printf '%s' "$cmd"
}

CMD_STR="$(extract_command "$INPUT_JSON")"

# If empty, also try to extract from a nested `args` array (e.g., {"args": [...]}) or top-level string
if [ -z "${CMD_STR}" ]; then
  if command -v jq >/dev/null 2>&1; then
    CMD_STR="$(printf '%s' "$INPUT_JSON" | jq -r '( .args // .toolInput.args // .tool_input.args // .input.args // .params // [] ) | join(" ")' 2>/dev/null || true)"
    if [ -z "$CMD_STR" ]; then
      CMD_STR="$(printf '%s' "$INPUT_JSON" | jq -r '( .input // .tool_input // {} ) | if type=="string" then . else "" end' 2>/dev/null || true)"
    fi
  else
    # Best-effort: join any top-level array strings
    CMD_STR="$(printf '%s' "$INPUT_JSON" | tr '\n' ' ' | sed -n 's/.*\[\(.*\)\].*/\1/p' | sed 's/"//g' | tr ',' ' ' | xargs || true)"
  fi
fi

# Normalize whitespace
CMD_STR="$(printf '%s' "$CMD_STR" | tr -s '[:space:]' ' ' | sed 's/^ //;s/ $//')"

# Build patterns array from destructive-regex.txt (lines starting with non-#)
PATTERNS=()
if [ -f "$REGEX_FILE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    # skip comments and empty lines
    case "$line" in
      \#*|"") continue ;;
      *) PATTERNS+=("$line") ;;
    esac
  done < "$REGEX_FILE"
fi

# Case-insensitive matching; prefer PCRE via grep -P if available, otherwise use grep -E and transform pattern
MATCH=""
MATCHED_PATTERN=""
if [ -n "$CMD_STR" ]; then
  # First try combined regex if present
  if [ -n "$DENY_REGEX" ]; then
    if command -v grep >/dev/null 2>&1 && grep -Pqi -- "$DENY_REGEX" <<<"$CMD_STR" 2>/dev/null; then
      MATCHED_PATTERN="$DENY_REGEX"
      MATCH="$CMD_STR"
    elif command -v grep >/dev/null 2>&1 && grep -Eqi -- "$DENY_REGEX" <<<"$CMD_STR" 2>/dev/null; then
      MATCHED_PATTERN="$DENY_REGEX"
      MATCH="$CMD_STR"
    fi
  fi

  # If not matched by combined, check each individual pattern (use PCRE if possible)
  if [ -z "$MATCHED_PATTERN" ] && [ ${#PATTERNS[@]} -gt 0 ]; then
    for p in "${PATTERNS[@]}"; do
      # Skip comment lines
      case "$p" in
        \#*) continue ;;
      esac
      if command -v grep >/dev/null 2>&1 && grep -Pqi -- "$p" <<<"$CMD_STR" 2>/dev/null; then
        MATCHED_PATTERN="$p"
        MATCH="$CMD_STR"
        break
      elif command -v grep >/dev/null 2>&1 && grep -Eqi -- "$p" <<<"$CMD_STR" 2>/dev/null; then
        MATCHED_PATTERN="$p"
        MATCH="$CMD_STR"
        break
      fi
    done
  fi
fi

# Prepare JSON output function
output_json() {
  local decision="$1"
  local reason="$2"
  # Print hook-specific JSON to stdout for the PreToolUse hook consumer
  jq -n --arg d "$decision" --arg r "$reason" '{hookSpecificOutput: {permissionDecision: $d, permissionDecisionReason: $r}}'
}

TIMESTAMP="$(date --iso-8601=seconds 2>/dev/null || date +%s)"

if [ -n "$MATCHED_PATTERN" ]; then
  # Log blocked command for audit (append): timestamp, user (if available), full command, matched pattern
  # Try to get user from JSON if present
  USERNAME="unknown"
  if command -v jq >/dev/null 2>&1; then
    USERNAME="$(printf '%s' "$INPUT_JSON" | jq -r '(.user // .username // .actor // .requester // .metadata.user // "unknown") | tostring' 2>/dev/null || true)"
  fi
  printf '%s\tUSER=%s\tPATTERN=%s\tCMD=%s\n' "$TIMESTAMP" "$USERNAME" "$MATCHED_PATTERN" "$CMD_STR" >> "$LOG_FILE" 2>/dev/null || true

  # Output deny JSON
  output_json "deny" "Matched destructive pattern: $MATCHED_PATTERN"
  exit 0
else
  output_json "allow" "No destructive patterns matched"
  exit 0
fi
