// tests/rendering/TextureAtlas.test.ts
import { describe, it, expect } from 'vitest';
import { TextureAtlas } from '@/rendering/TextureAtlas';

describe('TextureAtlas', () => {
  it('returns UV coordinates for a known region', () => {
    const atlas = new TextureAtlas();
    const uv = atlas.getUV('road_asphalt');
    expect(uv).toBeDefined();
    expect(uv.u1).toBeGreaterThanOrEqual(0);
    expect(uv.u2).toBeLessThanOrEqual(1);
    expect(uv.v1).toBeGreaterThanOrEqual(0);
    expect(uv.v2).toBeLessThanOrEqual(1);
    expect(uv.u2).toBeGreaterThan(uv.u1);
  });

  it('returns undefined for unknown region', () => {
    const atlas = new TextureAtlas();
    const uv = atlas.getUV('nonexistent');
    expect(uv).toBeUndefined();
  });

  it('has all expected regions', () => {
    const atlas = new TextureAtlas();
    const expected = [
      'road_asphalt', 'road_shoulder', 'bark', 'leaf_canopy',
      'palm_fronds', 'pine_needles', 'building_brick', 'building_concrete',
      'building_glass', 'rock_surface', 'vehicle_glass', 'vehicle_tire',
      'ground_sand', 'ground_grass', 'ground_snow',
    ];
    for (const name of expected) {
      expect(atlas.getUV(name)).toBeDefined();
    }
  });
});
