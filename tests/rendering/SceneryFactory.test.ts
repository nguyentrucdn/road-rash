import { describe, it, expect } from 'vitest';
import { SceneryFactory } from '@/rendering/SceneryFactory';

describe('SceneryFactory', () => {
  it('creates detailed tree mesh with trunk and canopy', () => {
    const factory = new SceneryFactory();
    const tree = factory.createDetailed('palm_tree', 2.0, 0x228b22);
    expect(tree.children.length).toBeGreaterThanOrEqual(2); // trunk + fronds
  });

  it('creates detailed building with windows', () => {
    const factory = new SceneryFactory();
    const bldg = factory.createDetailed('building', 4.0, 0x777788);
    expect(bldg.children.length).toBeGreaterThanOrEqual(2); // body + windows
  });

  it('creates detailed cactus with arms', () => {
    const factory = new SceneryFactory();
    const cactus = factory.createDetailed('cactus', 1.5, 0x2d5a27);
    expect(cactus.children.length).toBeGreaterThanOrEqual(2); // trunk + arms
  });

  it('creates all scenery types without error', () => {
    const factory = new SceneryFactory();
    const types = ['cactus', 'palm_tree', 'pine_tree', 'rock', 'building', 'mesa', 'sign', 'light_post'];
    for (const type of types) {
      expect(() => factory.createDetailed(type, 1.0, 0x888888)).not.toThrow();
    }
  });
});
