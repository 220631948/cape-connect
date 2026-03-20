import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchHistoricalTrack } from '../opensky-api';

// Mock the global fetch
global.fetch = vi.fn();

describe('opensky-api: fetchHistoricalTrack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        icao24: '3c6444',
        callsign: 'SAA331 ',
        startTime: 1773312000,
        endTime: 1773315600,
        path: [
          [1773312000, -33.9000, 18.5000, 10000, 180, false],
          [1773312030, -33.9100, 18.5100, 10050, 185, false]
        ]
      }),
    });
  });

  it('correctly fetches and maps track points to FlightTemporalEntry', async () => {
    const result = await fetchHistoricalTrack('3c6444', 1773312000);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      icao24: '3c6444',
      callsign: 'SAA331',
      timestamp: new Date(1773312000 * 1000).toISOString(),
      position: [18.5000, -33.9000, 10000],
      heading: 180,
      on_ground: false,
    });
    expect(result[1].heading).toBe(185);
  });

  it('handles empty path by returning an empty array', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        icao24: '3c6444',
        callsign: null,
        path: null
      }),
    });

    const result = await fetchHistoricalTrack('3c6444');
    expect(result).toEqual([]);
  });

  it('throws an error on API failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchHistoricalTrack('3c6444')).rejects.toThrow('OpenSky API error: HTTP 500');
  });
});
