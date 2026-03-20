import { describe, it, expect } from 'vitest';
import { heightToZoom, zoomToHeight } from '../CameraSync';

describe('CameraSync Utilities', () => {
  describe('heightToZoom', () => {
    it('should return 11 for reference height 15000m', () => {
      expect(heightToZoom(15000)).toBe(11);
    });

    it('should return 12 when height is halved (7500m)', () => {
      expect(heightToZoom(7500)).toBe(12);
    });

    it('should return 10 when height is doubled (30000m)', () => {
      expect(heightToZoom(30000)).toBe(10);
    });
  });

  describe('zoomToHeight', () => {
    it('should return 15000m for zoom 11', () => {
      expect(zoomToHeight(11)).toBe(15000);
    });

    it('should return 7500m for zoom 12', () => {
      expect(zoomToHeight(12)).toBe(7500);
    });

    it('should return 30000m for zoom 10', () => {
      expect(zoomToHeight(10)).toBe(30000);
    });
  });

  describe('Bidirectional Consistency', () => {
    it('should be reversible within floating point precision', () => {
      const heights = [100, 500, 1500, 5000, 15000, 50000];
      heights.forEach(h => {
        const z = heightToZoom(h);
        expect(zoomToHeight(z)).toBeCloseTo(h, 5);
      });

      const zooms = [1, 5, 10, 11, 15, 20];
      zooms.forEach(z => {
        const h = zoomToHeight(z);
        expect(heightToZoom(h)).toBeCloseTo(z, 5);
      });
    });
  });
});
