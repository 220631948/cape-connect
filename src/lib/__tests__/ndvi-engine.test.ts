import { describe, it, expect } from 'vitest';
import { calculatePixelNDVI } from '../ndvi-engine';

describe('calculatePixelNDVI', () => {
  it('calculates correct NDVI for typical positive values', () => {
    // (0.8 - 0.2) / (0.8 + 0.2) = 0.6 / 1.0 = 0.6
    expect(calculatePixelNDVI(0.8, 0.2)).toBeCloseTo(0.6);

    // (0.5 - 0.5) / (0.5 + 0.5) = 0 / 1.0 = 0
    expect(calculatePixelNDVI(0.5, 0.5)).toBeCloseTo(0);

    // (0.2 - 0.8) / (0.2 + 0.8) = -0.6 / 1.0 = -0.6
    expect(calculatePixelNDVI(0.2, 0.8)).toBeCloseTo(-0.6);
  });

  it('handles the division-by-zero edge case explicitly returning 0', () => {
    expect(calculatePixelNDVI(0, 0)).toBe(0);

    // Explicit test for when nirValue + redValue === 0 but they are not 0 themselves
    expect(calculatePixelNDVI(0.5, -0.5)).toBe(0);
  });

  it('guarantees domain constraints between -1 and 1', () => {
    // Extreme values
    expect(calculatePixelNDVI(1000, 0)).toBe(1);
    expect(calculatePixelNDVI(0, 1000)).toBe(-1);

    // Standard constraints
    expect(calculatePixelNDVI(0.9, 0.1)).toBeLessThanOrEqual(1);
    expect(calculatePixelNDVI(0.9, 0.1)).toBeGreaterThanOrEqual(-1);
  });

  it('handles negative inputs', () => {
    // Math still works with negative numbers if denominator != 0
    // (-0.8 - (-0.2)) / (-0.8 + -0.2) = -0.6 / -1.0 = 0.6
    expect(calculatePixelNDVI(-0.8, -0.2)).toBeCloseTo(0.6);
  });

  it('handles JavaScript-specific anomalies correctly', () => {
    // NaN
    expect(calculatePixelNDVI(NaN, 0.5)).toBeNaN();
    expect(calculatePixelNDVI(0.5, NaN)).toBeNaN();
    expect(calculatePixelNDVI(NaN, NaN)).toBeNaN();

    // Infinity
    // (Infinity - 0.5) / (Infinity + 0.5) => Infinity / Infinity => NaN
    expect(calculatePixelNDVI(Infinity, 0.5)).toBeNaN();
    expect(calculatePixelNDVI(0.5, Infinity)).toBeNaN();

    // Infinity - Infinity => NaN
    expect(calculatePixelNDVI(Infinity, Infinity)).toBeNaN();
  });
});
