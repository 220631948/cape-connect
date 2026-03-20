import { describe, it, expect } from 'vitest';
import { isInCapeTownBbox, isAirlineCallsign, toFlightGeoJSON } from '../flight-data-transformer';
import { OpenSkyStateVector } from '@/types/opensky';

describe('Flight Data Transformer', () => {
  describe('isInCapeTownBbox', () => {
    it('should return true for a coordinate inside the box', () => {
      expect(isInCapeTownBbox(18.5, -33.5)).toBe(true);
    });

    it('should return false for a coordinate outside the box (London)', () => {
      expect(isInCapeTownBbox(-0.12, 51.5)).toBe(false);
    });

    it('should return true for coordinates exactly on the edge', () => {
      expect(isInCapeTownBbox(18.0, -34.5)).toBe(true);
      expect(isInCapeTownBbox(19.5, -33.0)).toBe(true);
    });
  });

  describe('isAirlineCallsign', () => {
    it('should return true for known SAA callsign', () => {
      expect(isAirlineCallsign('SAA123')).toBe(true);
    });

    it('should return true for FlySafair', () => {
      expect(isAirlineCallsign('FA456')).toBe(true);
    });

    it('should return false for private ZS registration', () => {
      expect(isAirlineCallsign('ZS-ABC')).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(isAirlineCallsign('  EK789  ')).toBe(true);
    });
  });

  describe('toFlightGeoJSON', () => {
    const mockStates: OpenSkyStateVector[] = [
      {
        icao24: 'abc123',
        callsign: 'SAA123',
        origin_country: 'South Africa',
        time_position: 1600000000,
        last_contact: 1600000000,
        longitude: 18.5,
        latitude: -33.5,
        baro_altitude: 10000,
        on_ground: false,
        velocity: 200,
        true_track: 180,
        vertical_rate: 0,
        sensors: null,
        geo_altitude: 10100,
        squawk: null,
        spi: false,
        position_source: 0,
        category: 0,
      },
      {
        icao24: 'def456',
        callsign: 'PRIVATE1',
        origin_country: 'South Africa',
        time_position: 1600000000,
        last_contact: 1600000000,
        longitude: 18.6,
        latitude: -33.6,
        baro_altitude: 5000,
        on_ground: false,
        velocity: 150,
        true_track: 90,
        vertical_rate: 0,
        sensors: null,
        geo_altitude: 5100,
        squawk: null,
        spi: false,
        position_source: 0,
        category: 0,
      }
    ];

    it('should return all valid flights in normal mode', () => {
      const result = toFlightGeoJSON(mockStates, false);
      expect(result.features).toHaveLength(2);
      expect(result.features[0].properties.callsign).toBe('SAA123');
    });

    it('should filter private flights in guest mode', () => {
      const result = toFlightGeoJSON(mockStates, true);
      expect(result.features).toHaveLength(1);
      expect(result.features[0].properties.callsign).toBe('SAA123');
    });

    it('should filter flights outside bbox', () => {
      const outsideState = { ...mockStates[0], longitude: 0, latitude: 0 };
      const result = toFlightGeoJSON([outsideState], false);
      expect(result.features).toHaveLength(0);
    });
  });
});
