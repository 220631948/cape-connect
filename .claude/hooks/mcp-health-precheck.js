'use strict';
// mcp-health-precheck.js — PreToolUse hook for Task (all tasks)
// Checks P0/P1 MCP server paths as a proxy health check. Warns if unavailable.
// Always exits 0 (non-blocking). Completes in < 500ms. Output to stderr only.
// NOTE: existsSync is intentional — this is a file-presence proxy, not a liveness probe.

const fs = require('fs');
const path = require('path');

// Determine project root (two levels up from .claude/hooks/)
const projectRoot = path.resolve(__dirname, '..', '..');

// P0 custom MCP servers — ESCALATE if missing (see MCP_SERVERS.md P0 section)
const P0_SERVERS = [
  { name: 'doc-state', serverPath: path.join(projectRoot, 'mcp', 'doc-state', 'server.js') },
];

// P1 custom servers — warn only (all 5 non-doc-state custom servers)
const P1_SERVERS = [
  { name: 'openaware',   serverPath: path.join(projectRoot, 'mcp', 'openaware', 'server.js') },
  { name: 'cesium',      serverPath: path.join(projectRoot, 'mcp', 'cesium', 'server.js') },
  { name: 'formats',     serverPath: path.join(projectRoot, 'mcp', 'formats', 'server.js') },
  { name: 'computerUse', serverPath: path.join(projectRoot, 'mcp', 'computerUse', 'server.js') },
  { name: 'stitch',      serverPath: path.join(projectRoot, 'mcp', 'stitch', 'server.js') },
];

for (const server of P0_SERVERS) {
  if (!fs.existsSync(server.serverPath)) {
    process.stderr.write(
      `⚠️  MCP ESCALATE [P0]: ${server.name} not found at ${server.serverPath}\n` +
      `   P0 MCP servers must be available before agent tasks. Run /mcp-status.\n`
    );
  }
}

for (const server of P1_SERVERS) {
  if (!fs.existsSync(server.serverPath)) {
    process.stderr.write(
      `ℹ️  MCP WARN [P1]: ${server.name} not found at ${server.serverPath}\n`
    );
  }
}

process.exit(0);
