// src/pseudo3d/PseudoRenderer.ts
import { RoadProjection } from '@/pseudo3d/RoadProjection';
import { RoadDrawer } from '@/pseudo3d/RoadDrawer';
import { SkyDrawer } from '@/pseudo3d/SkyDrawer';
import { SpriteSheet } from '@/pseudo3d/SpriteSheet';
import { SpriteRenderer } from '@/pseudo3d/SpriteRenderer';
import { SceneryRenderer, SceneryPlacement } from '@/pseudo3d/SceneryRenderer';
import { ParallaxLayer } from '@/pseudo3d/ParallaxLayer';
import { WeatherOverlay } from '@/pseudo3d/WeatherOverlay';
import { CanvasHUD } from '@/pseudo3d/CanvasHUD';
import { Road } from '@/world/Road';
import { Bike } from '@/entities/Bike';
import { SEGMENT_LENGTH } from '@/world/RoadSegment';
import { WeatherProperties } from '@/effects/WeatherSystem';

export interface RenderState {
  road: Road;
  playerBike: Bike;
  playerFrame: string;
  aiBikes: { bike: Bike; personality: string; frame: string }[];
  traffic: { x: number; z: number; type: string; direction: 1 | -1 }[];
  position: number;
  raceTime: number;
  weather: WeatherProperties;
  dt: number;
}

export class PseudoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private projection: RoadProjection;
  private roadDrawer: RoadDrawer;
  private skyDrawer: SkyDrawer;
  private sprites: SpriteSheet;
  private spriteRenderer: SpriteRenderer;
  private sceneryRenderer: SceneryRenderer;
  private parallax: ParallaxLayer;
  private weatherOverlay: WeatherOverlay;
  private hud: CanvasHUD;
  private curveAccumulator = 0;

  constructor(canvas: HTMLCanvasElement, trackName: string) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false; // pixelated look

    this.projection = new RoadProjection(canvas.width, canvas.height);
    this.roadDrawer = new RoadDrawer(trackName);
    this.skyDrawer = new SkyDrawer(trackName);
    this.sprites = new SpriteSheet();
    this.spriteRenderer = new SpriteRenderer(this.sprites, this.projection);
    this.sceneryRenderer = new SceneryRenderer(this.sprites, this.projection);
    this.parallax = new ParallaxLayer(trackName, canvas.width);
    this.weatherOverlay = new WeatherOverlay();
    this.hud = new CanvasHUD();
  }

  /** Call once after construction to generate scenery placements. */
  initScenery(segmentCount: number, sceneryTypes: string[], density: number): void {
    this.sceneryRenderer.generatePlacements(segmentCount, SEGMENT_LENGTH, sceneryTypes, density);
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.projection.resize(w, h);
    this.ctx.imageSmoothingEnabled = false;
  }

  render(state: RenderState): void {
    const { road, playerBike, playerFrame, aiBikes, traffic, position, raceTime, weather, dt } = state;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const playerZ = playerBike.z;
    const playerX = playerBike.x;
    const ctx = this.ctx;

    // Accumulate curve for parallax scrolling
    const seg = road.getSegmentAt(playerZ);
    this.curveAccumulator += seg.curve * playerBike.speed * dt * 0.5;

    // 1. Clear
    ctx.clearRect(0, 0, w, h);

    // 2. Sky
    this.skyDrawer.draw(ctx, w, this.projection.horizonY);

    // 3. Parallax
    this.parallax.updateScroll(this.curveAccumulator);
    this.parallax.draw(ctx, w, this.projection.horizonY);

    // 4. Road — pass playerX so road stays centered on player
    this.roadDrawer.draw(ctx, this.projection, road, playerZ, playerX, w, h);

    // 5. Collect all z-sorted drawables (scenery + traffic + AI bikes)

    // 5a. Scenery
    this.sceneryRenderer.draw(ctx, playerZ, playerX, road);

    // 5b. Traffic (sorted by Z, back to front)
    const sortedTraffic = [...traffic].sort((a, b) => b.z - a.z);
    for (const t of sortedTraffic) {
      if (t.z - playerZ < -20 || t.z - playerZ > 1500) continue;
      this.spriteRenderer.drawVehicle(ctx, t.type, t.direction, t.x, t.z, playerZ, playerX, road);
    }

    // 5c. AI bikes (sorted by Z, back to front)
    const sortedAi = [...aiBikes].sort((a, b) => b.bike.z - a.bike.z);
    for (const ai of sortedAi) {
      if (ai.bike.z - playerZ < -20 || ai.bike.z - playerZ > 1500) continue;
      this.spriteRenderer.drawBike(ctx, ai.personality, ai.frame, ai.bike.x, ai.bike.z, playerZ, playerX, road);
    }

    // 6. Player bike (fixed screen position)
    this.spriteRenderer.drawPlayerBike(ctx, playerFrame, w, h);

    // 7. Weather overlay
    this.weatherOverlay.draw(ctx, w, h, dt, weather, playerBike.speed);

    // 8. Speed lines at high speed
    if (playerBike.speed > playerBike.maxSpeed * 0.8) {
      const intensity = (playerBike.speed - playerBike.maxSpeed * 0.8) / (playerBike.maxSpeed * 0.2);
      ctx.strokeStyle = `rgba(255,255,255,${intensity * 0.3})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 10 * intensity; i++) {
        const y = Math.random() * h;
        const x = Math.random() * w;
        const len = 20 + Math.random() * 40;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();
      }
    }

    // 9. HUD
    this.hud.draw(ctx, w, h, playerBike, position, raceTime);
  }
}
