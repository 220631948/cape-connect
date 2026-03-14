#!/usr/bin/env node
/**
 * .gemini/extensions/gemini-deep-research/scripts/start.cjs
 * CapeTown GIS Hub — Gemini Deep Research MCP Start Shim
 *
 * This CJS shim is required by all MCP config files that reference
 * `.gemini/extensions/gemini-deep-research/scripts/start.cjs`.
 * It delegates to the compiled dist/index.js entry point.
 *
 * Required env: GEMINI_API_KEY
 */

'use strict';

const path = require('path');

// The actual server is compiled to dist/index.js (ESM)
const distEntry = path.resolve(__dirname, '../dist/index.js');

// Use dynamic import to load the ESM module from this CJS shim
import(distEntry).catch((err) => {
  process.stderr.write(`[gemini-deep-research] Fatal startup error: ${err.message}\n`);
  process.stderr.write(`[gemini-deep-research] Stack: ${err.stack}\n`);
  process.exit(1);
});
