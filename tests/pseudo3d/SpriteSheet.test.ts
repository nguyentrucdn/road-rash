// tests/pseudo3d/SpriteSheet.test.ts
import { describe, it, expect } from 'vitest';
import { SpriteSheet } from '@/pseudo3d/SpriteSheet';

describe('SpriteSheet', () => {
  it('generates player bike sprite frames', () => {
    const sheet = new SpriteSheet();
    const frames = sheet.getBikeFrames('player');
    expect(frames.center).toBeDefined();
    expect(frames.lean_left).toBeDefined();
    expect(frames.lean_right).toBeDefined();
    expect(frames.punch_left).toBeDefined();
    expect(frames.punch_right).toBeDefined();
    expect(frames.crash).toBeDefined();
  });

  it('generates all 6 vehicle types', () => {
    const sheet = new SpriteSheet();
    const types = ['sedan', 'pickup', 'suv', 'bus', 'semi', 'sports'];
    for (const type of types) {
      const sprites = sheet.getVehicleSprite(type);
      expect(sprites.rear).toBeDefined();
      expect(sprites.front).toBeDefined();
    }
  });

  it('generates scenery sprites for desert', () => {
    const sheet = new SpriteSheet();
    const cactus = sheet.getScenerySprite('cactus');
    expect(cactus).toBeDefined();
  });
});
