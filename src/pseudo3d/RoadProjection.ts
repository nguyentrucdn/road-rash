// src/pseudo3d/RoadProjection.ts
import { Road } from '@/world/Road';
import { SEGMENT_LENGTH } from '@/world/RoadSegment';

export interface ProjectedSegment {
  screenX: number;      // center X on screen
  screenY: number;      // Y position on screen
  screenWidth: number;   // road width at this depth
  scale: number;         // 0-1 scale factor for sprites
  worldZ: number;        // original world Z
  segmentIndex: number;
  curve: number;         // segment curve value
  hill: number;          // segment hill value
  roadWidth: number;     // world road width
  clip: number;          // Y position for clipping (top of this segment band)
}

const CAMERA_DEPTH = 1.0;
const DRAW_DISTANCE = 300; // segments ahead
const WIDTH_FACTOR = 0.03; // controls how wide the road appears on screen

export class RoadProjection {
  private screenWidth: number;
  private screenHeight: number;
  private roadY: number; // horizon line Y

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.roadY = screenHeight * 0.35; // horizon at 35% from top
  }

  resize(w: number, h: number): void {
    this.screenWidth = w;
    this.screenHeight = h;
    this.roadY = h * 0.35;
  }

  get horizonY(): number {
    return this.roadY;
  }

  project(segmentsAhead: number, road: Road, playerZ: number): ProjectedSegment | null {
    if (segmentsAhead <= 0 || segmentsAhead > DRAW_DISTANCE) return null;

    const worldZ = playerZ + segmentsAhead * SEGMENT_LENGTH;
    const seg = road.getSegmentAt(worldZ);

    // Use segment index as z (not world meters) — gives scale 1.0 at nearest, ~0 at horizon
    const scale = CAMERA_DEPTH / segmentsAhead;
    const rawScreenY = this.roadY + (this.screenHeight - this.roadY) * scale;
    const screenY = Math.min(this.screenHeight - 1, rawScreenY);

    if (screenY < this.roadY) return null;

    const screenWidth = seg.width * scale * this.screenWidth * WIDTH_FACTOR;

    return {
      screenX: this.screenWidth / 2,
      screenY,
      screenWidth,
      scale,
      worldZ,
      segmentIndex: seg.index,
      curve: seg.curve,
      hill: seg.hill,
      roadWidth: seg.width,
      clip: screenY,
    };
  }

  /** Project all visible segments, applying curve and hill accumulation. */
  projectAll(road: Road, playerZ: number): ProjectedSegment[] {
    const results: ProjectedSegment[] = [];
    let cumulativeX = 0;
    let cumulativeY = 0;

    for (let i = 1; i <= DRAW_DISTANCE; i++) {
      const worldZ = playerZ + i * SEGMENT_LENGTH;
      const seg = road.getSegmentAt(worldZ);

      // Use segment index as z — scale is 1.0 at nearest, approaches 0 at horizon
      const scale = CAMERA_DEPTH / i;

      // Accumulate curve offset (horizontal shift)
      cumulativeX += seg.curve * scale * 2;
      // Accumulate hill offset (vertical shift)
      cumulativeY += seg.hill * scale * 1.5;

      const screenY = this.roadY + (this.screenHeight - this.roadY) * scale + cumulativeY;
      const screenX = this.screenWidth / 2 + cumulativeX * this.screenWidth * 0.3;
      const screenWidth = seg.width * scale * this.screenWidth * WIDTH_FACTOR;

      if (screenY < 0 || screenY > this.screenHeight) continue;

      results.push({
        screenX,
        screenY,
        screenWidth,
        scale,
        worldZ,
        segmentIndex: seg.index,
        curve: seg.curve,
        hill: seg.hill,
        roadWidth: seg.width,
        clip: screenY,
      });
    }

    return results;
  }

  /** Get screen position for a sprite at given world coordinates. */
  projectSprite(
    spriteWorldX: number,
    spriteWorldZ: number,
    playerZ: number,
    road: Road,
  ): { screenX: number; screenY: number; scale: number } | null {
    const dz = spriteWorldZ - playerZ;
    if (dz <= 0 || dz > DRAW_DISTANCE * SEGMENT_LENGTH) return null;

    // Convert world distance to segment index for consistent scaling
    const segIndex = dz / SEGMENT_LENGTH;
    if (segIndex < 0.5) return null; // too close
    const scale = CAMERA_DEPTH / segIndex;
    const screenY = this.roadY + (this.screenHeight - this.roadY) * scale;

    // Calculate cumulative curve offset up to this Z
    let cumulativeX = 0;
    const segCount = Math.floor(segIndex);
    for (let i = 1; i <= segCount; i++) {
      const wz = playerZ + i * SEGMENT_LENGTH;
      const seg = road.getSegmentAt(wz);
      const s = CAMERA_DEPTH / i;
      cumulativeX += seg.curve * s * 2;
    }

    const roadCenterX = this.screenWidth / 2 + cumulativeX * this.screenWidth * 0.3;
    const screenX = roadCenterX + spriteWorldX * scale * this.screenWidth * WIDTH_FACTOR;

    if (screenY < 0 || screenY > this.screenHeight) return null;

    return { screenX, screenY, scale };
  }
}
