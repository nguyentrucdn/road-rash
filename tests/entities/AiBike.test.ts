import { describe, it, expect } from 'vitest';
import { AiBike, AiPersonality } from '@/entities/AiBike';

describe('AiBike', () => {
  it('creates AI with a personality', () => {
    const ai = new AiBike(0, 10, AiPersonality.Aggressive);
    expect(ai.personality).toBe(AiPersonality.Aggressive);
    expect(ai.bike.z).toBe(10);
  });
  it('accelerates toward target speed', () => {
    const ai = new AiBike(0, 0, AiPersonality.Racer);
    ai.targetSpeed = 50;
    ai.updateRacing(1 / 60);
    expect(ai.bike.speed).toBeGreaterThan(0);
  });
  it('rubber-bands speed based on position delta', () => {
    const ai = new AiBike(0, 0, AiPersonality.Racer);
    ai.applyRubberBanding(100, 50);
    expect(ai.targetSpeed).toBeGreaterThan(ai.bike.maxSpeed * 0.8);
  });
  it('steers to stay on road', () => {
    const ai = new AiBike(8, 0, AiPersonality.Racer);
    ai.updateSteering(0, 12, 1 / 60);
    expect(ai.bike.x).toBeLessThan(8);
  });
});
