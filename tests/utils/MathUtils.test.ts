import { describe, it, expect } from 'vitest';
import { lerp, clamp, randomRange, degToRad } from '@/utils/MathUtils';

describe('MathUtils', () => {
  it('lerp interpolates between two values', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
  });
  it('clamp restricts value to range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
  it('randomRange returns value in range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomRange(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
    }
  });
  it('degToRad converts degrees to radians', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    expect(degToRad(0)).toBe(0);
  });
});
