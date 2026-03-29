// tests/effects/WeatherSystem.test.ts
import { describe, it, expect } from 'vitest';
import { WeatherSystem } from '@/effects/WeatherSystem';

describe('WeatherSystem', () => {
  it('starts in initial state', () => {
    const ws = new WeatherSystem('Desert Highway');
    expect(ws.getCurrentState()).toBe('clear');
  });

  it('transitions to next state at progress threshold', () => {
    const ws = new WeatherSystem('Desert Highway');
    // Advance past 40%
    ws.update(0.1, 0.45);
    // Should be transitioning to or at 'dusty'
    expect(ws.getCurrentState()).toBe('dusty');
  });

  it('returns weather properties', () => {
    const ws = new WeatherSystem('Night Highway');
    ws.update(0.1, 0.6); // should be stormy
    const props = ws.getWeatherProperties();
    expect(props.wetness).toBeGreaterThan(0);
    expect(typeof props.windStrength).toBe('number');
    expect(typeof props.visibility).toBe('number');
  });
});
