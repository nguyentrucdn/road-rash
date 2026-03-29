import { TrackData } from '@/tracks/TrackData';
import { createSegment, RoadSegment } from '@/world/RoadSegment';

export const nightTrack: TrackData = {
  name: 'Night Highway',
  segmentCount: 650,
  trafficDensity: 0.35,
  skyColor: 0x0a0a1a,
  groundColor: 0x1a1a2a,
  roadColor: 0x222222,
  shoulderColor: 0x333344,
  fogDensity: 0.005,
  fogColor: 0x0a0a1a,
  scenery: [
    { type: 'light_post', color: 0xffaa00, scale: 2.0, frequency: 0.12 },
    { type: 'sign', color: 0x00ff88, scale: 1.0, frequency: 0.05 },
  ],
  generateSegments(): RoadSegment[] {
    const segments: RoadSegment[] = [];
    for (let i = 0; i < this.segmentCount; i++) {
      const t = i / this.segmentCount;
      // Long sweeping curves, gentle
      const curve = Math.sin(t * Math.PI * 4) * 0.3;
      const hill = Math.sin(t * Math.PI * 3) * 0.15;
      const weaponPickup = i > 0 && i % 100 === 0;
      segments.push(createSegment(i, { curve, hill, weaponPickup }));
    }
    return segments;
  },
};
