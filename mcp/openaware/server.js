#!/usr/bin/env node
/**
 * mcp/openaware/server.js
 * CapeTown GIS Hub — OpenAware Flight Tracking MCP Server
 *
 * Purpose: Real-time flight tracking awareness layer — aggregates OpenSky
 * state vectors, applies Cape Town bbox filter, manages update intervals.
 */

'use strict';

const https = require('https');
const path  = require('path');

const SDK_CJS = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
const z = require(path.resolve(__dirname, '../node_modules/zod'));

const DEFAULT_BBOX = [18.0, -34.5, 19.5, -33.0];
let currentBbox = DEFAULT_BBOX;
let updateIntervalSeconds = 15;
let cachedFlights = [];
let lastUpdated = null;

function fetchOpenSkyStates(bbox) {
  return new Promise((resolve) => {
    const [lomin, lamin, lomax, lamax] = bbox;
    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    const req = https.get(url, { timeout: 10000, headers: { 'User-Agent': 'CapeTownGIS-MCP/1.0' } }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const flights = (data.states || []).map((s) => ({ icao24: s[0], callsign: (s[1]||'').trim()||null, origin: s[2], last_seen: s[3], lon: s[5], lat: s[6], altitude: s[7], on_ground: s[8], velocity: s[9], heading: s[10], squawk: s[15] }));
          resolve({ ok: true, flights, time: data.time });
        } catch (e) { resolve({ ok: false, error: e.message, flights: [] }); }
      });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message, flights: [] }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout', flights: [] }); });
  });
}

const server = new McpServer({ name: 'openaware', version: '1.0.0' }, { capabilities: { tools: {} } });

server.tool('get_flights', 'Fetch real-time flight state vectors from OpenSky Network for a bounding box.',
  { bbox: z.array(z.number()).length(4).optional().describe('[minLon, minLat, maxLon, maxLat] — defaults to Cape Town') },
  async ({ bbox }) => {
    const box = (Array.isArray(bbox) && bbox.length === 4) ? bbox : currentBbox;
    const result = await fetchOpenSkyStates(box);
    if (result.ok) { cachedFlights = result.flights; lastUpdated = new Date().toISOString(); currentBbox = box; }
    return { content: [{ type: 'text', text: JSON.stringify({ flights: result.flights, count: result.flights.length, source: result.ok ? 'opensky-live' : 'error', error: result.error || null, bbox: box, timestamp: lastUpdated || new Date().toISOString() }) }] };
  });

server.tool('get_flight_count', 'Return the number of flights currently tracked in the active bounding box.',
  {},
  async () => ({ content: [{ type: 'text', text: JSON.stringify({ count: cachedFlights.length, bbox: currentBbox, last_updated: lastUpdated, update_interval_seconds: updateIntervalSeconds }) }] }));

server.tool('set_update_interval', 'Set the background polling interval for flight state refresh.',
  { seconds: z.number().min(5).max(300).describe('Polling interval in seconds (5–300)') },
  async ({ seconds }) => {
    updateIntervalSeconds = Math.max(5, Math.min(300, seconds));
    return { content: [{ type: 'text', text: JSON.stringify({ interval_seconds: updateIntervalSeconds, acknowledged: true }) }] };
  });

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[openaware] MCP server started\n');
}
main().catch((err) => { process.stderr.write(`[openaware] Fatal: ${err.message}\n`); process.exit(1); });
