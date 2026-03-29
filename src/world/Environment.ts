import { Road } from '@/world/Road';
import { TrackData } from '@/tracks/TrackData';

export interface SceneryPlacement {
  z: number;
  xOffset: number; // distance from road edge
  side: 1 | -1;
  type: string;
}

export class Environment {
  readonly placements: SceneryPlacement[] = [];

  constructor(track: TrackData, road: Road) {
    const segments = track.generateSegments();

    for (const seg of segments) {
      for (const sceneryDef of track.scenery) {
        if (Math.random() > sceneryDef.frequency) continue;

        const side = (Math.random() > 0.5 ? 1 : -1) as 1 | -1;
        const xOffset = (seg.width / 2 + 3 + Math.random() * 20) * side;

        this.placements.push({
          z: seg.worldZ,
          xOffset,
          side,
          type: sceneryDef.type,
        });
      }
    }
  }
}
