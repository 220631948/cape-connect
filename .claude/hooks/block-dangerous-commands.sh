#!/bin/sh
# PreToolUse hook — block dangerous Bash commands (POSIX sh, no bash arrays)
# Invoked by Claude Code for every Bash tool call. Reads JSON from stdin.
# Returns { hookSpecificOutput: { permissionDecision: "deny"|"allow", ... } }
# Appends audit entries to .claude/security.log on deny.

# Re-exec under bash if available (arrays, pipefail, etc.)
if [ -z "$_HOOK_BASH_REEXEC" ]; then
  if command -v bash >/dev/null 2>&1; then
    export _HOOK_BASH_REEXEC=1
    exec bash "$0" "$@"
  fi
fi

set -u

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." 2>/dev/null && pwd)"
LOG_FILE="$PROJECT_DIR/.claude/security.log"
REGEX_FILE="$PROJECT_DIR/.claude/config/destructive-regex.txt"
COMBINED_FILE="$PROJECT_DIR/.claude/config/combined-destructive-regex.txt"

# ── Ensure log exists ─────────────────────────────────────────────────────────
mkdir -p "$PROJECT_DIR/.claude" 2>/dev/null || true
touch "$LOG_FILE" 2>/dev/null || true

# ── Read stdin ────────────────────────────────────────────────────────────────
INPUT_JSON="$(cat -)"

# ── JSON helpers ──────────────────────────────────────────────────────────────
deny_json() {
  local reason="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg r "$reason" \
      '{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":$r}}'
  else
    printf '{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' \
      "$(printf '%s' "$reason" | sed 's/"/\\"/g')"
  fi
}

allow_json() {
  printf '{"hookSpecificOutput":{"permissionDecision":"allow","permissionDecisionReason":"No destructive patterns matched"}}\n'
}

# ── jq check ─────────────────────────────────────────────────────────────────
if ! command -v jq >/dev/null 2>&1; then
  TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +%s)"
  CMD_ATTEMPT="$(printf '%s' "$INPUT_JSON" | tr '\n' ' ' | \
    sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -c 500)"
  printf '%s\tUSER=unknown\tPATTERN=jq_missing\tCMD=%s\n' \
    "$TIMESTAMP" "$CMD_ATTEMPT" >> "$LOG_FILE" 2>/dev/null || true
  deny_json "jq_not_installed: require jq for safe JSON parsing"
  exit 0
fi

# ── Extract command string via jq ─────────────────────────────────────────────
CMD_STR="$(printf '%s' "$INPUT_JSON" | jq -r '
  (.command
    // .tool_input.command
    // .toolInput.command
    // .input.command
    // .input.command_string
    // .tool_input.cmd
    // .cmd
    // (.args // [] | if type=="array" then join(" ") else "" end)
    // ""
  ) | if . == null then "" else . end
' 2>/dev/null || true)"

# Fallback: try nested args
if [ -z "${CMD_STR:-}" ]; then
  CMD_STR="$(printf '%s' "$INPUT_JSON" | jq -r '
    (.args // .toolInput.args // .tool_input.args // .input.args // [])
    | if type=="array" then join(" ") else "" end
  ' 2>/dev/null || true)"
fi

# Normalize whitespace
CMD_STR="$(printf '%s' "${CMD_STR:-}" | tr -s '[:space:]' ' ' | sed 's/^ //;s/ $//')"

# If still empty — nothing to match, allow
if [ -z "${CMD_STR:-}" ]; then
  allow_json
  exit 0
fi

# ── Load combined regex ───────────────────────────────────────────────────────
DENY_REGEX=""
if [ -f "$COMBINED_FILE" ]; then
  DENY_REGEX="$(head -n1 "$COMBINED_FILE" 2>/dev/null || true)"
fi

# Built-in fallback combined regex (PCRE-compatible)
if [ -z "${DENY_REGEX:-}" ]; then
  DENY_REGEX='(?i)(rm\s+-rf|rm\s+.*--no-preserve-root|sudo\s+rm\s+-rf|\bdd\b.*\bif=|\bdd\b.*\bof=/dev/|\bmkfs\b|>\s*/dev/|\bchmod\b.*-R.*(777|/\b)|\bchown\b.*-R|:\(\)\s*\{.*:\|:&|curl.*\|.*sh|wget.*\|.*sh|python3?\s+-c|\bnode\b\s+-e|\bperl\b\s+-e|\bruby\b\s+-e|\bbash\b\s+-c|\btruncate\b.*-s\s*0|\bkillall\b.*-9|\bpkill\b.*-9|\bgit\b.*push.*(--force|-f\b)|git\s+filter-repo|git\s+filter-branch|\bgit\b.*reset.*--hard|\bgit\b.*clean.*-f|\bdocker\b.*(rm|rmi).*-f|\bdocker\b.*system.*prune|\bkubectl\b.*(delete|drain).*--all|\baws\b.*s3.*rm.*--recursive|\b(apt-get|apt)\b.*(remove|purge).*-y|\b(yum|dnf)\b.*remove.*-y|\b(pip3?)\b.*uninstall.*-y|base64.*\|.*bash|\beval\b.*\$\(|\bsgdisk\b.*--zap-all)'
fi

# ── Match against combined regex ──────────────────────────────────────────────
MATCHED_PATTERN=""

try_match() {
  local pattern="$1"
  local cmd="$2"
  # Try PCRE (-P), fallback to ERE (-E)
  if printf '%s' "$cmd" | grep -Pqi -- "$pattern" 2>/dev/null; then
    return 0
  elif printf '%s' "$cmd" | grep -Eqi -- "$pattern" 2>/dev/null; then
    return 0
  fi
  return 1
}

if [ -n "${DENY_REGEX:-}" ] && try_match "$DENY_REGEX" "$CMD_STR"; then
  MATCHED_PATTERN="combined_regex"
fi

# ── Per-pattern matching from destructive-regex.txt ───────────────────────────
if [ -z "$MATCHED_PATTERN" ] && [ -f "$REGEX_FILE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip blank lines and comments
    case "$line" in
      ''|\#*) continue ;;
    esac
    if try_match "$line" "$CMD_STR"; then
      MATCHED_PATTERN="$line"
      break
    fi
  done < "$REGEX_FILE"
fi

# ── Output result ─────────────────────────────────────────────────────────────
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +%s)"

if [ -n "$MATCHED_PATTERN" ]; then
  # Extract username from JSON (best-effort)
  USERNAME="$(printf '%s' "$INPUT_JSON" | jq -r \
    '(.user // .username // .actor // .requester // .metadata.user // "unknown") | tostring' \
    2>/dev/null || printf 'unknown')"

  # Append to audit log: TSV — timestamp TAB user TAB pattern TAB command
  printf '%s\tUSER=%s\tPATTERN=%s\tCMD=%s\n' \
    "$TIMESTAMP" "${USERNAME:-unknown}" "$MATCHED_PATTERN" "$CMD_STR" \
    >> "$LOG_FILE" 2>/dev/null || true

  deny_json "Matched destructive pattern: $MATCHED_PATTERN"
  exit 0
fi

allow_json
exit 0
