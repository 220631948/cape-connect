#!/usr/bin/env node
/**
 * mcp/formats/server.js
 * CapeTown GIS Hub — GIS Formats Validation MCP Server
 *
 * Purpose: GIS data format validation and conversion.
 * Shapefile integrity checks, GeoPackage table listing,
 * GeoJSON schema validation, CRS parsing from .prj files.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const SDK_CJS = path.resolve(__dirname, '../node_modules/@modelcontextprotocol/sdk/dist/cjs');
const { McpServer }            = require(path.join(SDK_CJS, 'server/mcp.js'));
const { StdioServerTransport } = require(path.join(SDK_CJS, 'server/stdio.js'));
const z = require(path.resolve(__dirname, '../node_modules/zod'));

// ── Shapefile helpers ─────────────────────────────────────────────────────────
const SHAPEFILE_REQUIRED_EXTS = ['.shp', '.dbf', '.shx'];
const SHAPEFILE_OPTIONAL_EXTS = ['.prj', '.cpg', '.sbn', '.sbx', '.xml'];

function validateShapefile(shpPath) {
  const base = shpPath.replace(/\.shp$/i, '');
  const errors = [];
  const files_present = {};

  for (const ext of SHAPEFILE_REQUIRED_EXTS) {
    const fp = base + ext;
    const exists = fs.existsSync(fp);
    files_present[ext] = exists;
    if (!exists) errors.push(`Missing required file: ${path.basename(fp)}`);
  }
  for (const ext of SHAPEFILE_OPTIONAL_EXTS) {
    files_present[ext] = fs.existsSync(base + ext);
  }

  if (fs.existsSync(shpPath)) {
    try {
      const fd = fs.openSync(shpPath, 'r');
      const header = Buffer.alloc(4);
      fs.readSync(fd, header, 0, 4, 0);
      fs.closeSync(fd);
      const fileCode = header.readUInt32BE(0);
      if (fileCode !== 9994) errors.push(`Invalid .shp file code: expected 9994, got ${fileCode}`);
    } catch (e) {
      errors.push(`Cannot read .shp file: ${e.message}`);
    }
  }

  return { valid: errors.length === 0, files_present, errors };
}

function listGpkgLayers(gpkgPath) {
  if (!fs.existsSync(gpkgPath)) return { error: `File not found: ${gpkgPath}`, layers: [], count: 0 };
  try {
    const fd = fs.openSync(gpkgPath, 'r');
    const magic = Buffer.alloc(16);
    fs.readSync(fd, magic, 0, 16, 0);
    fs.closeSync(fd);
    if (!magic.toString('utf8', 0, 15).startsWith('SQLite format 3')) {
      return { error: 'Not a valid SQLite/GeoPackage file', layers: [], count: 0 };
    }
  } catch (e) {
    return { error: `Cannot read GPKG: ${e.message}`, layers: [], count: 0 };
  }
  return { layers: [], count: 0, valid: true, note: 'File validated as SQLite/GPKG. Install better-sqlite3 for full layer listing.' };
}

const PRJ_EPSG_HINTS = [
  { pattern: /WGS.?84|WGS.?1984/i, epsg: 4326, authority: 'EPSG' },
  { pattern: /Hartebeesthoek/i,     epsg: 4148, authority: 'EPSG' },
  { pattern: /Lo19/i,              epsg: 22279, authority: 'EPSG' },
  { pattern: /Lo21/i,              epsg: 22281, authority: 'EPSG' },
  { pattern: /Lo33/i,              epsg: 22287, authority: 'EPSG' },
  { pattern: /Web_Mercator|Pseudo_Mercator/i, epsg: 3857, authority: 'EPSG' },
  { pattern: /UTM.*34S/i,          epsg: 32734, authority: 'EPSG' },
  { pattern: /UTM.*35S/i,          epsg: 32735, authority: 'EPSG' },
];

function parsePrj(prjPath) {
  if (!fs.existsSync(prjPath)) return { error: `File not found: ${prjPath}`, wkt: null, epsg_guess: null };
  const wkt = fs.readFileSync(prjPath, 'utf8').trim();
  let epsg_guess = null, authority = null;
  const authMatch = wkt.match(/AUTHORITY\["([^"]+)","([^"]+)"\]\s*\]?\s*$/);
  if (authMatch) { authority = authMatch[1]; epsg_guess = parseInt(authMatch[2], 10) || null; }
  else { for (const h of PRJ_EPSG_HINTS) { if (h.pattern.test(wkt)) { epsg_guess = h.epsg; authority = h.authority; break; } } }
  return { wkt, epsg_guess, authority, path: prjPath };
}

const VALID_GEOMETRY_TYPES = new Set(['Point','MultiPoint','LineString','MultiLineString','Polygon','MultiPolygon','GeometryCollection']);

function validateGeojson(geojsonPath) {
  if (!fs.existsSync(geojsonPath)) return { valid: false, errors: [`File not found: ${geojsonPath}`], feature_count: 0, geometry_types: [] };
  let data;
  try { data = JSON.parse(fs.readFileSync(geojsonPath, 'utf8')); }
  catch (e) { return { valid: false, errors: [`JSON parse error: ${e.message}`], feature_count: 0, geometry_types: [] }; }

  const errors = [], geomTypes = new Set();
  if (!data.type) errors.push('Missing "type"');
  const features = data.type === 'FeatureCollection' ? (data.features || []) : data.type === 'Feature' ? [data] : [];
  if (data.type === 'FeatureCollection' && !Array.isArray(data.features)) errors.push('"features" must be an array');

  for (let i = 0; i < Math.min(features.length, 100); i++) {
    const f = features[i];
    if (f.type !== 'Feature') errors.push(`Feature[${i}].type must be "Feature"`);
    if (!f.geometry) { errors.push(`Feature[${i}] null geometry`); continue; }
    if (!VALID_GEOMETRY_TYPES.has(f.geometry.type)) errors.push(`Feature[${i}] unknown type: ${f.geometry.type}`);
    else geomTypes.add(f.geometry.type);
  }
  return { valid: errors.length === 0, feature_count: features.length, geometry_types: Array.from(geomTypes), errors, path: geojsonPath };
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = new McpServer({ name: 'formats', version: '1.0.0' }, { capabilities: { tools: {} } });

server.tool('validate_shapefile', 'Validate a Shapefile set: check required files (.shp/.dbf/.shx) and magic bytes.',
  { path: z.string().describe('Path to the .shp file') },
  async ({ path: p }) => ({ content: [{ type: 'text', text: JSON.stringify(validateShapefile(p)) }] }));

server.tool('list_gpkg_layers', 'List all layers in a GeoPackage (.gpkg) file.',
  { path: z.string().describe('Path to the .gpkg file') },
  async ({ path: p }) => ({ content: [{ type: 'text', text: JSON.stringify(listGpkgLayers(p)) }] }));

server.tool('parse_prj', 'Parse a .prj file and identify the EPSG code from the WKT CRS string.',
  { path: z.string().describe('Path to the .prj file') },
  async ({ path: p }) => ({ content: [{ type: 'text', text: JSON.stringify(parsePrj(p)) }] }));

server.tool('validate_geojson', 'Validate a GeoJSON file: structure, feature count, geometry types.',
  { path: z.string().describe('Path to the .geojson or .json file') },
  async ({ path: p }) => ({ content: [{ type: 'text', text: JSON.stringify(validateGeojson(p)) }] }));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[formats] MCP server started\n');
}
main().catch((err) => { process.stderr.write(`[formats] Fatal: ${err.message}\n`); process.exit(1); });
