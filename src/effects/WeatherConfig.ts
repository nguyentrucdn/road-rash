// src/effects/WeatherConfig.ts
export type WeatherState = 'clear' | 'dusty' | 'misty' | 'rainy' | 'snowy' | 'stormy' | 'windy' | 'smoggy';

export interface WeatherTransition {
  at: number; // race progress 0-1
  state: WeatherState;
}

export interface TrackWeatherConfig {
  initial: WeatherState;
  transitions: WeatherTransition[];
}

const CONFIGS: Record<string, TrackWeatherConfig> = {
  'Desert Highway': {
    initial: 'clear',
    transitions: [
      { at: 0, state: 'clear' },
      { at: 0.4, state: 'dusty' },
      { at: 0.75, state: 'clear' },
    ],
  },
  'Pacific Coast': {
    initial: 'misty',
    transitions: [
      { at: 0, state: 'misty' },
      { at: 0.3, state: 'rainy' },
      { at: 0.65, state: 'misty' },
      { at: 0.85, state: 'clear' },
    ],
  },
  'Downtown Rush': {
    initial: 'clear',
    transitions: [
      { at: 0, state: 'clear' },
      { at: 0.35, state: 'smoggy' },
      { at: 0.7, state: 'windy' },
    ],
  },
  'Mountain Pass': {
    initial: 'misty',
    transitions: [
      { at: 0, state: 'misty' },
      { at: 0.25, state: 'snowy' },
      { at: 0.6, state: 'stormy' },
      { at: 0.85, state: 'snowy' },
    ],
  },
  'Night Highway': {
    initial: 'clear',
    transitions: [
      { at: 0, state: 'clear' },
      { at: 0.3, state: 'rainy' },
      { at: 0.55, state: 'stormy' },
      { at: 0.8, state: 'rainy' },
    ],
  },
  'Canyon Run': {
    initial: 'clear',
    transitions: [
      { at: 0, state: 'clear' },
      { at: 0.4, state: 'windy' },
      { at: 0.65, state: 'dusty' },
      { at: 0.85, state: 'clear' },
    ],
  },
};

export function getWeatherConfig(trackName: string): TrackWeatherConfig {
  return CONFIGS[trackName] ?? CONFIGS['Desert Highway'];
}
