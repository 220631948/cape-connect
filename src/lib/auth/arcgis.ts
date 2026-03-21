/**
 * @file src/lib/auth/arcgis.ts
 * @description Utility for authenticating with ArcGIS REST API
 */

import { monitor } from '@/lib/monitoring';

let cachedToken: string | null = null;
let tokenExpirationTime = 0;

/**
 * Retrieves an ArcGIS access token using client credentials or an existing token.
 * Falls back to process.env.ARCGIS_TOKEN if available.
 *
 * @returns {Promise<string>} The ArcGIS access token
 */
export async function getArcGISToken(): Promise<string> {
  const tokenUrl = 'https://www.arcgis.com/sharing/rest/oauth2/token';
  const clientId = process.env.ARCGIS_CLIENT_ID;
  const clientSecret = process.env.ARCGIS_CLIENT_SECRET;
  const envToken = process.env.ARCGIS_TOKEN;

  // Use existing valid token if available
  if (cachedToken && Date.now() < tokenExpirationTime) {
    return cachedToken;
  }

  // If no client credentials but we have a static token, use it
  if (!clientId || !clientSecret) {
    if (envToken) {
      return envToken;
    }
    throw new Error('ArcGIS credentials (ARCGIS_CLIENT_ID/SECRET or ARCGIS_TOKEN) are missing');
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ArcGIS token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`ArcGIS OAuth Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    if (!data.access_token) {
      throw new Error('ArcGIS token response missing access_token');
    }

    cachedToken = data.access_token;
    // Set expiration 5 minutes before actual expiry to be safe (expires_in is in seconds)
    const expiresInMs = (data.expires_in - 300) * 1000;
    tokenExpirationTime = Date.now() + expiresInMs;

    return cachedToken;
  } catch (error: unknown) {
    if (error instanceof Error) {
      monitor.trackError(error, { service: 'arcgis-auth' });
      throw new Error(`Failed to authenticate with ArcGIS: ${error.message}`);
    }
    throw new Error('An unknown error occurred while authenticating with ArcGIS');
  }
}

/**
 * Clear the cached token, useful for testing or forcing a refresh.
 */
export function clearCachedArcGISToken(): void {
  cachedToken = null;
  tokenExpirationTime = 0;
}
