'use strict';
// fallback-verify-postwrite.js — PostToolUse hook for Write on src/app/api/**/*.ts
// Checks three-tier fallback pattern (LIVE → CACHED → MOCK) in API routes.
// Always exits 0 (non-blocking). Output to stderr only.
// CLAUDE.md Rule 2 enforcement.

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) process.exit(0);

// Defence-in-depth: only check API route files (shell pre-filters already)
if (!filePath.match(/src\/app\/api\/.*\.ts$/)) process.exit(0);

let content;
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch {
  process.exit(0);
}

const missing = [];

// Tier 1 — LIVE: external fetch or direct Supabase query
const HAS_LIVE = /fetch\(|supabase\.(from|rpc)|axios\.|got\(|http\.get/i.test(content);
if (!HAS_LIVE) missing.push('LIVE (external fetch / Supabase query)');

// Tier 2 — CACHED: api_cache table read (getCachedResponse is the real export name)
const HAS_CACHED = /api_cache|getCachedResponse|getCached|cachedData|cache\.get/i.test(content);
if (!HAS_CACHED) missing.push('CACHED (api_cache table)');

// Tier 3 — MOCK: public/mock/ fallback file reference
const HAS_MOCK = /public\/mock|mock\/.*\.geojson|readMockFile|MOCK_DATA/i.test(content);
if (!HAS_MOCK) missing.push('MOCK (public/mock/*.geojson)');

if (missing.length === 0) process.exit(0);

// >=2 missing tiers = FAIL; 1 missing = PARTIAL
const status = missing.length >= 2 ? 'FAIL' : 'PARTIAL';
// Show relative path — Next.js API routes are all named route.ts so basename is ambiguous
const displayPath = path.relative(process.cwd(), filePath) || path.basename(filePath);
process.stderr.write(
  `⚠️  FALLBACK ${status} [Rule 2]: ${displayPath}\n` +
  `   Missing tiers: ${missing.join(', ')}\n` +
  `   All API routes need LIVE → CACHED → MOCK fallback. Run /fallback-check.\n` +
  `   (Non-blocking — file has been written)\n`
);

process.exit(0);
