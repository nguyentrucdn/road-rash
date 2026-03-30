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

  /** Project all visible segments with curve and hill effects.
   *  The nearest segment is ALWAYS at screen center. Each subsequent segment
   *  shifts relative to the previous one by (curve * CURVE_PX_PER_SEG) pixels.
   *  This creates the classic pseudo-3D road bend visual. */
  projectAll(road: Road, playerZ: number, _playerX: number = 0): ProjectedSegment[] {
    const results: ProjectedSegment[] = [];
    const CURVE_PX = 2.0;  // pixels of horizontal shift per segment per unit of curve
    const HILL_PX = 1.5;   // pixels of vertical shift per segment per unit of hill

    // Start at screen center — nearest segment is always centered
    let runningX = this.screenWidth / 2;
    let runningY = 0; // cumulative hill offset in pixels

    for (let i = 1; i <= DRAW_DISTANCE; i++) {
      const worldZ = playerZ + i * SEGMENT_LENGTH;
      const seg = road.getSegmentAt(worldZ);
      const scale = CAMERA_DEPTH / i;

      // Each segment shifts from the previous one — linear accumulation
      runningX += seg.curve * CURVE_PX;
      runningY += seg.hill * HILL_PX;

      const screenY = this.roadY + (this.screenHeight - this.roadY) * scale + runningY;
      const screenWidth = seg.width * scale * this.screenWidth * WIDTH_FACTOR;

      if (screenY < 0 || screenY > this.screenHeight) continue;

      results.push({
        screenX: runningX,
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

  /** Get screen position for a sprite at given world coordinates.
   *  Uses the same segment-relative curve accumulation as projectAll. */
  projectSprite(
    spriteWorldX: number,
    spriteWorldZ: number,
    playerZ: number,
    playerX: number,
    road: Road,
  ): { screenX: number; screenY: number; scale: number } | null {
    const dz = spriteWorldZ - playerZ;
    if (dz <= 0 || dz > DRAW_DISTANCE * SEGMENT_LENGTH) return null;

    const segIndex = dz / SEGMENT_LENGTH;
    if (segIndex < 0.5) return null;
    const scale = CAMERA_DEPTH / segIndex;
    const screenY = this.roadY + (this.screenHeight - this.roadY) * scale;

    // Same curve accumulation as projectAll — segment-relative, starting from center
    const CURVE_PX = 2.0;
    let roadCenterX = this.screenWidth / 2;
    const segCount = Math.floor(segIndex);
    for (let i = 1; i <= segCount; i++) {
      const wz = playerZ + i * SEGMENT_LENGTH;
      const seg = road.getSegmentAt(wz);
      roadCenterX += seg.curve * CURVE_PX;
    }

    // Sprite lateral position relative to player
    const relativeX = spriteWorldX - playerX;
    const screenX = roadCenterX + relativeX * scale * this.screenWidth * WIDTH_FACTOR;

    if (screenY < 0 || screenY > this.screenHeight) return null;

    return { screenX, screenY, scale };
  }
}
