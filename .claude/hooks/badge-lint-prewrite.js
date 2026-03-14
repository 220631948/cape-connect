'use strict';
// badge-lint-prewrite.js — PreToolUse hook for Write on src/components/**/*.tsx
// Warns when a component with data-fetch patterns lacks a SourceBadge.
// Always exits 0 (non-blocking). Output to stderr only.
// CLAUDE.md Rule 1 enforcement.

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) process.exit(0);

// Defence-in-depth: only check component files (shell pre-filters *.tsx already)
if (!filePath.match(/src\/components\/.*\.tsx$/)) process.exit(0);

let content;
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch {
  process.exit(0);
}

// Detect data-fetching patterns
const DATA_PATTERNS = /fetch\(|supabase\.[a-z]|useLiveData|useQuery|useSWR|getServerSideProps|fetchData/;
if (!DATA_PATTERNS.test(content)) process.exit(0);

// Check for SourceBadge import or inline badge pattern
const BADGE_PATTERNS = /import.*SourceBadge|SourceBadge|SOURCE.*YEAR|\[SOURCE|data-source-badge/i;
if (BADGE_PATTERNS.test(content)) process.exit(0);

// Show a path relative to cwd so the warning is actionable when route.ts names collide
const displayPath = path.relative(process.cwd(), filePath) || path.basename(filePath);
process.stderr.write(
  `⚠️  BADGE WARNING [Rule 1]: ${displayPath} has data-fetch pattern but no SourceBadge.\n` +
  `   Add <SourceBadge source="..." year={...} status="LIVE|CACHED|MOCK" /> before writing.\n` +
  `   Run /badge-audit for a full report. (Non-blocking — file will still be written)\n`
);

process.exit(0);
