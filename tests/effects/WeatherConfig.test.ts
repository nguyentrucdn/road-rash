// tests/effects/WeatherConfig.test.ts
import { describe, it, expect } from 'vitest';
import { getWeatherConfig } from '@/effects/WeatherConfig';

describe('WeatherConfig', () => {
  it('returns config for all 6 tracks', () => {
    const tracks = ['Desert Highway', 'Pacific Coast', 'Downtown Rush', 'Mountain Pass', 'Night Highway', 'Canyon Run'];
    for (const name of tracks) {
      const config = getWeatherConfig(name);
      expect(config).toBeDefined();
      expect(config.transitions.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('transitions are in ascending progress order', () => {
    const config = getWeatherConfig('Desert Highway');
    for (let i = 1; i < config.transitions.length; i++) {
      expect(config.transitions[i].at).toBeGreaterThan(config.transitions[i - 1].at);
    }
  });
});
