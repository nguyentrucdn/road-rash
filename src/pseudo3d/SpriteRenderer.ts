// src/pseudo3d/SpriteRenderer.ts
import { RoadProjection } from '@/pseudo3d/RoadProjection';
import { Road } from '@/world/Road';
import { SpriteSheet } from '@/pseudo3d/SpriteSheet';

export class SpriteRenderer {
  constructor(
    private sprites: SpriteSheet,
    private projection: RoadProjection,
  ) {}

  drawBike(
    ctx: CanvasRenderingContext2D,
    id: string,
    frame: string,
    worldX: number,
    worldZ: number,
    playerZ: number,
    road: Road,
  ): void {
    const pos = this.projection.projectSprite(worldX, worldZ, playerZ, road);
    if (!pos) return;

    const frames = this.sprites.getBikeFrames(id);
    if (!frames) return;
    const sprite = frames[frame] ?? frames.center;
    if (!sprite) return;

    const w = sprite.width * pos.scale * 3;
    const h = sprite.height * pos.scale * 3;

    try {
      ctx.drawImage(sprite, pos.screenX - w / 2, pos.screenY - h, w, h);
    } catch { /* skip if canvas not drawable (test env) */ }
  }

  drawPlayerBike(
    ctx: CanvasRenderingContext2D,
    frame: string,
    screenWidth: number,
    screenHeight: number,
  ): void {
    const frames = this.sprites.getBikeFrames('player');
    if (!frames) return;
    const sprite = frames[frame] ?? frames.center;
    if (!sprite) return;

    const scale = 3.5;
    const w = sprite.width * scale;
    const h = sprite.height * scale;
    const x = screenWidth / 2 - w / 2;
    const y = screenHeight * 0.75 - h;

    try {
      ctx.drawImage(sprite, x, y, w, h);
    } catch { /* skip in test env */ }
  }

  drawVehicle(
    ctx: CanvasRenderingContext2D,
    vehicleType: string,
    direction: 1 | -1,
    worldX: number,
    worldZ: number,
    playerZ: number,
    road: Road,
  ): void {
    const pos = this.projection.projectSprite(worldX, worldZ, playerZ, road);
    if (!pos) return;

    const sprites = this.sprites.getVehicleSprite(vehicleType);
    if (!sprites) return;
    const sprite = direction === 1 ? sprites.rear : sprites.front;

    const w = sprite.width * pos.scale * 4;
    const h = sprite.height * pos.scale * 4;

    try {
      ctx.drawImage(sprite, pos.screenX - w / 2, pos.screenY - h, w, h);
    } catch { /* skip in test env */ }
  }
}
