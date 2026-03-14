#!/usr/bin/env node
/**
 * mcp/doc-state/server.js
 * CapeTown GIS Hub — Distributed Doc-State MCP Server (P0)
 *
 * Purpose: Distributed document locking for multi-agent index synchronization.
 * Prevents concurrent write conflicts on INDEX.md and CHANGELOG_AUTO.md.
 *
 * Protocol: Acquire write lock → check hash → skip if current → write → release → notify
 */

'use strict';

const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

const SDK_CJS = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
const z = require(path.resolve(__dirname, '../node_modules/zod'));

// ── In-memory lock store ──────────────────────────────────────────────────────
const locks = new Map();

function generateLockId() {
  return `lock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { hash: crypto.createHash('sha256').update(content).digest('hex'), exists: true };
  } catch {
    return { hash: null, exists: false };
  }
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = new McpServer(
  { name: 'doc-state', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.tool(
  'acquire_lock',
  'Acquire an exclusive write lock on a file path. Returns lock_id on success.',
  { path: z.string().describe('File path to lock (relative to project root)') },
  async ({ path: filePath }) => {
    if (locks.has(filePath)) {
      const existing = locks.get(filePath);
      return { content: [{ type: 'text', text: JSON.stringify({ locked: false, lock_id: null, reason: 'already_locked', held_by: existing.lock_id }) }] };
    }
    const lock_id = generateLockId();
    locks.set(filePath, { lock_id, acquired_at: new Date().toISOString() });
    return { content: [{ type: 'text', text: JSON.stringify({ locked: true, lock_id, path: filePath }) }] };
  }
);

server.tool(
  'check_hash',
  'Return SHA-256 hash of the current file content to detect if it has changed.',
  { path: z.string().describe('File path to hash') },
  async ({ path: filePath }) => {
    const result = fileHash(filePath);
    return { content: [{ type: 'text', text: JSON.stringify({ path: filePath, ...result }) }] };
  }
);

server.tool(
  'release_lock',
  'Release a previously acquired lock. Must supply the matching lock_id.',
  {
    path:    z.string().describe('File path to unlock'),
    lock_id: z.string().describe('The lock_id returned by acquire_lock')
  },
  async ({ path: filePath, lock_id }) => {
    const held = locks.get(filePath);
    if (!held) return { content: [{ type: 'text', text: JSON.stringify({ released: false, reason: 'not_locked' }) }] };
    if (held.lock_id !== lock_id) return { content: [{ type: 'text', text: JSON.stringify({ released: false, reason: 'lock_id_mismatch' }) }] };
    locks.delete(filePath);
    return { content: [{ type: 'text', text: JSON.stringify({ released: true, path: filePath }) }] };
  }
);

server.tool(
  'get_lock_status',
  'Check whether a file is currently locked and who holds it.',
  { path: z.string().describe('File path to check') },
  async ({ path: filePath }) => {
    const held = locks.get(filePath);
    if (!held) return { content: [{ type: 'text', text: JSON.stringify({ locked: false, lock_id: null, acquired_at: null, path: filePath }) }] };
    return { content: [{ type: 'text', text: JSON.stringify({ locked: true, lock_id: held.lock_id, acquired_at: held.acquired_at, path: filePath }) }] };
  }
);

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[doc-state] MCP server started (P0)\n');
}

main().catch((err) => {
  process.stderr.write(`[doc-state] Fatal: ${err.message}\n`);
  process.exit(1);
});
