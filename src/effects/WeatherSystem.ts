// src/effects/WeatherSystem.ts
import { getWeatherConfig, WeatherState, TrackWeatherConfig } from '@/effects/WeatherConfig';

export interface WeatherProperties {
  wetness: number;       // 0-1
  windStrength: number;  // 0-1
  visibility: number;    // 0-1 (1 = clear)
  particleType: 'none' | 'rain' | 'snow' | 'dust' | 'leaves' | 'smog';
  particleIntensity: number;
  lightingTint: number;
  lightingIntensity: number;
}

const STATE_PROPERTIES: Record<WeatherState, Omit<WeatherProperties, 'particleIntensity'>> = {
  clear:  { wetness: 0, windStrength: 0, visibility: 1, particleType: 'none', lightingTint: 0xffffff, lightingIntensity: 1.0 },
  dusty:  { wetness: 0, windStrength: 0.4, visibility: 0.6, particleType: 'dust', lightingTint: 0xffddaa, lightingIntensity: 0.8 },
  misty:  { wetness: 0.2, windStrength: 0.1, visibility: 0.5, particleType: 'none', lightingTint: 0xccccdd, lightingIntensity: 0.6 },
  rainy:  { wetness: 0.8, windStrength: 0.3, visibility: 0.6, particleType: 'rain', lightingTint: 0x8899bb, lightingIntensity: 0.5 },
  snowy:  { wetness: 0.3, windStrength: 0.2, visibility: 0.5, particleType: 'snow', lightingTint: 0xddeeff, lightingIntensity: 0.7 },
  stormy: { wetness: 1.0, windStrength: 0.7, visibility: 0.3, particleType: 'rain', lightingTint: 0x556677, lightingIntensity: 0.3 },
  windy:  { wetness: 0, windStrength: 0.8, visibility: 0.8, particleType: 'leaves', lightingTint: 0xffffff, lightingIntensity: 0.9 },
  smoggy: { wetness: 0, windStrength: 0.1, visibility: 0.4, particleType: 'smog', lightingTint: 0xbbaa88, lightingIntensity: 0.6 },
};

export class WeatherSystem {
  private config: TrackWeatherConfig;
  private currentState: WeatherState;
  private targetState: WeatherState;
  private transitionProgress = 1; // 1 = fully transitioned
  private transitionDuration = 10; // seconds

  constructor(trackName: string) {
    this.config = getWeatherConfig(trackName);
    this.currentState = this.config.initial;
    this.targetState = this.config.initial;
  }

  getCurrentState(): WeatherState {
    return this.targetState;
  }

  update(dt: number, raceProgress: number): void {
    // Check for state transitions
    for (let i = this.config.transitions.length - 1; i >= 0; i--) {
      if (raceProgress >= this.config.transitions[i].at) {
        const newState = this.config.transitions[i].state;
        if (newState !== this.targetState) {
          this.currentState = this.targetState;
          this.targetState = newState;
          this.transitionProgress = 0;
        }
        break;
      }
    }

    // Advance transition
    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + dt / this.transitionDuration);
    }
  }

  getWeatherProperties(): WeatherProperties {
    const from = STATE_PROPERTIES[this.currentState];
    const to = STATE_PROPERTIES[this.targetState];
    const t = this.transitionProgress;

    return {
      wetness: from.wetness + (to.wetness - from.wetness) * t,
      windStrength: from.windStrength + (to.windStrength - from.windStrength) * t,
      visibility: from.visibility + (to.visibility - from.visibility) * t,
      particleType: t > 0.5 ? to.particleType : from.particleType,
      particleIntensity: t > 0.5 ? t : 1 - t,
      lightingTint: to.lightingTint,
      lightingIntensity: from.lightingIntensity + (to.lightingIntensity - from.lightingIntensity) * t,
    };
  }
}
