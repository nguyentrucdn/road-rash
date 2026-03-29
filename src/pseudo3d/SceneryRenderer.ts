// src/pseudo3d/SceneryRenderer.ts
import { RoadProjection } from '@/pseudo3d/RoadProjection';
import { Road } from '@/world/Road';
import { SpriteSheet } from '@/pseudo3d/SpriteSheet';

export interface SceneryPlacement {
  type: string;
  z: number;
  side: -1 | 1;
  offset: number; // distance from road edge
}

export class SceneryRenderer {
  private placements: SceneryPlacement[] = [];

  constructor(
    private sprites: SpriteSheet,
    private projection: RoadProjection,
  ) {}

  /** Generate scenery placements for a track. Call once at race start. */
  generatePlacements(segmentCount: number, segmentLength: number, sceneryTypes: string[], density: number): void {
    this.placements = [];
    for (let i = 0; i < segmentCount; i++) {
      if (Math.random() > density) continue;
      const type = sceneryTypes[Math.floor(Math.random() * sceneryTypes.length)];
      this.placements.push({
        type,
        z: i * segmentLength,
        side: Math.random() > 0.5 ? 1 : -1,
        offset: 8 + Math.random() * 15, // 8-23 meters from road center
      });
    }
    // Sort by Z for back-to-front rendering
    this.placements.sort((a, b) => b.z - a.z);
  }

  draw(ctx: CanvasRenderingContext2D, playerZ: number, road: Road): void {
    for (const p of this.placements) {
      const dz = p.z - playerZ;
      if (dz < -50 || dz > 1500) continue;

      const worldX = p.side * p.offset;
      const pos = this.projection.projectSprite(worldX, p.z, playerZ, road);
      if (!pos || pos.scale < 0.01) continue;

      const sprite = this.sprites.getScenerySprite(p.type);
      if (!sprite) continue;

      const w = sprite.width * pos.scale * 3;
      const h = sprite.height * pos.scale * 3;

      try {
        ctx.drawImage(sprite, pos.screenX - w / 2, pos.screenY - h, w, h);
      } catch { /* skip in test env */ }
    }
  }
}
