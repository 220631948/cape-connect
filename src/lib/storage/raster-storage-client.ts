/**
 * @file src/lib/storage/raster-storage-client.ts
 * @description GCS-backed raster storage client — drop-in replacement for supabase.storage calls.
 *
 * Provides upload (via signed URL), download (via signed URL), and direct COG
 * range-read URLs for MapLibre/CesiumJS tile consumption.
 *
 * POPIA: Raster data (satellite imagery, DEM) is non-personal.
 * Region: africa-south1 (POPIA compliant). See infra/gcp/main.tf.
 *
 * @compliance POPIA risk level: LOW — no personal data in raster files.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UploadOptions {
    /** MIME content type (default: application/octet-stream) */
    contentType?: string;
    /** Custom metadata key-value pairs */
    metadata?: Record<string, string>;
    /** Cache-Control header value */
    cacheControl?: string;
}

export interface RasterStorageClient {
    /**
     * Upload a file to GCS raster bucket.
     * Uses a backend-generated signed URL for direct browser upload.
     */
    upload(path: string, file: File, options?: UploadOptions): Promise<{ url: string }>;

    /**
     * Get a time-limited signed URL for downloading a raster file.
     */
    getSignedUrl(path: string, expiresIn: number): Promise<string>;

    /**
     * Get the direct public URL for COG range requests.
     * No authentication needed — bucket has public read access.
     * Supports HTTP Range headers for efficient tile streaming.
     */
    getCOGUrl(path: string): string;

    /**
     * Delete a raster file from GCS.
     */
    delete(path: string): Promise<boolean>;
}

// ─── Configuration ───────────────────────────────────────────────────────────

const GCS_BUCKET = process.env.NEXT_PUBLIC_GCS_BUCKET ?? 'capegis-rasters';
const GCS_PUBLIC_BASE = `https://storage.googleapis.com/${GCS_BUCKET}`;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Create a GCS-backed raster storage client.
 *
 * Upload flow:
 *   1. Frontend requests a signed upload URL from the backend API
 *   2. Frontend uploads directly to GCS using the signed URL (no proxy)
 *   3. GCS Eventarc triggers Cloud Run for COG conversion + STAC indexing
 *
 * Read flow:
 *   - COG tiles: direct public URL with HTTP Range headers (getCOGUrl)
 *   - Private files: signed URL with expiry (getSignedUrl)
 */
export function createRasterStorageClient(): RasterStorageClient {
    return {
        async upload(
            path: string,
            file: File,
            options?: UploadOptions
        ): Promise<{ url: string }> {
            // Step 1: Request a signed upload URL from the backend
            const response = await fetch(`${API_BASE}/raster/upload-url`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    path,
                    contentType: (options?.contentType ?? file.type) || 'application/octet-stream',
                    metadata: options?.metadata,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to get upload URL: ${response.status} ${response.statusText}`);
            }

            const {signedUrl} = (await response.json()) as { signedUrl: string };

            // Step 2: Upload directly to GCS
            const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': (options?.contentType ?? file.type) || 'application/octet-stream',
                    ...(options?.cacheControl ? {'Cache-Control': options.cacheControl} : {}),
                },
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error(`GCS upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
            }

            return {url: `${GCS_PUBLIC_BASE}/${path}`};
        },

        async getSignedUrl(path: string, expiresIn: number): Promise<string> {
            const response = await fetch(`${API_BASE}/raster/signed-url`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({path, expiresIn}),
            });

            if (!response.ok) {
                throw new Error(`Failed to get signed URL: ${response.status} ${response.statusText}`);
            }

            const {signedUrl} = (await response.json()) as { signedUrl: string };
            return signedUrl;
        },

        getCOGUrl(path: string): string {
            // Direct public URL — supports HTTP Range headers for COG streaming.
            // No authentication needed; bucket has allUsers objectViewer IAM.
            return `${GCS_PUBLIC_BASE}/${path}`;
        },

        async delete(path: string): Promise<boolean> {
            const response = await fetch(`${API_BASE}/raster/${encodeURIComponent(path)}`, {
                method: 'DELETE',
            });

            return response.ok;
        },
    };
}

// ─── Singleton instance ──────────────────────────────────────────────────────

let _instance: RasterStorageClient | null = null;

/**
 * Get the singleton raster storage client.
 * Safe to call from both server and client components.
 */
export function getRasterStorageClient(): RasterStorageClient {
    if (!_instance) {
        _instance = createRasterStorageClient();
    }
    return _instance;
}
