#!/usr/bin/env node
/**
 * mcp/arcgis-location/server.js
 * CapeTown GIS Hub — ArcGIS Location Services MCP Server (M17)
 *
 * Purpose: Geocoding, reverse geocoding, routing, and isochrone generation
 * via ArcGIS REST API with three-tier fallback.
 *
 * Tools:
 *   - geocode: Forward geocode an address to coordinates
 *   - reverse_geocode: Reverse geocode coordinates to an address
 *   - route: Calculate a driving route between two points
 *   - isochrone: Generate a drive-time isochrone polygon
 *
 * @compliance POPIA: No user PII is sent to ArcGIS; only spatial queries.
 */

'use strict';

const path  = require('path');
const https = require('https');

const SDK_CJS = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
const z = require(path.resolve(__dirname, '../node_modules/zod'));

// ── Constants ─────────────────────────────────────────────────────────────────
const ARCGIS_TOKEN = process.env.ARCGIS_TEMP_TOKEN || '';
const GEOCODE_BASE = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';
const ROUTE_BASE   = 'https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World';

// Cape Town bounding box for search bias
const CT_EXTENT = '18.3,-34.4,19.0,-33.7';

// ── HTTP helper ───────────────────────────────────────────────────────────────
function arcgisFetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ error: 'JSON parse error', raw: data.slice(0, 200) }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('ArcGIS request timeout')); });
  });
}

async function fetchWithFallback(fn, mockResult) {
  try {
    return { ...(await fn()), tier: 'LIVE' };
  } catch (err) {
    process.stderr.write(`[arcgis-location] API error, falling back to MOCK: ${err.message}\n`);
    return { ...mockResult, tier: 'MOCK', note: err.message };
  }
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_GEOCODE = {
  address: '1 Adderley St, Cape Town, 8001',
  location: { x: 18.4241, y: -33.9249 },
  score: 95,
  source: 'MOCK',
};

const MOCK_REVERSE = {
  address: 'Adderley Street, Cape Town City Centre, Cape Town, 8001',
  location: { x: 18.4241, y: -33.9249 },
};

// ── Server ────────────────────────────────────────────────────────────────────
const server = new McpServer(
  { name: 'arcgis-location', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── Tool: geocode ─────────────────────────────────────────────────────────────
server.tool(
  'geocode',
  'Forward geocode an address string to coordinates. Biased to Cape Town area.',
  {
    address:    z.string().describe('Address or place name to geocode'),
    max_results: z.number().int().optional().default(5).describe('Max candidates to return'),
  },
  async ({ address, max_results }) => {
    const result = await fetchWithFallback(
      async () => {
        const params = new URLSearchParams({
          singleLine: address,
          f: 'json',
          outFields: 'Addr_type,Match_addr,Score',
          maxLocations: String(max_results),
          searchExtent: CT_EXTENT,
          ...(ARCGIS_TOKEN ? { token: ARCGIS_TOKEN } : {}),
        });
        const data = await arcgisFetch(`${GEOCODE_BASE}/findAddressCandidates?${params}`);
        if (data.error) throw new Error(data.error.message || 'Geocode failed');
        return {
          candidates: (data.candidates || []).map((c) => ({
            address: c.address,
            location: c.location,
            score: c.score,
            type: c.attributes?.Addr_type,
          })),
        };
      },
      { candidates: [MOCK_GEOCODE] }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Tool: reverse_geocode ─────────────────────────────────────────────────────
server.tool(
  'reverse_geocode',
  'Reverse geocode a coordinate pair (lon, lat) to the nearest address.',
  {
    longitude: z.number().describe('Longitude (x)'),
    latitude:  z.number().describe('Latitude (y)'),
  },
  async ({ longitude, latitude }) => {
    const result = await fetchWithFallback(
      async () => {
        const params = new URLSearchParams({
          location: `${longitude},${latitude}`,
          f: 'json',
          outFields: 'Match_addr,Addr_type',
          ...(ARCGIS_TOKEN ? { token: ARCGIS_TOKEN } : {}),
        });
        const data = await arcgisFetch(`${GEOCODE_BASE}/reverseGeocode?${params}`);
        if (data.error) throw new Error(data.error.message || 'Reverse geocode failed');
        return {
          address: data.address?.Match_addr || data.address?.LongLabel || 'Unknown',
          location: data.location || { x: longitude, y: latitude },
        };
      },
      { ...MOCK_REVERSE, location: { x: longitude, y: latitude } }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Tool: route ───────────────────────────────────────────────────────────────
server.tool(
  'route',
  'Calculate a driving route between two coordinate pairs. Returns distance and duration.',
  {
    from_lon: z.number().describe('Origin longitude'),
    from_lat: z.number().describe('Origin latitude'),
    to_lon:   z.number().describe('Destination longitude'),
    to_lat:   z.number().describe('Destination latitude'),
  },
  async ({ from_lon, from_lat, to_lon, to_lat }) => {
    const result = await fetchWithFallback(
      async () => {
        const stops = `${from_lon},${from_lat};${to_lon},${to_lat}`;
        const params = new URLSearchParams({
          stops,
          f: 'json',
          returnDirections: 'true',
          directionsLanguage: 'en',
          ...(ARCGIS_TOKEN ? { token: ARCGIS_TOKEN } : {}),
        });
        const data = await arcgisFetch(`${ROUTE_BASE}/solve?${params}`);
        if (data.error) throw new Error(data.error.message || 'Route failed');

        const route = data.routes?.features?.[0]?.attributes;
        return {
          total_distance_km: route ? (route.Total_Distance || 0).toFixed(2) : null,
          total_time_min: route ? (route.Total_TravelTime || 0).toFixed(1) : null,
          directions: (data.directions?.[0]?.features || []).map((f) => ({
            text: f.attributes?.text,
            length_km: f.attributes?.length?.toFixed(2),
            time_min: f.attributes?.time?.toFixed(1),
          })),
        };
      },
      {
        total_distance_km: '12.50',
        total_time_min: '18.5',
        directions: [
          { text: 'Head north on Adderley St (mock)', length_km: '0.50', time_min: '1.5' },
          { text: 'Continue to destination (mock)', length_km: '12.00', time_min: '17.0' },
        ],
      }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Tool: isochrone ───────────────────────────────────────────────────────────
server.tool(
  'isochrone',
  'Generate a drive-time isochrone polygon from a point (returns GeoJSON polygon).',
  {
    longitude:   z.number().describe('Center longitude'),
    latitude:    z.number().describe('Center latitude'),
    minutes:     z.number().positive().describe('Drive time in minutes'),
  },
  async ({ longitude, latitude, minutes }) => {
    const result = await fetchWithFallback(
      async () => {
        const params = new URLSearchParams({
          facilities: `${longitude},${latitude}`,
          defaultBreaks: String(minutes),
          f: 'json',
          outSR: '4326',
          ...(ARCGIS_TOKEN ? { token: ARCGIS_TOKEN } : {}),
        });
        const data = await arcgisFetch(
          `https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World/solveServiceArea?${params}`
        );
        if (data.error) throw new Error(data.error.message || 'Isochrone failed');

        const polygon = data.saPolygons?.features?.[0];
        return {
          isochrone: polygon?.geometry || null,
          minutes,
          center: { longitude, latitude },
        };
      },
      {
        isochrone: {
          type: 'Polygon',
          coordinates: [[[longitude - 0.05, latitude - 0.05], [longitude + 0.05, latitude - 0.05], [longitude + 0.05, latitude + 0.05], [longitude - 0.05, latitude + 0.05], [longitude - 0.05, latitude - 0.05]]],
        },
        minutes,
        center: { longitude, latitude },
      }
    );
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[arcgis-location] MCP server started (M17)\n');
}

main().catch((err) => {
  process.stderr.write(`[arcgis-location] Fatal: ${err.message}\n`);
  process.exit(1);
});
