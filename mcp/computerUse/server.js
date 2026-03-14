#!/usr/bin/env node
/**
 * mcp/computerUse/server.js
 * CapeTown GIS Hub — Desktop Automation MCP Server
 *
 * Purpose: Desktop UI automation for visual testing of the map interface.
 * Prefer chrome-devtools for most testing; use computerUse for full desktop
 * automation not covered by Chrome DevTools.
 */

'use strict';

const path   = require('path');
const fs     = require('fs');
const { execFile, spawnSync } = require('child_process');
const os     = require('os');

const SDK_CJS = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
const z = require(path.resolve(__dirname, '../node_modules/zod'));

const PLATFORM    = os.platform();
const HAS_XDOTOOL = PLATFORM === 'linux' && spawnSync('which', ['xdotool'], { timeout: 2000 }).status === 0;
const HAS_SCROT   = PLATFORM === 'linux' && spawnSync('which', ['scrot'],   { timeout: 2000 }).status === 0;
const HAS_IMPORT  = PLATFORM === 'linux' && spawnSync('which', ['import'],  { timeout: 2000 }).status === 0;

function takeScreenshot(outputPath) {
  return new Promise((resolve) => {
    const outPath = outputPath || path.join(os.tmpdir(), `screenshot-${Date.now()}.png`);
    if (PLATFORM === 'linux') {
      const tool = HAS_SCROT ? 'scrot' : HAS_IMPORT ? 'import' : null;
      if (!tool) { resolve({ error: 'No screenshot tool available. Install scrot or imagemagick.', path: null }); return; }
      const args = tool === 'scrot' ? [outPath] : ['-window', 'root', outPath];
      execFile(tool, args, { timeout: 8000 }, (err) => {
        if (err) { resolve({ error: err.message, path: null }); return; }
        resolve({ path: outPath, taken_at: new Date().toISOString(), platform: PLATFORM });
      });
    } else if (PLATFORM === 'darwin') {
      execFile('screencapture', ['-x', outPath], { timeout: 8000 }, (err) => {
        if (err) { resolve({ error: err.message, path: null }); return; }
        resolve({ path: outPath, taken_at: new Date().toISOString(), platform: PLATFORM });
      });
    } else {
      resolve({ error: `Screenshot not implemented for platform: ${PLATFORM}`, path: null });
    }
  });
}

function clickAt(x, y, button = 'left') {
  if (PLATFORM === 'linux' && HAS_XDOTOOL) {
    const btn = { left: '1', middle: '2', right: '3' }[button] || '1';
    const r = spawnSync('xdotool', ['mousemove', String(x), String(y), 'click', btn], { timeout: 5000 });
    return { clicked: r.status === 0, x, y, button, error: r.status !== 0 ? (r.stderr?.toString()||null) : null };
  }
  return { clicked: false, x, y, button, error: `xdotool not available on ${PLATFORM}` };
}

function typeText(text, delayMs = 50) {
  if (PLATFORM === 'linux' && HAS_XDOTOOL) {
    const start = Date.now();
    const r = spawnSync('xdotool', ['type', '--delay', String(delayMs), '--', text], { timeout: 30000 });
    return { typed: r.status === 0, chars: text.length, duration_ms: Date.now() - start, error: r.status !== 0 ? (r.stderr?.toString()||null) : null };
  }
  return { typed: false, chars: text.length, duration_ms: 0, error: `xdotool not available on ${PLATFORM}` };
}

function getScreenInfo() {
  if (PLATFORM === 'linux') {
    const r = spawnSync('xdpyinfo', [], { timeout: 3000 });
    if (r.status === 0) {
      const m = r.stdout?.toString().match(/dimensions:\s+(\d+)x(\d+)/);
      const w = m ? parseInt(m[1]) : null, h = m ? parseInt(m[2]) : null;
      return { platform: PLATFORM, width: w, height: h, displays: w ? [{ width: w, height: h, primary: true }] : [] };
    }
  }
  return { platform: PLATFORM, width: null, height: null, displays: [], note: 'xdpyinfo unavailable or no DISPLAY set' };
}

const server = new McpServer({ name: 'computerUse', version: '1.0.0' }, { capabilities: { tools: {} } });

server.tool('screenshot', 'Capture a screenshot of the desktop. Returns the saved file path.',
  { output_path: z.string().optional().describe('File path to save PNG (optional; defaults to temp dir)') },
  async ({ output_path }) => ({ content: [{ type: 'text', text: JSON.stringify(await takeScreenshot(output_path)) }] }));

server.tool('click', 'Click at screen coordinates. Requires xdotool on Linux.',
  { x: z.number().describe('X pixels from left'), y: z.number().describe('Y pixels from top'), button: z.enum(['left','right','middle']).optional().describe('Mouse button (default: left)') },
  async ({ x, y, button }) => ({ content: [{ type: 'text', text: JSON.stringify(clickAt(x, y, button)) }] }));

server.tool('type_text', 'Type text using keyboard automation. Requires xdotool on Linux.',
  { text: z.string().describe('Text to type'), delay_ms: z.number().optional().describe('Delay between keystrokes ms (default: 50)') },
  async ({ text, delay_ms }) => ({ content: [{ type: 'text', text: JSON.stringify(typeText(text, delay_ms)) }] }));

server.tool('get_screen_info', 'Get screen dimensions and display information.',
  {},
  async () => ({ content: [{ type: 'text', text: JSON.stringify(getScreenInfo()) }] }));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[computerUse] MCP server started\n');
}
main().catch((err) => { process.stderr.write(`[computerUse] Fatal: ${err.message}\n`); process.exit(1); });
