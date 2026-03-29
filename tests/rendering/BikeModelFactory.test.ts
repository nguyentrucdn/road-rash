import { describe, it, expect } from 'vitest';
import { BikeModelFactory } from '@/rendering/BikeModelFactory';

describe('BikeModelFactory', () => {
  it('creates player bike with multiple parts', () => {
    const factory = new BikeModelFactory();
    const bike = factory.createPlayerBike();
    expect(bike.children.length).toBeGreaterThan(8); // frame, engine, exhaust, handlebars, seat, 2 wheels, rider torso, head, 2 arms, 2 legs
  });

  it('creates AI bike with personality variant', () => {
    const factory = new BikeModelFactory();
    const aggressive = factory.createAiBike('aggressive', 0xff8800);
    expect(aggressive.children.length).toBeGreaterThan(8);
  });

  it('different personalities produce visually distinct models', () => {
    const factory = new BikeModelFactory();
    const agg = factory.createAiBike('aggressive', 0xff8800);
    const def = factory.createAiBike('defensive', 0x44aa44);
    // Aggressive has spike on helmet, defensive has wider shoulders
    expect(agg.children.length).not.toBe(def.children.length);
  });
});
