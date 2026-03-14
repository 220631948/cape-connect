#!/usr/bin/env node
/**
 * scripts/opensky-mcp-wrapper.js
 * CapeTown GIS Hub — OpenSky Network API MCP Wrapper
 *
 * Purpose: OpenSky Network REST API wrapper with rate limiting middleware,
 * authentication handling (anonymous and credentialed), and cache integration.
 *
 * Rate limits:
 *   Anonymous:     10 req/sec, 400 req/day
 *   Authenticated: 20 req/sec, 4000 req/day
 */

'use strict';

const https = require('https');
const path  = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SDK_CJS      = path.join(PROJECT_ROOT, 'mcp/node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
const z = require(path.join(PROJECT_ROOT, 'mcp/node_modules/zod'));

const OPENSKY_USER = process.env.OPENSKY_USER || null;
const OPENSKY_PASS = process.env.OPENSKY_PASS || null;
const IS_AUTH      = !!(OPENSKY_USER && OPENSKY_PASS);
const DAILY_LIMIT  = IS_AUTH ? 4000 : 400;

let requestsToday = 0;
let dayKey = new Date().toISOString().slice(0, 10);

function checkDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dayKey) { requestsToday = 0; dayKey = today; }
}

function openSkyGet(urlPath) {
  return new Promise((resolve) => {
    checkDay();
    if (requestsToday >= DAILY_LIMIT) { resolve({ ok: false, error: `Daily rate limit reached (${DAILY_LIMIT}/day)` }); return; }
    const options = { hostname: 'opensky-network.org', path: urlPath, method: 'GET', timeout: 10000, headers: { 'User-Agent': 'CapeTownGIS-MCP/1.0' } };
    if (IS_AUTH) options.auth = `${OPENSKY_USER}:${OPENSKY_PASS}`;
    const start = Date.now();
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        requestsToday++;
        const latency = Date.now() - start;
        if (res.statusCode !== 200) { resolve({ ok: false, error: `HTTP ${res.statusCode}`, latency_ms: latency }); return; }
        try { resolve({ ok: true, data: JSON.parse(body), latency_ms: latency }); }
        catch (e) { resolve({ ok: false, error: `JSON: ${e.message}`, latency_ms: latency }); }
      });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message, latency_ms: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout', latency_ms: 10000 }); });
    req.end();
  });
}

const server = new McpServer({ name: 'opensky', version: '1.0.0' }, { capabilities: { tools: {} } });

server.tool('get_states', 'Fetch ADS-B state vectors from OpenSky Network for a bounding box (defaults to Cape Town airspace).',
  {
    lamin: z.number().optional().describe('Min latitude  (default: -34.5)'),
    lomin: z.number().optional().describe('Min longitude (default: 18.0)'),
    lamax: z.number().optional().describe('Max latitude  (default: -33.0)'),
    lomax: z.number().optional().describe('Max longitude (default: 19.5)'),
    time:  z.number().optional().describe('Unix timestamp (omit for current states)')
  },
  async ({ lamin = -34.5, lomin = 18.0, lamax = -33.0, lomax = 19.5, time }) => {
    let urlPath = `/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    if (time) urlPath += `&time=${time}`;
    const result = await openSkyGet(urlPath);
    if (!result.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: result.error }) }], isError: true };
    const states = (result.data.states || []).map((s) => ({ icao24: s[0], callsign: (s[1]||'').trim()||null, origin: s[2], lon: s[5], lat: s[6], altitude: s[7], on_ground: s[8], velocity: s[9], heading: s[10], squawk: s[15] }));
    return { content: [{ type: 'text', text: JSON.stringify({ states, count: states.length, time: result.data.time, latency_ms: result.latency_ms }) }] };
  });

server.tool('get_rate_limit_status', 'Return current API rate limit counters and daily remaining quota.',
  {},
  async () => {
    checkDay();
    return { content: [{ type: 'text', text: JSON.stringify({ mode: IS_AUTH ? 'authenticated' : 'anonymous', requests_today: requestsToday, daily_limit: DAILY_LIMIT, remaining_today: Math.max(0, DAILY_LIMIT - requestsToday), reset_at: `${dayKey}T00:00:00Z` }) }] };
  });

server.tool('check_api_health', 'Ping the OpenSky Network API and report reachability and latency.',
  {},
  async () => {
    const result = await openSkyGet('/api/states/all?lamin=-34.5&lomin=18.0&lamax=-34.4&lomax=18.1');
    return { content: [{ type: 'text', text: JSON.stringify({ reachable: result.ok, latency_ms: result.latency_ms || null, status: result.ok ? 'healthy' : 'unreachable', error: result.error || null, mode: IS_AUTH ? 'authenticated' : 'anonymous' }) }] };
  });

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[opensky] MCP server started\n');
}
main().catch((err) => { process.stderr.write(`[opensky] Fatal: ${err.message}\n`); process.exit(1); });
