export const SEGMENT_LENGTH = 5;

export interface RoadSegment {
  index: number;
  curve: number;
  hill: number;
  width: number;
  worldZ: number;
  segmentLength: number;
  hazard?: string;
  weaponPickup?: boolean;
}

export interface SegmentOptions {
  curve?: number;
  hill?: number;
  width?: number;
  hazard?: string;
  weaponPickup?: boolean;
}

export function createSegment(index: number, opts: SegmentOptions = {}): RoadSegment {
  return {
    index,
    curve: opts.curve ?? 0,
    hill: opts.hill ?? 0,
    width: opts.width ?? 12,
    worldZ: index * SEGMENT_LENGTH,
    segmentLength: SEGMENT_LENGTH,
    weaponPickup: opts.weaponPickup ?? false,
  };
}
