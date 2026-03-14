#!/usr/bin/env node
/**
 * mcp/cesium/server.js
 * CapeTown GIS Hub — CesiumJS Tile Validation MCP Server
 *
 * Purpose: CesiumJS 3D tile management — tileset validation, camera bounds
 * configuration, bounding volume checking, 3D Tiles 1.1 schema validation.
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const SDK_CJS = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
const z = require(path.resolve(__dirname, '../node_modules/zod'));

const CAPE_TOWN_BBOX = { minLng: 18.0, maxLng: 19.5, minLat: -34.5, maxLat: -33.0 };

function validateTileset(tilesetPath) {
  if (!fs.existsSync(tilesetPath)) return { valid: false, errors: [`File not found: ${tilesetPath}`] };
  let data;
  try { data = JSON.parse(fs.readFileSync(tilesetPath, 'utf8')); }
  catch (e) { return { valid: false, errors: [`JSON parse error: ${e.message}`] }; }

  const errors = [];
  const version = data.asset?.version;
  if (!data.asset) errors.push('Missing "asset" object');
  if (version && !['0.0','1.0','1.1'].includes(version)) errors.push(`Unexpected version: ${version}`);
  if (data.geometricError === undefined) errors.push('Missing root "geometricError"');
  if (!data.root) errors.push('Missing "root" tile');
  if (data.root && !data.root.boundingVolume) errors.push('Root tile missing "boundingVolume"');
  if (data.root?.boundingVolume) {
    const bv = data.root.boundingVolume;
    if (!bv.region && !bv.box && !bv.sphere) errors.push('Root boundingVolume must have region, box, or sphere');
  }
  return { valid: errors.length === 0, version: version || null, root_present: !!data.root, has_schema: !!data.schema, errors, path: tilesetPath };
}

function checkCameraBounds(lng, lat, zoom) {
  const ln = parseFloat(lng), la = parseFloat(lat), z2 = parseFloat(zoom);
  const in_cape_town_bounds = ln >= CAPE_TOWN_BBOX.minLng && ln <= CAPE_TOWN_BBOX.maxLng && la >= CAPE_TOWN_BBOX.minLat && la <= CAPE_TOWN_BBOX.maxLat;
  const suggested_height_m = Math.round(591657550 / Math.pow(2, z2));
  return { in_cape_town_bounds, bbox_check: { lng: ln, lat: la, bbox: CAPE_TOWN_BBOX }, suggested_height: `${suggested_height_m}m`, cesium_camera: { position: { longitude: ln, latitude: la, height: suggested_height_m } } };
}

async function checkBoundingVolume(tilesetUrl) {
  return new Promise((resolve) => {
    if (!tilesetUrl.startsWith('http')) {
      try {
        const data = JSON.parse(fs.readFileSync(tilesetUrl, 'utf8'));
        const bv = data?.root?.boundingVolume;
        if (!bv) { resolve({ valid: false, error: 'No root.boundingVolume' }); return; }
        const type = bv.region ? 'region' : bv.box ? 'box' : bv.sphere ? 'sphere' : 'unknown';
        resolve({ valid: type !== 'unknown', type, [type]: bv[type], url: tilesetUrl });
      } catch (e) { resolve({ valid: false, error: e.message }); }
      return;
    }
    const lib = tilesetUrl.startsWith('https') ? https : http;
    let body = '';
    const req = lib.get(tilesetUrl, { timeout: 8000 }, (res) => {
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const bv = data?.root?.boundingVolume;
          if (!bv) { resolve({ valid: false, error: 'No root.boundingVolume' }); return; }
          const type = bv.region ? 'region' : bv.box ? 'box' : bv.sphere ? 'sphere' : 'unknown';
          resolve({ valid: type !== 'unknown', type, [type]: bv[type], url: tilesetUrl });
        } catch (e) { resolve({ valid: false, error: e.message }); }
      });
    });
    req.on('error', (e) => resolve({ valid: false, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ valid: false, error: 'timeout' }); });
  });
}

const server = new McpServer({ name: 'cesium', version: '1.0.0' }, { capabilities: { tools: {} } });

server.tool('validate_tileset', 'Validate a 3D Tiles tileset.json against 3D Tiles 1.0/1.1 spec.',
  { path: z.string().describe('Local path to tileset.json') },
  async ({ path: p }) => ({ content: [{ type: 'text', text: JSON.stringify(validateTileset(p)) }] }));

server.tool('check_camera_bounds', 'Check if lng/lat/zoom is within Cape Town bounds and compute Cesium camera height.',
  { lng: z.number().describe('Longitude WGS84'), lat: z.number().describe('Latitude WGS84'), zoom: z.number().describe('Web map zoom level 0-22') },
  async ({ lng, lat, zoom }) => ({ content: [{ type: 'text', text: JSON.stringify(checkCameraBounds(lng, lat, zoom)) }] }));

server.tool('check_bounding_volume', 'Fetch or read a tileset and report its root bounding volume type and values.',
  { tileset_url: z.string().describe('URL or local path to tileset.json') },
  async ({ tileset_url }) => ({ content: [{ type: 'text', text: JSON.stringify(await checkBoundingVolume(tileset_url)) }] }));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[cesium] MCP server started\n');
}
main().catch((err) => { process.stderr.write(`[cesium] Fatal: ${err.message}\n`); process.exit(1); });
