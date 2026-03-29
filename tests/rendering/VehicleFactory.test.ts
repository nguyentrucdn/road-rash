import { describe, it, expect } from 'vitest';
import { VehicleFactory, VehicleType } from '@/rendering/VehicleFactory';

describe('VehicleFactory', () => {
  it('creates all 6 vehicle types', () => {
    const factory = new VehicleFactory();
    const types: VehicleType[] = ['sedan', 'pickup', 'suv', 'bus', 'semi', 'sports'];
    for (const type of types) {
      const mesh = factory.create(type);
      expect(mesh).toBeDefined();
      expect(mesh.children.length).toBeGreaterThan(3); // body + cabin + wheels minimum
    }
  });

  it('sedan has expected dimensions', async () => {
    const factory = new VehicleFactory();
    const sedan = factory.create('sedan');
    const { Box3, Vector3 } = await import('three');
    const box = new Box3().setFromObject(sedan);
    const size = box.getSize(new Vector3());
    expect(size.x).toBeCloseTo(1.8, 0);
    expect(size.z).toBeCloseTo(4.0, 0);
  });

  it('clones are independent', () => {
    const factory = new VehicleFactory();
    const a = factory.create('sedan');
    const b = factory.create('sedan');
    a.position.set(10, 0, 0);
    expect(b.position.x).toBe(0);
  });
});
