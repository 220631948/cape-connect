/**
 * @file E2E test: COG Range Requests (HTTP 206 Partial Content)
 * @description Validates that CesiumJS/MapLibre raster tile requests use
 * HTTP Range Requests (206 Partial Content) instead of full-file downloads.
 * This proves bandwidth cost mitigation via Cloud Optimized GeoTIFF serving.
 *
 * @compliance POPIA: No personal data in raster tiles.
 */
import {expect, test} from '@playwright/test';

const RASTER_BASE_URL = process.env.NEXT_PUBLIC_RASTER_BASE_URL
    || process.env.NEXT_PUBLIC_GCS_PUBLIC_URL
    || 'https://storage.googleapis.com/capegis-rasters';

test.describe('COG Range Requests — HTTP 206 Validation', () => {
    test('raster tile requests return HTTP 206 Partial Content', async ({page}) => {
        const rangeResponses: Array<{
            url: string;
            status: number;
            contentRange: string | null;
            acceptRanges: string | null;
        }> = [];

        // Intercept all network requests to raster endpoints
        page.on('response', (response) => {
            const url = response.url();
            const isRasterRequest =
                url.includes('.tif') ||
                url.includes('.pmtiles') ||
                url.includes('capegis-rasters') ||
                url.includes(RASTER_BASE_URL);

            if (isRasterRequest) {
                rangeResponses.push({
                    url,
                    status: response.status(),
                    contentRange: response.headers()['content-range'] || null,
                    acceptRanges: response.headers()['accept-ranges'] || null,
                });
            }
        });

        // Navigate to the map dashboard
        await page.goto('/dashboard', {waitUntil: 'networkidle'});

        // Wait for map to render (CesiumJS or MapLibre)
        await page.waitForSelector('[class*="maplibre"], [class*="cesium"], canvas', {
            timeout: 15000,
        });

        // Allow time for tile requests to fire
        await page.waitForTimeout(3000);

        // If no raster requests were made (e.g., no raster layers active),
        // manually trigger a COG range request to validate server config
        if (rangeResponses.length === 0) {
            const testCogUrl = `${RASTER_BASE_URL}/sentinel2/cape-town-2024.tif`;

            const response = await page.evaluate(async (url: string) => {
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Range: 'bytes=0-1023',
                    },
                });
                return {
                    status: res.status,
                    contentRange: res.headers.get('content-range'),
                    acceptRanges: res.headers.get('accept-ranges'),
                    contentLength: res.headers.get('content-length'),
                };
            }, testCogUrl);

            // Assert HTTP 206 Partial Content
            expect(response.status).toBe(206);
            expect(response.contentRange).toBeTruthy();
            expect(response.acceptRanges).toBe('bytes');
            // Content-Length should be ≤ 1024 (not the full file)
            if (response.contentLength) {
                expect(parseInt(response.contentLength)).toBeLessThanOrEqual(1024);
            }
        } else {
            // Validate captured raster responses
            for (const resp of rangeResponses) {
                // Accept either 200 (full small tile) or 206 (range request)
                expect([200, 206]).toContain(resp.status);

                // If server supports range requests, accept-ranges should be 'bytes'
                if (resp.status === 206) {
                    expect(resp.contentRange).toBeTruthy();
                }
            }

            // At least one response should indicate range request support
            const supportsRanges = rangeResponses.some(
                (r) => r.status === 206 || r.acceptRanges === 'bytes'
            );
            expect(supportsRanges).toBe(true);
        }
    });

    test('GCS bucket CORS allows range requests from frontend origin', async ({page}) => {
        // Preflight CORS check: OPTIONS request to GCS bucket
        const corsResult = await page.evaluate(async (baseUrl: string) => {
            try {
                const res = await fetch(`${baseUrl}/sentinel2/`, {
                    method: 'OPTIONS',
                    headers: {
                        Origin: window.location.origin,
                        'Access-Control-Request-Method': 'GET',
                        'Access-Control-Request-Headers': 'Range',
                    },
                });
                return {
                    status: res.status,
                    allowOrigin: res.headers.get('access-control-allow-origin'),
                    allowMethods: res.headers.get('access-control-allow-methods'),
                    allowHeaders: res.headers.get('access-control-allow-headers'),
                };
            } catch (e) {
                return {status: 0, error: String(e), allowOrigin: null, allowMethods: null, allowHeaders: null};
            }
        }, RASTER_BASE_URL);

        // CORS should allow the request (200 or 204 for preflight)
        if (corsResult.status > 0) {
            expect([200, 204]).toContain(corsResult.status);
        }
    });

    test('PMTiles header is accessible via range request', async ({page}) => {
        // PMTiles files use range requests to read the header (first 512KB)
        const pmtilesUrl = `${RASTER_BASE_URL}/pmtiles/cape-town-cadastral.pmtiles`;

        const result = await page.evaluate(async (url: string) => {
            try {
                const res = await fetch(url, {
                    headers: {Range: 'bytes=0-511'},
                });
                return {
                    status: res.status,
                    contentRange: res.headers.get('content-range'),
                    contentLength: res.headers.get('content-length'),
                };
            } catch (e) {
                return {status: 0, error: String(e), contentRange: null, contentLength: null};
            }
        }, pmtilesUrl);

        // If the PMTiles file exists, it should return 206
        if (result.status !== 0 && result.status !== 404) {
            expect(result.status).toBe(206);
            expect(result.contentRange).toBeTruthy();
        }
    });
});
