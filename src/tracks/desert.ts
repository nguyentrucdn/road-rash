import { TrackData } from '@/tracks/TrackData';
import { createSegment, RoadSegment } from '@/world/RoadSegment';

export const desertTrack: TrackData = {
  name: 'Desert Highway',
  segmentCount: 600,
  trafficDensity: 0.15,
  skyColor: 0xf4a460,
  groundColor: 0xc2b280,
  roadColor: 0x333333,
  shoulderColor: 0x8b7355,
  fogDensity: 0.002,
  fogColor: 0xf4a460,
  scenery: [
    { type: 'cactus', color: 0x2d5a27, scale: 1.5, frequency: 0.15 },
    { type: 'rock', color: 0x8b7355, scale: 1.0, frequency: 0.1 },
    { type: 'mesa', color: 0xcd853f, scale: 5.0, frequency: 0.02 },
  ],
  generateSegments(): RoadSegment[] {
    const segments: RoadSegment[] = [];
    for (let i = 0; i < this.segmentCount; i++) {
      const t = i / this.segmentCount;
      let curve = 0;
      if (t > 0.1 && t < 0.2) curve = Math.sin((t - 0.1) * Math.PI * 10) * 0.3;
      if (t > 0.35 && t < 0.5) curve = -0.4 * Math.sin((t - 0.35) * Math.PI * 6.67);
      if (t > 0.6 && t < 0.75) curve = 0.5 * Math.sin((t - 0.6) * Math.PI * 6.67);
      if (t > 0.85 && t < 0.95) curve = -0.3 * Math.sin((t - 0.85) * Math.PI * 10);
      let hill = 0;
      if (t > 0.15 && t < 0.3) hill = 0.2 * Math.sin((t - 0.15) * Math.PI * 6.67);
      if (t > 0.5 && t < 0.65) hill = -0.15 * Math.sin((t - 0.5) * Math.PI * 6.67);
      let width = 12;
      if (t > 0.45 && t < 0.48) width = 8;
      const weaponPickup = i > 0 && i % 100 === 0;
      segments.push(createSegment(i, { curve, hill, width, weaponPickup }));
    }
    return segments;
  },
};
