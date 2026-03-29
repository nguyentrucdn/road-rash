import { TrackData } from '@/tracks/TrackData';
import { createSegment, RoadSegment } from '@/world/RoadSegment';

export const canyonTrack: TrackData = {
  name: 'Canyon Run',
  segmentCount: 550,
  trafficDensity: 0.15,
  skyColor: 0xdd8855,
  groundColor: 0xaa5533,
  roadColor: 0x444444,
  shoulderColor: 0x885533,
  fogDensity: 0.002,
  fogColor: 0xdd8855,
  scenery: [
    { type: 'rock', color: 0xcc6644, scale: 3.0, frequency: 0.3 },
    { type: 'cactus', color: 0x2d5a27, scale: 1.0, frequency: 0.05 },
  ],
  generateSegments(): RoadSegment[] {
    const segments: RoadSegment[] = [];
    for (let i = 0; i < this.segmentCount; i++) {
      const t = i / this.segmentCount;
      // Sharp curves through narrow canyon
      const curve = Math.sin(t * Math.PI * 14) * 0.5;
      const hill = Math.sin(t * Math.PI * 6) * 0.2;
      // Extremely narrow sections
      let width = 10;
      if (t > 0.3 && t < 0.35) width = 7;
      if (t > 0.6 && t < 0.68) width = 6;
      const weaponPickup = i > 0 && i % 90 === 0;
      segments.push(createSegment(i, { curve, hill, width, weaponPickup }));
    }
    return segments;
  },
};
