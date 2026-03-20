#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
  });
}

function collectPaths(value, found = new Set()) {
  if (!value) {
    return found;
  }
  if (typeof value === 'string') {
    if (/^(docs|\.claude|\.gemini|\.github)\//.test(value)) {
      found.add(value.replace(/\\/g, '/'));
    }
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectPaths(item, found));
    return found;
  }
  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (/(^path$|file|target|destination|cwd)/i.test(key)) {
        collectPaths(item, found);
      } else if (typeof item === 'object') {
        collectPaths(item, found);
      }
    }
  }
  return found;
}

async function main() {
  const raw = await readStdin();
  if (!raw) {
    console.log(JSON.stringify({ status: 'ignored' }));
    return;
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    console.log(JSON.stringify({ status: 'ignored' }));
    return;
  }

  if (event.type !== 'AfterTool' || !event.success) {
    console.log(JSON.stringify({ status: 'ignored' }));
    return;
  }

  const changed = [...collectPaths(event.args)].filter(
    (item) => !/(^|\/)(INDEX\.md|CHANGELOG_AUTO\.md)$/.test(item),
  );

  if (!changed.length) {
    console.log(JSON.stringify({ status: 'ignored' }));
    return;
  }

  const repoRoot = process.cwd();
  const scriptPath = path.join(repoRoot, 'scripts', 'sync_doc_indexes.py');
  if (!fs.existsSync(scriptPath)) {
    console.log(JSON.stringify({ status: 'ignored' }));
    return;
  }

  const result = spawnSync(
    'python3',
    [scriptPath, ...changed.flatMap((item) => ['--changed', item])],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || 'doc index sync failed');
    process.exit(result.status || 1);
  }

  console.log(
    JSON.stringify({
      status: 'success',
      changed,
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
