/**
 * @file src/lib/sentinel-api.ts
 * @description Interfaces and functions for interacting with Copernicus Sentinel-2 API and STAC Catalogs.
 */

export interface SentinelSceneMetadata {
  id: string;
  date: string;
  cloudCover: number;
  tileUrl: string; // The XYZ or PMTiles URL for rendering
  ndviUrl?: string; // The XYZ or PMTiles URL for the NDVI layer
}

/**
 * Fetches the latest Sentinel-2 scene metadata for a given bounding box (Cape Town).
 * In a real implementation, this would query a STAC catalog (e.g. Earth Search)
 * or the Copernicus Open Access Hub.
 */
export async function fetchLatestSentinelScene(): Promise<SentinelSceneMetadata> {
  // TODO: Implement actual STAC/Copernicus API call here.
  // For now, simulating an API latency and returning mock/placeholder live data structure.

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'S2B_MSIL2A_20260315T083609_N0509_R064_T34HCU',
        date: '2026-03-15T08:36:09Z',
        cloudCover: 12.4,
        // Mock tile URLs that maplibre can use IF we had a real Martin/Titiler server running.
        // We will use a public endpoint for demonstration or fallback.
        tileUrl: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.jpg', // Placeholder satellite-like fallback
        ndviUrl: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.jpg'
      });
    }, 800);
  });
}
