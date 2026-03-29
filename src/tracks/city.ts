import { TrackData } from '@/tracks/TrackData';
import { createSegment, RoadSegment } from '@/world/RoadSegment';

export const cityTrack: TrackData = {
  name: 'Downtown Rush',
  segmentCount: 500,
  trafficDensity: 0.6,
  skyColor: 0x556677,
  groundColor: 0x555555,
  roadColor: 0x333333,
  shoulderColor: 0x666666,
  fogDensity: 0.003,
  fogColor: 0x556677,
  scenery: [
    { type: 'building', color: 0x777788, scale: 4.0, frequency: 0.3 },
    { type: 'sign', color: 0xffcc00, scale: 1.0, frequency: 0.15 },
  ],
  generateSegments(): RoadSegment[] {
    const segments: RoadSegment[] = [];
    for (let i = 0; i < this.segmentCount; i++) {
      const t = i / this.segmentCount;
      // City grid: alternating straight and sharp turns
      let curve = 0;
      const block = (t * 20) % 1;
      if (block > 0.8) curve = (Math.floor(t * 20) % 2 === 0 ? 1 : -1) * 0.7;
      const hill = 0; // flat city
      const width = block > 0.4 && block < 0.6 ? 14 : 12; // intersections are wider
      const weaponPickup = i > 0 && i % 80 === 0;
      segments.push(createSegment(i, { curve, hill, width, weaponPickup }));
    }
    return segments;
  },
};
