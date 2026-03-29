import { describe, it, expect } from 'vitest';
import { desertTrack } from '@/tracks/desert';
import { TrackData } from '@/tracks/TrackData';

describe('TrackData', () => {
  it('desert track has required fields', () => {
    const t: TrackData = desertTrack;
    expect(t.name).toBe('Desert Highway');
    expect(t.segmentCount).toBeGreaterThan(0);
    expect(t.trafficDensity).toBeGreaterThanOrEqual(0);
    expect(t.trafficDensity).toBeLessThanOrEqual(1);
    expect(t.skyColor).toBeTruthy();
    expect(t.groundColor).toBeTruthy();
  });
  it('desert track generates correct number of segments', () => {
    const segments = desertTrack.generateSegments();
    expect(segments.length).toBe(desertTrack.segmentCount);
  });
  it('segments have varying curves', () => {
    const segments = desertTrack.generateSegments();
    const curves = segments.map(s => s.curve);
    const hasCurves = curves.some(c => c !== 0);
    expect(hasCurves).toBe(true);
  });
});
