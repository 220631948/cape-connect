"use strict";
// filesize-guard.js — PostToolUse hook for Write on src/**/*.ts and src/**/*.tsx
// Warns when a source file exceeds the 300-line limit (CLAUDE.md Rule 7).
// Always exits 0 (non-blocking). Output to stderr only.

const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];
// Use isNaN guard so explicit 0 isn't swallowed by the || falsy check
const rawThreshold = parseInt(process.argv[3], 10);
const threshold = !isNaN(rawThreshold) ? rawThreshold : 300;

if (!filePath) process.exit(0);

// Exempt: migrations, tests, spec files, markdown, seeds, .claude/, docs/
const EXEMPT_PATTERNS = [
  /migrations\//,
  /__tests__\//,
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /\.md$/,
  /supabase\/seeds\//,
  /\.claude\//,
  /docs\//,
];

if (EXEMPT_PATTERNS.some((p) => p.test(filePath))) process.exit(0);

let content;
try {
  content = fs.readFileSync(filePath, "utf8");
} catch {
  process.exit(0);
}

// Count \n occurrences — avoids allocating a throw-away string[] from split('\n').
// A file with N lines has N-1 newlines if no trailing newline, or N if it does.
// We add 1 to get line count regardless of trailing newline presence.
const lineCount = (content.match(/\n/g) ?? []).length + 1;

if (lineCount > threshold) {
  const displayPath =
    path.relative(process.cwd(), filePath) || path.basename(filePath);
  process.stderr.write(
    `⚠️  RULE 7 [File Size]: ${displayPath} has ${lineCount} lines (max ${threshold}).\n` +
      `   Split into smaller modules. Planning docs and migrations are exempt.\n` +
      `   CLAUDE.md Rule 7: Source files ≤ ${threshold} lines.\n` +
      `   (Non-blocking — file has been written)\n`,
  );
}

process.exit(0);
