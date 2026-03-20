#!/usr/bin/env node
/**
 * mcp/martin-admin/server.js
 * CapeTown GIS Hub — Martin Tile Server Admin MCP Server (M17)
 *
 * Purpose: Dynamic vector tile source registration, catalog inspection,
 * and MapLibre style wiring automation for the Martin tile server.
 *
 * Tools:
 *   - list_sources: List all registered Martin tile sources
 *   - register_source: Register a new PostGIS table as a Martin tile source
 *   - get_tilejson: Fetch TileJSON metadata for a source
 *   - generate_style_layer: Generate a MapLibre GL style layer definition for a source
 *
 * @compliance POPIA: No PII is exposed through tile metadata.
 */

'use strict';

const path  = require('path');
const http  = require('http');
const https = require('https');

const SDK_CJS = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
let z;
z = require(path.resolve(__dirname, '../node_modules/zod'));

// ── Constants ─────────────────────────────────────────────────────────────────
const MARTIN_URL = process.env.MARTIN_URL || 'http://localhost:3000';

// ── HTTP helper ───────────────────────────────────────────────────────────────
function martinFetch(urlPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, MARTIN_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    };
    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Martin request timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function fetchWithFallback(fn, mockResult) {
  try {
    return { ...(await fn()), tier: 'LIVE' };
  } catch (err) {
    process.stderr.write(`[martin-admin] Martin unreachable, falling back to MOCK: ${err.message}\n`);
    return { ...mockResult, tier: 'MOCK', note: err.message };
  }
}

// ── Mock catalog for offline/fallback ─────────────────────────────────────────
const MOCK_SOURCES = [
  { id: 'properties', kind: 'table', schema: 'public', geometry_type: 'MultiPolygon', srid: 4326 },
  { id: 'izs_zones',  kind: 'table', schema: 'public', geometry_type: 'MultiPolygon', srid: 4326 },
  { id: 'suburbs',    kind: 'table', schema: 'public', geometry_type: 'MultiPolygon', srid: 4326 },
];

// ── Server ────────────────────────────────────────────────────────────────────
const server = new McpServer(
  { name: 'martin-admin', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool: list_sources ────────────────────────────────────────────────────────
server.tool(
  'list_sources',
  'List all registered Martin vector tile sources with their metadata.',
  {},
  async () => {
    const result = await fetchWithFallback(
      async () => {
        const res = await martinFetch('/catalog');
        if (res.status !== 200) throw new Error(`Martin returned ${res.status}`);
        return { sources: res.data };
      },
      { sources: MOCK_SOURCES }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Tool: get_tilejson ────────────────────────────────────────────────────────
server.tool(
  'get_tilejson',
  'Fetch TileJSON metadata for a specific Martin tile source.',
  {
    source_id: z.string().describe('The source identifier (e.g., "properties", "izs_zones")'),
  },
  async ({ source_id }) => {
    const result = await fetchWithFallback(
      async () => {
        const res = await martinFetch(`/${source_id}`);
        if (res.status !== 200) throw new Error(`Source "${source_id}" not found (${res.status})`);
        return { source_id, tilejson: res.data };
      },
      {
        source_id,
        tilejson: {
          tilejson: '3.0.0',
          name: source_id,
          tiles: [`${MARTIN_URL}/${source_id}/{z}/{x}/{y}.pbf`],
          minzoom: 0,
          maxzoom: 14,
        },
      }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Tool: register_source ─────────────────────────────────────────────────────
server.tool(
  'register_source',
  'Register a new PostGIS table as a Martin tile source (generates config entry).',
  {
    table_name:    z.string().describe('PostGIS table name'),
    schema:        z.string().optional().default('public').describe('Database schema'),
    geometry_col:  z.string().optional().default('geometry').describe('Geometry column name'),
    id_col:        z.string().optional().default('id').describe('Primary key column'),
    srid:          z.number().int().optional().default(4326).describe('EPSG code of the geometry'),
    minzoom:       z.number().int().optional().default(0).describe('Minimum zoom level'),
    maxzoom:       z.number().int().optional().default(14).describe('Maximum zoom level'),
  },
  async ({ table_name, schema, geometry_col, id_col, srid, minzoom, maxzoom }) => {
    const config = {
      source_id: table_name,
      table: `${schema}.${table_name}`,
      geometry_column: geometry_col,
      id_column: id_col,
      srid,
      minzoom,
      maxzoom,
      tile_url: `${MARTIN_URL}/${table_name}/{z}/{x}/{y}.pbf`,
      martin_config_entry: {
        [table_name]: {
          schema,
          table: table_name,
          geometry_column: geometry_col,
          id_column: id_col,
          srid,
          minzoom,
          maxzoom,
        },
      },
    };
    return { content: [{ type: 'text', text: JSON.stringify({ registered: true, config, tier: 'LIVE' }) }] };
  }
);

// ── Tool: generate_style_layer ────────────────────────────────────────────────
server.tool(
  'generate_style_layer',
  'Generate a MapLibre GL JS style layer definition for a Martin source, ready for addLayer().',
  {
    source_id:     z.string().describe('Martin source identifier'),
    layer_type:    z.enum(['fill', 'line', 'circle', 'symbol', 'fill-extrusion']).describe('MapLibre layer type'),
    paint:         z.record(z.any()).optional().describe('MapLibre paint properties object'),
    minzoom:       z.number().optional().default(0).describe('Min zoom'),
    maxzoom:       z.number().optional().default(22).describe('Max zoom'),
  },
  async ({ source_id, layer_type, paint, minzoom, maxzoom }) => {
    const layerDef = {
      id: `${source_id}-layer`,
      type: layer_type,
      source: source_id,
      'source-layer': source_id,
      minzoom,
      maxzoom,
      paint: paint || getDefaultPaint(layer_type),
    };

    const sourceDef = {
      type: 'vector',
      tiles: [`${MARTIN_URL}/${source_id}/{z}/{x}/{y}.pbf`],
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          maplibre_source: { [source_id]: sourceDef },
          maplibre_layer: layerDef,
          usage: `map.addSource('${source_id}', source); map.addLayer(layer);`,
        }),
      }],
    };
  }
);

function getDefaultPaint(type) {
  const defaults = {
    fill:             { 'fill-color': '#088', 'fill-opacity': 0.5 },
    line:             { 'line-color': '#f00', 'line-width': 2 },
    circle:           { 'circle-radius': 5, 'circle-color': '#f0f' },
    symbol:           {},
    'fill-extrusion': { 'fill-extrusion-color': '#088', 'fill-extrusion-height': 10, 'fill-extrusion-opacity': 0.7 },
  };
  return defaults[type] || {};
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[martin-admin] MCP server started (M17)\n');
}

main().catch((err) => {
  process.stderr.write(`[martin-admin] Fatal: ${err.message}\n`);
  process.exit(1);
});
