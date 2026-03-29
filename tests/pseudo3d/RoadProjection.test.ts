// tests/pseudo3d/RoadProjection.test.ts
import { describe, it, expect } from 'vitest';
import { RoadProjection } from '@/pseudo3d/RoadProjection';
import { desertTrack } from '@/tracks/desert';
import { Road } from '@/world/Road';

describe('RoadProjection', () => {
  it('projects a segment to screen coordinates', () => {
    const road = new Road(desertTrack);
    const proj = new RoadProjection(800, 600);
    const result = proj.project(10, road, 0); // z=10 segments ahead
    expect(result.screenY).toBeGreaterThan(0);
    expect(result.screenY).toBeLessThan(600);
    expect(result.screenWidth).toBeGreaterThan(0);
  });

  it('segments closer to camera are wider and lower', () => {
    const road = new Road(desertTrack);
    const proj = new RoadProjection(800, 600);
    const near = proj.project(5, road, 0);
    const far = proj.project(50, road, 0);
    expect(near.screenY).toBeGreaterThan(far.screenY); // near is lower on screen
    expect(near.screenWidth).toBeGreaterThan(far.screenWidth); // near is wider
  });

  it('segments beyond draw distance return null', () => {
    const road = new Road(desertTrack);
    const proj = new RoadProjection(800, 600);
    const result = proj.project(2000, road, 0);
    expect(result).toBeNull();
  });

  it('curve offset accumulates across segments', () => {
    const road = new Road(desertTrack);
    const proj = new RoadProjection(800, 600);
    // Desert track has curves starting around 10% (segment 60+)
    const projected = proj.projectAll(road, 300); // player at z=300 (segment 60)
    const hasOffset = projected.some(p => Math.abs(p.screenX - 400) > 5);
    expect(hasOffset).toBe(true);
  });
});
