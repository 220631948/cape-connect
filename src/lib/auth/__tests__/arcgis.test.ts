import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getArcGISToken, clearCachedArcGISToken } from '../arcgis';
import { monitor } from '@/lib/monitoring';

vi.mock('@/lib/monitoring', () => ({
  monitor: {
    trackError: vi.fn(),
  },
}));

describe('ArcGIS Auth Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    clearCachedArcGISToken();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('should return token from process.env.ARCGIS_TOKEN if client credentials are not set', async () => {
    process.env.ARCGIS_TOKEN = 'mock-static-token';
    const token = await getArcGISToken();
    expect(token).toBe('mock-static-token');
  });

  it('should fetch a new token using client credentials', async () => {
    process.env.ARCGIS_CLIENT_ID = 'mock-client-id';
    process.env.ARCGIS_CLIENT_SECRET = 'mock-client-secret';

    const mockResponse = {
      ok: true,
      json: async () => ({
        access_token: 'mock-oauth-token',
        expires_in: 7200,
      }),
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const token = await getArcGISToken();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchArgs = (global.fetch as any).mock.calls[0];
    expect(fetchArgs[0]).toBe('https://www.arcgis.com/sharing/rest/oauth2/token');
    expect(fetchArgs[1].method).toBe('POST');

    // Verify body parameters
    const bodyParams = new URLSearchParams(fetchArgs[1].body);
    expect(bodyParams.get('client_id')).toBe('mock-client-id');
    expect(bodyParams.get('client_secret')).toBe('mock-client-secret');
    expect(bodyParams.get('grant_type')).toBe('client_credentials');

    expect(token).toBe('mock-oauth-token');
  });

  it('should use the cached token if it has not expired', async () => {
    process.env.ARCGIS_CLIENT_ID = 'mock-client-id';
    process.env.ARCGIS_CLIENT_SECRET = 'mock-client-secret';

    const mockResponse = {
      ok: true,
      json: async () => ({
        access_token: 'mock-oauth-token',
        expires_in: 7200, // 2 hours
      }),
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    // First call fetches
    const token1 = await getArcGISToken();
    expect(token1).toBe('mock-oauth-token');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second call should return cached token without fetching
    const token2 = await getArcGISToken();
    expect(token2).toBe('mock-oauth-token');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should throw an error and log to monitor when fetch fails', async () => {
    process.env.ARCGIS_CLIENT_ID = 'mock-client-id';
    process.env.ARCGIS_CLIENT_SECRET = 'mock-client-secret';

    (global.fetch as any).mockRejectedValue(new Error('Network failure'));

    await expect(getArcGISToken()).rejects.toThrow('Failed to authenticate with ArcGIS: Network failure');
    expect(monitor.trackError).toHaveBeenCalledTimes(1);
  });
});
