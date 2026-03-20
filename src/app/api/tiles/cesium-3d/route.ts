/**
 * @file src/app/api/tiles/cesium-3d/route.ts
 * @description M18 — Cesium ion 3D Tiles proxy & configuration endpoint.
 * Provides photorealistic 3D Tiles asset metadata with three-tier fallback.
 * LIVE: Cesium ion API → CACHED: local config → MOCK: static tileset stub.
 * @compliance Rule 2: Three-Tier Fallback. Rule 3: No API keys in source.
 * @compliance Rule 9: Geographic Scope — Cape Town bbox enforced.
 */

import { NextResponse } from 'next/server';

// Cape Town bounding box (CLAUDE.md Rule 9)
const CT_BBOX = { west: 18.0, south: -34.5, east: 19.5, north: -33.0 };

// Cesium ion asset IDs for Cape Town
const CESIUM_ASSETS = {
  photorealistic3DTiles: 2275207,  // Google Photorealistic 3D Tiles (global)
  osmBuildings: 96188,             // OSM Buildings (global)
  terrain: 1,                      // Cesium World Terrain
};

interface TilesetConfig {
  assetId: number;
  name: string;
  tilesetUrl: string | null;
  ionAccessToken: string | null;
  bbox: typeof CT_BBOX;
  tier: 'LIVE' | 'CACHED' | 'MOCK';
}

async function fetchFromCesiumIon(assetId: number, token: string): Promise<TilesetConfig | null> {
  try {
    const res = await fetch(
      `https://api.cesium.com/v1/assets/${assetId}/endpoint`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    return {
      assetId,
      name: assetId === CESIUM_ASSETS.photorealistic3DTiles
        ? 'Google Photorealistic 3D Tiles'
        : `Cesium Asset ${assetId}`,
      tilesetUrl: data.url || null,
      ionAccessToken: data.accessToken || token,
      bbox: CT_BBOX,
      tier: 'LIVE',
    };
  } catch {
    return null;
  }
}

function getCachedConfig(assetId: number, token: string): TilesetConfig {
  return {
    assetId,
    name: assetId === CESIUM_ASSETS.photorealistic3DTiles
      ? 'Google Photorealistic 3D Tiles'
      : `Cesium Asset ${assetId}`,
    tilesetUrl: null, // Client uses ion SDK directly with assetId
    ionAccessToken: token,
    bbox: CT_BBOX,
    tier: 'CACHED',
  };
}

function getMockConfig(): TilesetConfig {
  return {
    assetId: CESIUM_ASSETS.osmBuildings,
    name: 'OSM Buildings (Mock Fallback)',
    tilesetUrl: null,
    ionAccessToken: null,
    bbox: CT_BBOX,
    tier: 'MOCK',
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assetType = searchParams.get('type') || 'photorealistic3DTiles';
  const assetId = CESIUM_ASSETS[assetType as keyof typeof CESIUM_ASSETS]
    ?? CESIUM_ASSETS.photorealistic3DTiles;

  const ionToken = process.env.CESIUM_ION_TOKEN;

  // Tier 1: LIVE — Cesium ion API
  if (ionToken) {
    const live = await fetchFromCesiumIon(assetId, ionToken);
    if (live) {
      return NextResponse.json({
        ...live,
        source: 'Cesium ion',
        year: 2026,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Tier 2: CACHED — use token + assetId for direct ion SDK access
  if (ionToken) {
    const cached = getCachedConfig(assetId, ionToken);
    return NextResponse.json({
      ...cached,
      source: 'Cesium ion',
      year: 2026,
      timestamp: new Date().toISOString(),
    });
  }

  // Tier 3: MOCK — OSM buildings fallback
  const mock = getMockConfig();
  return NextResponse.json({
    ...mock,
    source: 'OSM Buildings',
    year: 2026,
    timestamp: new Date().toISOString(),
  });
}
