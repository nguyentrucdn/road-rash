import { TrackData } from '@/tracks/TrackData';
import { createSegment, RoadSegment } from '@/world/RoadSegment';

export const coastTrack: TrackData = {
  name: 'Pacific Coast',
  segmentCount: 700,
  trafficDensity: 0.2,
  skyColor: 0x87ceeb,
  groundColor: 0x3a8a3a,
  roadColor: 0x444444,
  shoulderColor: 0x6a6a4a,
  fogDensity: 0.0015,
  fogColor: 0x87ceeb,
  scenery: [
    { type: 'palm_tree', color: 0x228b22, scale: 2.0, frequency: 0.2 },
    { type: 'rock', color: 0x888888, scale: 1.5, frequency: 0.08 },
  ],
  generateSegments(): RoadSegment[] {
    const segments: RoadSegment[] = [];
    for (let i = 0; i < this.segmentCount; i++) {
      const t = i / this.segmentCount;
      // Lots of winding curves along the coast
      const curve = Math.sin(t * Math.PI * 12) * 0.5 + Math.sin(t * Math.PI * 5) * 0.3;
      const hill = Math.sin(t * Math.PI * 8) * 0.25;
      const width = t > 0.7 && t < 0.72 ? 8 : 12; // narrow cliff section
      const weaponPickup = i > 0 && i % 120 === 0;
      segments.push(createSegment(i, { curve, hill, width, weaponPickup }));
    }
    return segments;
  },
};
