import { describe, it, expect } from 'vitest';
import { Road } from '@/world/Road';
import { desertTrack } from '@/tracks/desert';

describe('Road', () => {
  it('initializes with track segments', () => {
    const road = new Road(desertTrack);
    expect(road.totalSegments).toBe(desertTrack.segmentCount);
  });
  it('returns visible segments around a position', () => {
    const road = new Road(desertTrack);
    const visible = road.getVisibleSegments(100);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.length).toBeLessThanOrEqual(200);
  });
  it('getSegmentAt returns correct segment for z position', () => {
    const road = new Road(desertTrack);
    const seg = road.getSegmentAt(25);
    expect(seg.index).toBe(5);
  });
  it('getRoadXOffset returns lateral offset from curve accumulation', () => {
    const road = new Road(desertTrack);
    const x = road.getRoadXOffset(0);
    expect(x).toBe(0);
  });
  it('getElevation returns y position from hills', () => {
    const road = new Road(desertTrack);
    const y = road.getElevation(0);
    expect(typeof y).toBe('number');
  });
});
