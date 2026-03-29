import { TrackData } from '@/tracks/TrackData';
import { createSegment, RoadSegment } from '@/world/RoadSegment';

export const mountainTrack: TrackData = {
  name: 'Mountain Pass',
  segmentCount: 800,
  trafficDensity: 0.3,
  skyColor: 0xaabbcc,
  groundColor: 0x4a6a3a,
  roadColor: 0x555555,
  shoulderColor: 0x4a5a3a,
  fogDensity: 0.004,
  fogColor: 0xaabbcc,
  scenery: [
    { type: 'pine_tree', color: 0x1a5a1a, scale: 2.5, frequency: 0.25 },
    { type: 'rock', color: 0x888888, scale: 2.0, frequency: 0.1 },
  ],
  generateSegments(): RoadSegment[] {
    const segments: RoadSegment[] = [];
    for (let i = 0; i < this.segmentCount; i++) {
      const t = i / this.segmentCount;
      // Hairpin turns with big elevation changes
      const curve = Math.sin(t * Math.PI * 6) * 0.6 * Math.sin(t * Math.PI * 2);
      const hill = Math.sin(t * Math.PI * 4) * 0.4;
      const width = 10; // narrower mountain road
      const weaponPickup = i > 0 && i % 130 === 0;
      segments.push(createSegment(i, { curve, hill, width, weaponPickup }));
    }
    return segments;
  },
};
