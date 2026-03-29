# Pseudo-3D Visual Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Three.js 3D rendering with a Genesis-era pseudo-3D Canvas2D renderer while keeping all game logic intact.

**Architecture:** A single `<canvas>` element with 2D context replaces the WebGL renderer. Road segments are projected as horizontal trapezoid bands. All entities become procedurally-drawn 2D sprites scaled by distance. Game physics, combat, AI, and audio are untouched.

**Tech Stack:** Canvas2D, TypeScript, Vite

**Spec:** `docs/specs/2026-03-29-pseudo3d-overhaul-design.md`

**Strategy:** Each task produces a working, playable game. We build the new pseudo-3D renderer alongside the old one, then swap in main.ts at the end. This avoids a broken game during development.

---

## File Structure

```
src/pseudo3d/
  PseudoRenderer.ts    — master renderer, orchestrates all Canvas2D drawing
  RoadProjection.ts    — segment→screen projection math (perspective, curves, hills)
  RoadDrawer.ts        — draws road trapezoids, shoulders, lane markings
  SpriteSheet.ts       — procedurally generates all sprite images at startup
  SpriteRenderer.ts    — draws scaled/positioned sprites on canvas
  SceneryRenderer.ts   — billboard scenery sprites at road edges
  ParallaxLayer.ts     — scrolling background strips
  SkyDrawer.ts         — gradient sky + flat clouds
  WeatherOverlay.ts    — rain/dust/snow/fog canvas effects
  CanvasHUD.ts         — pixel-font HUD (speed, position, health, weapon, timer)
  PixelFont.ts         — 5x7 bitmap font renderer
tests/pseudo3d/
  RoadProjection.test.ts
  SpriteSheet.test.ts
  PixelFont.test.ts
```

---

### Task 1: Road Projection Math

The core pseudo-3D engine. Pure math — no rendering yet.

**Files:**
- Create: `src/pseudo3d/RoadProjection.ts`
- Create: `tests/pseudo3d/RoadProjection.test.ts`

- [ ] **Step 1: Write RoadProjection tests**

```typescript
// tests/pseudo3d/RoadProjection.test.ts
import { describe, it, expect } from 'vitest';
import { RoadProjection } from '@/pseudo3d/RoadProjection';
import { desertTrack } from '@/tracks/desert';
import { Road } from '@/world/Road';

describe('RoadProjection', () => {
  it('projects a segment to screen coordinates', () => {
    const road = new Road(desertTrack);
    const proj = new RoadProjection(800, 600);
    const result = proj.project(10, road, 0); // z=10 segments ahead
    expect(result.screenY).toBeGreaterThan(0);
    expect(result.screenY).toBeLessThan(600);
    expect(result.screenWidth).toBeGreaterThan(0);
  });

  it('segments closer to camera are wider and lower', () => {
    const road = new Road(desertTrack);
    const proj = new RoadProjection(800, 600);
    const near = proj.project(5, road, 0);
    const far = proj.project(50, road, 0);
    expect(near.screenY).toBeGreaterThan(far.screenY); // near is lower on screen
    expect(near.screenWidth).toBeGreaterThan(far.screenWidth); // near is wider
  });

  it('segments beyond draw distance return null', () => {
    const road = new Road(desertTrack);
    const proj = new RoadProjection(800, 600);
    const result = proj.project(2000, road, 0);
    expect(result).toBeNull();
  });

  it('curve offset accumulates across segments', () => {
    const road = new Road(desertTrack);
    const proj = new RoadProjection(800, 600);
    // Desert track has curves starting around 10% (segment 60+)
    const projected = proj.projectAll(road, 300); // player at z=300 (segment 60)
    const hasOffset = projected.some(p => Math.abs(p.screenX - 400) > 5);
    expect(hasOffset).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run tests/pseudo3d/RoadProjection.test.ts
```

- [ ] **Step 3: Implement RoadProjection**

```typescript
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

const CAMERA_HEIGHT = 1500;
const CAMERA_DEPTH = 150;
const DRAW_DISTANCE = 300; // segments ahead

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
    const z = segmentsAhead * SEGMENT_LENGTH;

    const scale = CAMERA_DEPTH / z;
    const screenY = this.roadY + (this.screenHeight - this.roadY) * scale;

    if (screenY < this.roadY || screenY > this.screenHeight) return null;

    const screenWidth = seg.width * scale * this.screenWidth * 0.05;

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
      const z = i * SEGMENT_LENGTH;

      const scale = CAMERA_DEPTH / z;

      // Accumulate curve offset (horizontal shift)
      cumulativeX += seg.curve * scale * 2;
      // Accumulate hill offset (vertical shift)
      cumulativeY += seg.hill * scale * 1.5;

      const screenY = this.roadY + (this.screenHeight - this.roadY) * scale + cumulativeY;
      const screenX = this.screenWidth / 2 + cumulativeX * this.screenWidth * 0.3;
      const screenWidth = seg.width * scale * this.screenWidth * 0.05;

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

    const scale = CAMERA_DEPTH / (dz / SEGMENT_LENGTH);
    const screenY = this.roadY + (this.screenHeight - this.roadY) * scale;

    // Calculate cumulative curve offset up to this Z
    let cumulativeX = 0;
    const segCount = Math.floor(dz / SEGMENT_LENGTH);
    for (let i = 1; i <= segCount; i++) {
      const wz = playerZ + i * SEGMENT_LENGTH;
      const seg = road.getSegmentAt(wz);
      const s = CAMERA_DEPTH / i;
      cumulativeX += seg.curve * s * 2;
    }

    const roadCenterX = this.screenWidth / 2 + cumulativeX * this.screenWidth * 0.3;
    const screenX = roadCenterX + spriteWorldX * scale * this.screenWidth * 0.05;

    if (screenY < 0 || screenY > this.screenHeight) return null;

    return { screenX, screenY, scale };
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/pseudo3d/RoadProjection.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pseudo3d/RoadProjection.ts tests/pseudo3d/RoadProjection.test.ts
git commit -m "feat: add pseudo-3D road projection math"
```

---

### Task 2: Road Drawer — Trapezoid Bands

**Files:**
- Create: `src/pseudo3d/RoadDrawer.ts`
- Create: `src/pseudo3d/SkyDrawer.ts`

- [ ] **Step 1: Implement SkyDrawer**

```typescript
// src/pseudo3d/SkyDrawer.ts
export interface SkyConfig {
  topColor: string;
  horizonColor: string;
  clouds: { x: number; y: number; width: number; height: number }[];
}

const TRACK_SKY: Record<string, { top: string; horizon: string }> = {
  'Desert Highway':  { top: '#4488cc', horizon: '#ffddaa' },
  'Pacific Coast':   { top: '#2266bb', horizon: '#aaddff' },
  'Downtown Rush':   { top: '#445566', horizon: '#889999' },
  'Mountain Pass':   { top: '#3355aa', horizon: '#ccddee' },
  'Night Highway':   { top: '#060618', horizon: '#1a1a3a' },
  'Canyon Run':      { top: '#cc6633', horizon: '#ffcc88' },
};

export class SkyDrawer {
  private topColor: string;
  private horizonColor: string;
  private clouds: { x: number; y: number; w: number; h: number; speed: number }[] = [];

  constructor(trackName: string) {
    const sky = TRACK_SKY[trackName] ?? TRACK_SKY['Desert Highway'];
    this.topColor = sky.top;
    this.horizonColor = sky.horizon;

    const isNight = trackName === 'Night Highway';
    const count = isNight ? 3 : 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      this.clouds.push({
        x: Math.random() * 2000 - 200,
        y: Math.random() * 60,
        w: 60 + Math.random() * 120,
        h: 15 + Math.random() * 25,
        speed: 0.3 + Math.random() * 1.0,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, horizonY: number): void {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, horizonY);
    grad.addColorStop(0, this.topColor);
    grad.addColorStop(1, this.horizonColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, horizonY);

    // Clouds
    ctx.fillStyle = this.topColor === '#060618' ? 'rgba(40,40,60,0.3)' : 'rgba(255,255,255,0.7)';
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * 0.016; // ~1 frame at 60fps
      if (cloud.x > width + 100) cloud.x = -cloud.w - 50;

      const cx = cloud.x;
      const cy = horizonY - 40 - cloud.y;
      // Puffy cloud shape: 3 overlapping rounded rects
      ctx.beginPath();
      ctx.ellipse(cx + cloud.w * 0.3, cy, cloud.w * 0.3, cloud.h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + cloud.w * 0.55, cy - cloud.h * 0.15, cloud.w * 0.25, cloud.h * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + cloud.w * 0.75, cy + cloud.h * 0.05, cloud.w * 0.22, cloud.h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
```

- [ ] **Step 2: Implement RoadDrawer**

```typescript
// src/pseudo3d/RoadDrawer.ts
import { ProjectedSegment, RoadProjection } from '@/pseudo3d/RoadProjection';
import { Road } from '@/world/Road';

export interface TrackColors {
  road1: string;
  road2: string;
  grass1: string;
  grass2: string;
  shoulder1: string;
  shoulder2: string;
  line: string;
  rumble1: string;
  rumble2: string;
}

const TRACK_COLORS: Record<string, TrackColors> = {
  'Desert Highway': {
    road1: '#555555', road2: '#606060',
    grass1: '#c2a050', grass2: '#b89040',
    shoulder1: '#8b7355', shoulder2: '#7a6245',
    line: '#cccccc', rumble1: '#cc3333', rumble2: '#ffffff',
  },
  'Pacific Coast': {
    road1: '#555555', road2: '#606060',
    grass1: '#3a7a2a', grass2: '#2d6a1e',
    shoulder1: '#6a6a4a', shoulder2: '#5a5a3a',
    line: '#cccccc', rumble1: '#cc3333', rumble2: '#ffffff',
  },
  'Downtown Rush': {
    road1: '#444444', road2: '#505050',
    grass1: '#555555', grass2: '#4a4a4a',
    shoulder1: '#666666', shoulder2: '#585858',
    line: '#dddddd', rumble1: '#ffcc00', rumble2: '#333333',
  },
  'Mountain Pass': {
    road1: '#555555', road2: '#606060',
    grass1: '#2a5a2a', grass2: '#1e4a1e',
    shoulder1: '#5a5a3a', shoulder2: '#4a4a2a',
    line: '#cccccc', rumble1: '#cc3333', rumble2: '#ffffff',
  },
  'Night Highway': {
    road1: '#333333', road2: '#3a3a3a',
    grass1: '#1a2a1a', grass2: '#152515',
    shoulder1: '#444444', shoulder2: '#3a3a3a',
    line: '#999999', rumble1: '#cc3333', rumble2: '#eeeeee',
  },
  'Canyon Run': {
    road1: '#555555', road2: '#606060',
    grass1: '#aa5533', grass2: '#994422',
    shoulder1: '#885533', shoulder2: '#774422',
    line: '#cccccc', rumble1: '#cc3333', rumble2: '#ffffff',
  },
};

export class RoadDrawer {
  private colors: TrackColors;

  constructor(trackName: string) {
    this.colors = TRACK_COLORS[trackName] ?? TRACK_COLORS['Desert Highway'];
  }

  draw(
    ctx: CanvasRenderingContext2D,
    projection: RoadProjection,
    road: Road,
    playerZ: number,
    screenWidth: number,
    screenHeight: number,
  ): void {
    const segments = projection.projectAll(road, playerZ);
    if (segments.length < 2) return;

    // Draw from back (horizon) to front (camera) — painter's algorithm
    for (let i = segments.length - 2; i >= 0; i--) {
      const curr = segments[i];
      const next = segments[i + 1]; // further away segment (top edge)

      const band = Math.floor(curr.segmentIndex / 3) % 2; // alternate every 3 segments

      // Grass (full width background)
      ctx.fillStyle = band === 0 ? this.colors.grass1 : this.colors.grass2;
      ctx.fillRect(0, next.screenY, screenWidth, curr.screenY - next.screenY + 1);

      // Shoulder / rumble strip
      const shoulderW1 = curr.screenWidth * 1.3;
      const shoulderW2 = next.screenWidth * 1.3;

      ctx.fillStyle = band === 0 ? this.colors.shoulder1 : this.colors.shoulder2;
      this.drawTrapezoid(ctx, next.screenX, next.screenY, shoulderW2, curr.screenX, curr.screenY, shoulderW1);

      // Rumble strips (on shoulder edges)
      const rumbleW1 = curr.screenWidth * 1.15;
      const rumbleW2 = next.screenWidth * 1.15;
      ctx.fillStyle = band === 0 ? this.colors.rumble1 : this.colors.rumble2;
      // Left rumble
      this.drawTrapezoidSide(ctx, next.screenX, next.screenY, next.screenWidth, rumbleW2, curr.screenX, curr.screenY, curr.screenWidth, rumbleW1, -1);
      // Right rumble
      this.drawTrapezoidSide(ctx, next.screenX, next.screenY, next.screenWidth, rumbleW2, curr.screenX, curr.screenY, curr.screenWidth, rumbleW1, 1);

      // Road surface
      ctx.fillStyle = band === 0 ? this.colors.road1 : this.colors.road2;
      this.drawTrapezoid(ctx, next.screenX, next.screenY, next.screenWidth, curr.screenX, curr.screenY, curr.screenWidth);

      // Center dashed line
      const dashPhase = Math.floor(curr.segmentIndex / 4) % 2;
      if (dashPhase === 0) {
        const lineW1 = Math.max(1, curr.scale * 3);
        const lineW2 = Math.max(1, next.scale * 3);
        ctx.fillStyle = this.colors.line;
        this.drawTrapezoid(ctx, next.screenX, next.screenY, lineW2, curr.screenX, curr.screenY, lineW1);
      }

      // Edge lines (solid)
      const edgeW = Math.max(1, curr.scale * 2);
      ctx.fillStyle = this.colors.line;
      // Left edge
      ctx.fillRect(curr.screenX - curr.screenWidth / 2 - edgeW / 2, curr.screenY - 1, edgeW, 2);
      // Right edge
      ctx.fillRect(curr.screenX + curr.screenWidth / 2 - edgeW / 2, curr.screenY - 1, edgeW, 2);
    }
  }

  /** Draw a filled trapezoid between two horizontal lines. */
  private drawTrapezoid(
    ctx: CanvasRenderingContext2D,
    topX: number, topY: number, topW: number,
    botX: number, botY: number, botW: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(topX - topW / 2, topY);
    ctx.lineTo(topX + topW / 2, topY);
    ctx.lineTo(botX + botW / 2, botY);
    ctx.lineTo(botX - botW / 2, botY);
    ctx.closePath();
    ctx.fill();
  }

  /** Draw a side strip (rumble) between road edge and shoulder edge. */
  private drawTrapezoidSide(
    ctx: CanvasRenderingContext2D,
    topX: number, topY: number, topRoadW: number, topOuterW: number,
    botX: number, botY: number, botRoadW: number, botOuterW: number,
    side: -1 | 1,
  ): void {
    const ti = side === -1 ? -topRoadW / 2 : topRoadW / 2;
    const to = side === -1 ? -topOuterW / 2 : topOuterW / 2;
    const bi = side === -1 ? -botRoadW / 2 : botRoadW / 2;
    const bo = side === -1 ? -botOuterW / 2 : botOuterW / 2;

    ctx.beginPath();
    ctx.moveTo(topX + ti, topY);
    ctx.lineTo(topX + to, topY);
    ctx.lineTo(botX + bo, botY);
    ctx.lineTo(botX + bi, botY);
    ctx.closePath();
    ctx.fill();
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pseudo3d/SkyDrawer.ts src/pseudo3d/RoadDrawer.ts
git commit -m "feat: add pseudo-3D sky and road band drawer"
```

---

### Task 3: Sprite Sheet Generator

**Files:**
- Create: `src/pseudo3d/SpriteSheet.ts`
- Create: `tests/pseudo3d/SpriteSheet.test.ts`

- [ ] **Step 1: Write SpriteSheet tests**

```typescript
// tests/pseudo3d/SpriteSheet.test.ts
import { describe, it, expect } from 'vitest';
import { SpriteSheet } from '@/pseudo3d/SpriteSheet';

describe('SpriteSheet', () => {
  it('generates player bike sprite frames', () => {
    const sheet = new SpriteSheet();
    const frames = sheet.getBikeFrames('player');
    expect(frames.center).toBeDefined();
    expect(frames.lean_left).toBeDefined();
    expect(frames.lean_right).toBeDefined();
    expect(frames.punch_left).toBeDefined();
    expect(frames.punch_right).toBeDefined();
    expect(frames.crash).toBeDefined();
  });

  it('generates all 6 vehicle types', () => {
    const sheet = new SpriteSheet();
    const types = ['sedan', 'pickup', 'suv', 'bus', 'semi', 'sports'];
    for (const type of types) {
      const sprites = sheet.getVehicleSprite(type);
      expect(sprites.rear).toBeDefined();
      expect(sprites.front).toBeDefined();
    }
  });

  it('generates scenery sprites for desert', () => {
    const sheet = new SpriteSheet();
    const cactus = sheet.getScenerySprite('cactus');
    expect(cactus).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npx vitest run tests/pseudo3d/SpriteSheet.test.ts
```

- [ ] **Step 3: Implement SpriteSheet**

This is a large file. Create `src/pseudo3d/SpriteSheet.ts` with the following structure. Each sprite is procedurally drawn to an offscreen canvas.

```typescript
// src/pseudo3d/SpriteSheet.ts
export type BikeFrame = 'center' | 'lean_left' | 'lean_right' | 'punch_left' | 'punch_right' | 'kick_left' | 'kick_right' | 'crash';

export interface BikeFrameSet {
  [key: string]: OffscreenCanvas;
  center: OffscreenCanvas;
  lean_left: OffscreenCanvas;
  lean_right: OffscreenCanvas;
  punch_left: OffscreenCanvas;
  punch_right: OffscreenCanvas;
  kick_left: OffscreenCanvas;
  kick_right: OffscreenCanvas;
  crash: OffscreenCanvas;
}

export interface VehicleSpriteSet {
  rear: OffscreenCanvas;
  front: OffscreenCanvas;
}

const BIKE_W = 64;
const BIKE_H = 64;
const VEHICLE_W = 80;
const VEHICLE_H = 48;
const SCENERY_W = 64;
const SCENERY_H = 128;

function makeCanvas(w: number, h: number): OffscreenCanvas {
  // Use regular canvas for Node.js (vitest) compatibility
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(w, h);
  }
  // Fallback for test environment
  const c = { width: w, height: h, getContext: () => null } as unknown as OffscreenCanvas;
  return c;
}

function getCtx(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D | null {
  return canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
}

export class SpriteSheet {
  private bikeFrames = new Map<string, BikeFrameSet>();
  private vehicleSprites = new Map<string, VehicleSpriteSet>();
  private scenerySprites = new Map<string, OffscreenCanvas>();
  private vehicleColorPalette = ['#ffffff', '#222222', '#c0c0c0', '#cc2222', '#2244cc', '#225522', '#ddcc88', '#555555', '#661122', '#112244'];

  constructor() {
    this.generatePlayerBike();
    this.generateAiBikes();
    this.generateVehicles();
    this.generateScenery();
  }

  getBikeFrames(id: string): BikeFrameSet {
    return this.bikeFrames.get(id)!;
  }

  getVehicleSprite(type: string): VehicleSpriteSet {
    return this.vehicleSprites.get(type)!;
  }

  getScenerySprite(type: string): OffscreenCanvas {
    return this.scenerySprites.get(type)!;
  }

  getRandomVehicleColor(): string {
    return this.vehicleColorPalette[Math.floor(Math.random() * this.vehicleColorPalette.length)];
  }

  private generatePlayerBike(): void {
    this.bikeFrames.set('player', this.drawBikeFrames('#cc2200', '#2244aa'));
  }

  private generateAiBikes(): void {
    this.bikeFrames.set('aggressive', this.drawBikeFrames('#ff8800', '#884400'));
    this.bikeFrames.set('defensive', this.drawBikeFrames('#44aa44', '#225522'));
    this.bikeFrames.set('racer', this.drawBikeFrames('#8844ff', '#442288'));
  }

  private drawBikeFrames(bikeColor: string, riderColor: string): BikeFrameSet {
    const frames: Partial<BikeFrameSet> = {};
    const frameNames: BikeFrame[] = ['center', 'lean_left', 'lean_right', 'punch_left', 'punch_right', 'kick_left', 'kick_right', 'crash'];

    for (const frame of frameNames) {
      const canvas = makeCanvas(BIKE_W, BIKE_H);
      const ctx = getCtx(canvas);
      if (!ctx) { frames[frame] = canvas; continue; }

      const cx = BIKE_W / 2;
      const cy = BIKE_H / 2;
      const lean = frame === 'lean_left' ? -5 : frame === 'lean_right' ? 5 : 0;

      if (frame === 'crash') {
        // Tumbling rider + sideways bike
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(0.7);
        // Bike body (sideways)
        ctx.fillStyle = bikeColor;
        ctx.fillRect(-15, -3, 30, 6);
        // Wheels
        ctx.fillStyle = '#111111';
        ctx.beginPath(); ctx.arc(-12, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(12, 0, 5, 0, Math.PI * 2); ctx.fill();
        // Rider tumbling
        ctx.fillStyle = riderColor;
        ctx.fillRect(5, -15, 8, 12);
        // Head
        ctx.fillStyle = '#ffcc88';
        ctx.beginPath(); ctx.arc(9, -18, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        // Normal bike rendering
        ctx.save();
        ctx.translate(cx + lean, cy);

        // Wheels
        ctx.fillStyle = '#111111';
        ctx.beginPath(); ctx.arc(-1, 12, 6, 0, Math.PI * 2); ctx.fill(); // rear
        ctx.beginPath(); ctx.arc(-1, -10, 5, 0, Math.PI * 2); ctx.fill(); // front

        // Bike frame
        ctx.fillStyle = bikeColor;
        ctx.fillRect(-5, -8, 10, 18);

        // Engine
        ctx.fillStyle = '#333333';
        ctx.fillRect(-4, 2, 8, 5);

        // Handlebars
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(-8, -12, 16, 2);

        // Rider torso
        ctx.fillStyle = riderColor;
        ctx.fillRect(-6, -22, 12, 14);

        // Head + helmet
        ctx.fillStyle = riderColor;
        ctx.beginPath(); ctx.arc(0, -26, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffcc88';
        ctx.beginPath(); ctx.arc(0, -26, 3, 0, Math.PI * 2); ctx.fill();

        // Arms
        ctx.fillStyle = riderColor;
        if (frame === 'punch_left') {
          ctx.fillRect(-18, -20, 14, 3); // arm extended left
        } else if (frame === 'punch_right') {
          ctx.fillRect(4, -20, 14, 3); // arm extended right
        } else if (frame === 'kick_left') {
          ctx.fillRect(-16, -5, 12, 3); // leg kick left
        } else if (frame === 'kick_right') {
          ctx.fillRect(4, -5, 12, 3); // leg kick right
        } else {
          // Arms on handlebars
          ctx.fillRect(-9, -18, 4, 8);
          ctx.fillRect(5, -18, 4, 8);
        }

        // Legs
        ctx.fillStyle = '#333344';
        ctx.fillRect(-5, -6, 4, 10);
        ctx.fillRect(1, -6, 4, 10);

        // Exhaust
        ctx.fillStyle = '#888888';
        ctx.fillRect(5, 4, 3, 8);

        ctx.restore();
      }

      frames[frame] = canvas;
    }

    return frames as BikeFrameSet;
  }

  private generateVehicles(): void {
    const types = ['sedan', 'pickup', 'suv', 'bus', 'semi', 'sports'];
    for (const type of types) {
      this.vehicleSprites.set(type, {
        rear: this.drawVehicleRear(type),
        front: this.drawVehicleFront(type),
      });
    }
  }

  private drawVehicleRear(type: string): OffscreenCanvas {
    const canvas = makeCanvas(VEHICLE_W, VEHICLE_H);
    const ctx = getCtx(canvas);
    if (!ctx) return canvas;

    const cx = VEHICLE_W / 2;
    const by = VEHICLE_H;
    const color = '#6688aa'; // base color, overridden at draw time

    switch (type) {
      case 'sedan': {
        ctx.fillStyle = color;
        ctx.fillRect(12, 12, 56, 28); // body
        ctx.fillRect(16, 4, 48, 12); // cabin
        // Rear window
        ctx.fillStyle = '#223344';
        ctx.fillRect(20, 5, 40, 9);
        // Taillights
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(13, 15, 6, 4);
        ctx.fillRect(61, 15, 6, 4);
        // License plate
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(30, 32, 20, 6);
        // Wheels
        ctx.fillStyle = '#111111';
        ctx.fillRect(8, 36, 10, 8);
        ctx.fillRect(62, 36, 10, 8);
        break;
      }
      case 'pickup': {
        ctx.fillStyle = color;
        ctx.fillRect(10, 8, 60, 18); // cab
        ctx.fillRect(12, 26, 56, 14); // bed walls
        // Rear window
        ctx.fillStyle = '#223344';
        ctx.fillRect(16, 9, 48, 10);
        // Taillights
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(12, 28, 5, 4);
        ctx.fillRect(63, 28, 5, 4);
        // Tailgate
        ctx.fillStyle = '#555555';
        ctx.fillRect(15, 30, 50, 8);
        // Wheels
        ctx.fillStyle = '#111111';
        ctx.fillRect(6, 38, 12, 8);
        ctx.fillRect(62, 38, 12, 8);
        break;
      }
      case 'suv': {
        ctx.fillStyle = color;
        ctx.fillRect(10, 4, 60, 36); // tall body
        // Rear window
        ctx.fillStyle = '#223344';
        ctx.fillRect(16, 6, 48, 14);
        // Spare tire
        ctx.fillStyle = '#222222';
        ctx.beginPath(); ctx.arc(40, 30, 7, 0, Math.PI * 2); ctx.fill();
        // Taillights
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(11, 22, 5, 6);
        ctx.fillRect(64, 22, 5, 6);
        // Wheels
        ctx.fillStyle = '#111111';
        ctx.fillRect(6, 38, 12, 8);
        ctx.fillRect(62, 38, 12, 8);
        break;
      }
      case 'bus': {
        ctx.fillStyle = '#ccaa22';
        ctx.fillRect(4, 2, 72, 38); // big body
        // Stripe
        ctx.fillStyle = '#885500';
        ctx.fillRect(4, 20, 72, 6);
        // Rear window
        ctx.fillStyle = '#223344';
        ctx.fillRect(20, 4, 40, 14);
        // Lights
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(5, 28, 6, 4);
        ctx.fillRect(69, 28, 6, 4);
        // Wheels
        ctx.fillStyle = '#111111';
        ctx.fillRect(2, 40, 10, 6);
        ctx.fillRect(68, 40, 10, 6);
        break;
      }
      case 'semi': {
        // Trailer rear
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(4, 0, 72, 38);
        // Rear doors
        ctx.fillStyle = '#888888';
        ctx.fillRect(6, 2, 34, 34);
        ctx.fillRect(42, 2, 34, 34);
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        ctx.strokeRect(6, 2, 34, 34);
        ctx.strokeRect(42, 2, 34, 34);
        // Reflectors
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(8, 30, 4, 4);
        ctx.fillRect(68, 30, 4, 4);
        // Mud flaps
        ctx.fillStyle = '#222222';
        ctx.fillRect(10, 38, 8, 6);
        ctx.fillRect(62, 38, 8, 6);
        // Wheels (dual axle)
        ctx.fillStyle = '#111111';
        ctx.fillRect(2, 40, 8, 6);
        ctx.fillRect(14, 40, 8, 6);
        ctx.fillRect(58, 40, 8, 6);
        ctx.fillRect(70, 40, 8, 6);
        break;
      }
      case 'sports': {
        ctx.fillStyle = color;
        ctx.fillRect(8, 18, 64, 18); // low wide body
        ctx.fillRect(14, 12, 52, 10); // low cabin
        // Rear window
        ctx.fillStyle = '#223344';
        ctx.fillRect(18, 13, 44, 7);
        // Big taillights
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(9, 20, 8, 3);
        ctx.fillRect(63, 20, 8, 3);
        // Spoiler
        ctx.fillStyle = '#333333';
        ctx.fillRect(12, 10, 56, 2);
        ctx.fillRect(16, 8, 2, 4);
        ctx.fillRect(62, 8, 2, 4);
        // Exhaust tips
        ctx.fillStyle = '#888888';
        ctx.fillRect(28, 34, 4, 3);
        ctx.fillRect(48, 34, 4, 3);
        // Wide wheels
        ctx.fillStyle = '#111111';
        ctx.fillRect(4, 34, 12, 8);
        ctx.fillRect(64, 34, 12, 8);
        break;
      }
    }

    return canvas;
  }

  private drawVehicleFront(type: string): OffscreenCanvas {
    const canvas = makeCanvas(VEHICLE_W, VEHICLE_H);
    const ctx = getCtx(canvas);
    if (!ctx) return canvas;

    const color = '#6688aa';

    switch (type) {
      case 'sedan':
      case 'suv':
      case 'pickup':
      case 'sports': {
        const tall = type === 'suv' || type === 'pickup';
        const low = type === 'sports';
        const bodyY = low ? 20 : tall ? 4 : 12;
        const bodyH = low ? 16 : tall ? 36 : 28;
        ctx.fillStyle = color;
        ctx.fillRect(12, bodyY, 56, bodyH);
        // Windshield
        ctx.fillStyle = '#4477aa';
        ctx.fillRect(16, bodyY + 2, 48, low ? 6 : 12);
        // Headlights
        ctx.fillStyle = '#ffffcc';
        ctx.fillRect(13, bodyY + (low ? 8 : 14), 6, 4);
        ctx.fillRect(61, bodyY + (low ? 8 : 14), 6, 4);
        // Grille
        ctx.fillStyle = '#333333';
        ctx.fillRect(24, bodyY + bodyH - 8, 32, 6);
        // Wheels
        ctx.fillStyle = '#111111';
        ctx.fillRect(8, 38, 10, 8);
        ctx.fillRect(62, 38, 10, 8);
        break;
      }
      case 'bus': {
        ctx.fillStyle = '#ccaa22';
        ctx.fillRect(4, 2, 72, 38);
        ctx.fillStyle = '#4477aa';
        ctx.fillRect(8, 4, 64, 16); // big windshield
        ctx.fillStyle = '#333333';
        ctx.fillRect(20, 22, 40, 8); // grille
        ctx.fillStyle = '#ffffcc';
        ctx.fillRect(6, 24, 8, 4);
        ctx.fillRect(66, 24, 8, 4);
        ctx.fillStyle = '#111111';
        ctx.fillRect(2, 40, 10, 6);
        ctx.fillRect(68, 40, 10, 6);
        break;
      }
      case 'semi': {
        ctx.fillStyle = '#888888';
        ctx.fillRect(8, 0, 64, 32); // cab
        ctx.fillStyle = '#4477aa';
        ctx.fillRect(12, 2, 56, 14); // windshield
        ctx.fillStyle = '#333333';
        ctx.fillRect(20, 18, 40, 10); // grille
        ctx.fillStyle = '#ffffcc';
        ctx.fillRect(10, 20, 6, 4);
        ctx.fillRect(64, 20, 6, 4);
        // Exhaust stacks
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(6, 0, 3, 20);
        ctx.fillRect(71, 0, 3, 20);
        ctx.fillStyle = '#111111';
        ctx.fillRect(4, 38, 10, 8);
        ctx.fillRect(66, 38, 10, 8);
        break;
      }
    }

    return canvas;
  }

  private generateScenery(): void {
    this.scenerySprites.set('cactus', this.drawCactus());
    this.scenerySprites.set('palm_tree', this.drawPalmTree());
    this.scenerySprites.set('pine_tree', this.drawPineTree());
    this.scenerySprites.set('rock', this.drawRock());
    this.scenerySprites.set('building', this.drawBuilding());
    this.scenerySprites.set('mesa', this.drawMesa());
    this.scenerySprites.set('sign', this.drawSign());
    this.scenerySprites.set('light_post', this.drawLightPost());
  }

  private drawCactus(): OffscreenCanvas {
    const c = makeCanvas(SCENERY_W, SCENERY_H);
    const ctx = getCtx(c);
    if (!ctx) return c;
    // Main trunk
    ctx.fillStyle = '#2d7a27';
    ctx.fillRect(26, 30, 12, 80);
    // Arms
    ctx.fillRect(10, 50, 18, 8);
    ctx.fillRect(10, 40, 8, 18);
    ctx.fillRect(38, 60, 16, 8);
    ctx.fillRect(46, 45, 8, 23);
    // Spines (dots)
    ctx.fillStyle = '#4a9a44';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect(27 + Math.random() * 10, 32 + Math.random() * 76, 2, 2);
    }
    return c;
  }

  private drawPalmTree(): OffscreenCanvas {
    const c = makeCanvas(SCENERY_W, SCENERY_H);
    const ctx = getCtx(c);
    if (!ctx) return c;
    // Trunk (curved)
    ctx.fillStyle = '#8b6914';
    ctx.beginPath();
    ctx.moveTo(28, 120);
    ctx.quadraticCurveTo(26, 70, 32, 30);
    ctx.lineTo(36, 30);
    ctx.quadraticCurveTo(30, 70, 36, 120);
    ctx.fill();
    // Trunk rings
    ctx.strokeStyle = '#6a5010';
    ctx.lineWidth = 1;
    for (let y = 35; y < 115; y += 8) {
      ctx.beginPath();
      ctx.moveTo(27, y);
      ctx.lineTo(37, y);
      ctx.stroke();
    }
    // Fronds
    ctx.fillStyle = '#1a7a10';
    const frondAngles = [-2.5, -1.8, -1.0, -0.3, 0.3, 1.0, 1.8, 2.5];
    for (const angle of frondAngles) {
      ctx.save();
      ctx.translate(33, 28);
      ctx.rotate(angle);
      ctx.fillRect(-3, -35, 6, 35);
      // Leaflets
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(-8, -30 + i * 5, 5, 3);
        ctx.fillRect(3, -28 + i * 5, 5, 3);
      }
      ctx.restore();
    }
    return c;
  }

  private drawPineTree(): OffscreenCanvas {
    const c = makeCanvas(SCENERY_W, SCENERY_H);
    const ctx = getCtx(c);
    if (!ctx) return c;
    // Trunk
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(28, 80, 8, 40);
    // Three cone layers
    ctx.fillStyle = '#1a4a1a';
    const layers = [
      { y: 15, w: 50, h: 35 },
      { y: 35, w: 42, h: 30 },
      { y: 55, w: 34, h: 28 },
    ];
    for (const l of layers) {
      ctx.beginPath();
      ctx.moveTo(32, l.y);
      ctx.lineTo(32 - l.w / 2, l.y + l.h);
      ctx.lineTo(32 + l.w / 2, l.y + l.h);
      ctx.fill();
    }
    // Snow tips
    ctx.fillStyle = '#ddeeff';
    ctx.beginPath();
    ctx.moveTo(32, 14);
    ctx.lineTo(24, 26);
    ctx.lineTo(40, 26);
    ctx.fill();
    return c;
  }

  private drawRock(): OffscreenCanvas {
    const c = makeCanvas(48, 48);
    const ctx = getCtx(c);
    if (!ctx) return c;
    ctx.fillStyle = '#777766';
    ctx.beginPath();
    ctx.moveTo(8, 40);
    ctx.lineTo(4, 25);
    ctx.lineTo(12, 10);
    ctx.lineTo(28, 6);
    ctx.lineTo(42, 12);
    ctx.lineTo(44, 30);
    ctx.lineTo(38, 42);
    ctx.closePath();
    ctx.fill();
    // Highlights
    ctx.fillStyle = '#999988';
    ctx.beginPath();
    ctx.moveTo(14, 12);
    ctx.lineTo(28, 8);
    ctx.lineTo(36, 14);
    ctx.lineTo(22, 20);
    ctx.fill();
    return c;
  }

  private drawBuilding(): OffscreenCanvas {
    const c = makeCanvas(SCENERY_W, SCENERY_H);
    const ctx = getCtx(c);
    if (!ctx) return c;
    // Main body
    ctx.fillStyle = '#777788';
    ctx.fillRect(8, 10, 48, 110);
    // Windows
    ctx.fillStyle = '#4477aa';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillRect(14 + col * 14, 16 + row * 12, 8, 8);
      }
    }
    // Roof edge
    ctx.fillStyle = '#555566';
    ctx.fillRect(6, 8, 52, 4);
    // Door
    ctx.fillStyle = '#443322';
    ctx.fillRect(24, 100, 16, 20);
    return c;
  }

  private drawMesa(): OffscreenCanvas {
    const c = makeCanvas(SCENERY_W * 2, SCENERY_H);
    const ctx = getCtx(c);
    if (!ctx) return c;
    ctx.fillStyle = '#cc7744';
    ctx.beginPath();
    ctx.moveTo(10, 120);
    ctx.lineTo(20, 30);
    ctx.lineTo(108, 30);
    ctx.lineTo(118, 120);
    ctx.fill();
    // Flat top
    ctx.fillStyle = '#dd8855';
    ctx.fillRect(20, 28, 88, 6);
    // Erosion lines
    ctx.strokeStyle = '#aa6633';
    ctx.lineWidth = 1;
    for (let y = 40; y < 115; y += 12) {
      ctx.beginPath();
      ctx.moveTo(15 + (y - 30) * 0.05, y);
      ctx.lineTo(113 - (y - 30) * 0.05, y);
      ctx.stroke();
    }
    return c;
  }

  private drawSign(): OffscreenCanvas {
    const c = makeCanvas(32, 80);
    const ctx = getCtx(c);
    if (!ctx) return c;
    // Post
    ctx.fillStyle = '#888888';
    ctx.fillRect(14, 30, 4, 50);
    // Sign face
    ctx.fillStyle = '#22aa22';
    ctx.fillRect(2, 4, 28, 28);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 8, 20, 20);
    // Arrow
    ctx.fillStyle = '#22aa22';
    ctx.beginPath();
    ctx.moveTo(10, 22);
    ctx.lineTo(22, 16);
    ctx.lineTo(10, 10);
    ctx.fill();
    return c;
  }

  private drawLightPost(): OffscreenCanvas {
    const c = makeCanvas(32, SCENERY_H);
    const ctx = getCtx(c);
    if (!ctx) return c;
    // Post
    ctx.fillStyle = '#555555';
    ctx.fillRect(14, 20, 4, 100);
    // Arm
    ctx.fillRect(14, 18, 14, 3);
    // Light fixture
    ctx.fillStyle = '#ffdd88';
    ctx.fillRect(24, 14, 6, 6);
    // Glow halo
    ctx.fillStyle = 'rgba(255,221,136,0.15)';
    ctx.beginPath();
    ctx.arc(27, 17, 12, 0, Math.PI * 2);
    ctx.fill();
    return c;
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/pseudo3d/SpriteSheet.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pseudo3d/SpriteSheet.ts tests/pseudo3d/SpriteSheet.test.ts
git commit -m "feat: add procedural sprite sheet generator for bikes, vehicles, scenery"
```

---

### Task 4: Sprite Renderer + Scenery Renderer + Parallax

**Files:**
- Create: `src/pseudo3d/SpriteRenderer.ts`
- Create: `src/pseudo3d/SceneryRenderer.ts`
- Create: `src/pseudo3d/ParallaxLayer.ts`

- [ ] **Step 1: Implement SpriteRenderer**

```typescript
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
```

- [ ] **Step 2: Implement SceneryRenderer**

```typescript
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
```

- [ ] **Step 3: Implement ParallaxLayer**

```typescript
// src/pseudo3d/ParallaxLayer.ts
const TRACK_LAYERS: Record<string, { far: { color: string; features: string }; mid: { color: string; features: string } }> = {
  'Desert Highway': {
    far: { color: '#cc8855', features: 'mesa' },
    mid: { color: '#bb9955', features: 'dunes' },
  },
  'Pacific Coast': {
    far: { color: '#2266aa', features: 'ocean' },
    mid: { color: '#3a8a3a', features: 'hills' },
  },
  'Downtown Rush': {
    far: { color: '#445566', features: 'skyline' },
    mid: { color: '#556677', features: 'buildings' },
  },
  'Mountain Pass': {
    far: { color: '#aabbcc', features: 'peaks' },
    mid: { color: '#2a5a2a', features: 'forest' },
  },
  'Night Highway': {
    far: { color: '#111122', features: 'skyline_dark' },
    mid: { color: '#0a1a0a', features: 'trees_dark' },
  },
  'Canyon Run': {
    far: { color: '#cc7744', features: 'canyon_walls' },
    mid: { color: '#aa5533', features: 'rock_formations' },
  },
};

export class ParallaxLayer {
  private farCanvas: OffscreenCanvas;
  private midCanvas: OffscreenCanvas;
  private farOffset = 0;
  private midOffset = 0;

  constructor(trackName: string, width: number) {
    const config = TRACK_LAYERS[trackName] ?? TRACK_LAYERS['Desert Highway'];
    const layerW = width * 3;

    this.farCanvas = this.generateLayer(layerW, 80, config.far.color, config.far.features);
    this.midCanvas = this.generateLayer(layerW, 100, config.mid.color, config.mid.features);
  }

  private generateLayer(w: number, h: number, color: string, features: string): OffscreenCanvas {
    if (typeof OffscreenCanvas === 'undefined') {
      return { width: w, height: h, getContext: () => null } as unknown as OffscreenCanvas;
    }
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Base fill
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);

    // Feature-specific silhouettes
    switch (features) {
      case 'mesa':
        ctx.fillStyle = '#aa6633';
        for (let x = 0; x < w; x += 200 + Math.random() * 150) {
          const mw = 80 + Math.random() * 100;
          const mh = 30 + Math.random() * 40;
          ctx.fillRect(x, h - mh, mw, mh);
          ctx.fillRect(x + 5, h - mh - 3, mw - 10, 3);
        }
        break;
      case 'ocean':
        ctx.fillStyle = '#1155aa';
        ctx.fillRect(0, h * 0.4, w, h * 0.6);
        ctx.fillStyle = '#3388cc';
        for (let x = 0; x < w; x += 30) {
          ctx.fillRect(x, h * 0.4 + Math.sin(x * 0.02) * 5, 20, 2);
        }
        break;
      case 'skyline':
      case 'skyline_dark': {
        const bColor = features === 'skyline_dark' ? '#1a1a2a' : '#334455';
        ctx.fillStyle = bColor;
        for (let x = 0; x < w; x += 25 + Math.random() * 30) {
          const bh = 20 + Math.random() * 55;
          const bw = 15 + Math.random() * 20;
          ctx.fillRect(x, h - bh, bw, bh);
          // Lit windows for night
          if (features === 'skyline_dark') {
            ctx.fillStyle = '#ffcc44';
            for (let wy = h - bh + 5; wy < h - 5; wy += 8) {
              for (let wx = x + 3; wx < x + bw - 3; wx += 6) {
                if (Math.random() > 0.5) ctx.fillRect(wx, wy, 3, 3);
              }
            }
            ctx.fillStyle = bColor;
          }
        }
        break;
      }
      case 'peaks':
        ctx.fillStyle = '#8899aa';
        for (let x = 0; x < w; x += 100 + Math.random() * 100) {
          const ph = 40 + Math.random() * 35;
          ctx.beginPath();
          ctx.moveTo(x, h);
          ctx.lineTo(x + 40 + Math.random() * 30, h - ph);
          ctx.lineTo(x + 80 + Math.random() * 60, h);
          ctx.fill();
          // Snow cap
          ctx.fillStyle = '#ddeeff';
          ctx.beginPath();
          ctx.moveTo(x + 35, h - ph + 5);
          ctx.lineTo(x + 45 + Math.random() * 20, h - ph);
          ctx.lineTo(x + 55, h - ph + 8);
          ctx.fill();
          ctx.fillStyle = '#8899aa';
        }
        break;
      case 'hills':
      case 'forest':
      case 'dunes':
      case 'rock_formations':
      case 'canyon_walls':
      case 'trees_dark':
      case 'buildings':
      default:
        // Rolling hills / generic terrain
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x < w; x += 20) {
          ctx.lineTo(x, h - 15 - Math.sin(x * 0.01 + Math.random()) * 20);
        }
        ctx.lineTo(w, h);
        ctx.fill();
        break;
    }

    return canvas;
  }

  /** Update offsets based on road curve. */
  updateScroll(curveAccumulator: number): void {
    this.farOffset = -curveAccumulator * 0.05;
    this.midOffset = -curveAccumulator * 0.15;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, horizonY: number): void {
    const farY = horizonY - 80;
    const midY = horizonY - 60;

    try {
      // Far layer
      const farW = this.farCanvas.width;
      const fOff = ((this.farOffset % farW) + farW) % farW;
      ctx.drawImage(this.farCanvas, -fOff, farY);
      ctx.drawImage(this.farCanvas, farW - fOff, farY);

      // Mid layer
      const midW = this.midCanvas.width;
      const mOff = ((this.midOffset % midW) + midW) % midW;
      ctx.drawImage(this.midCanvas, -mOff, midY);
      ctx.drawImage(this.midCanvas, midW - mOff, midY);
    } catch { /* skip in test env */ }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pseudo3d/SpriteRenderer.ts src/pseudo3d/SceneryRenderer.ts src/pseudo3d/ParallaxLayer.ts
git commit -m "feat: add sprite renderer, scenery billboard renderer, and parallax layers"
```

---

### Task 5: Weather Overlay + Pixel Font + Canvas HUD

**Files:**
- Create: `src/pseudo3d/WeatherOverlay.ts`
- Create: `src/pseudo3d/PixelFont.ts`
- Create: `src/pseudo3d/CanvasHUD.ts`
- Create: `tests/pseudo3d/PixelFont.test.ts`

- [ ] **Step 1: Implement PixelFont**

```typescript
// src/pseudo3d/PixelFont.ts
// 5x7 bitmap font — each character is a 5-wide, 7-tall grid encoded as 7 numbers (each is a 5-bit row)
const CHARS: Record<string, number[]> = {
  '0': [0b01110,0b10001,0b10011,0b10101,0b11001,0b10001,0b01110],
  '1': [0b00100,0b01100,0b00100,0b00100,0b00100,0b00100,0b01110],
  '2': [0b01110,0b10001,0b00001,0b00110,0b01000,0b10000,0b11111],
  '3': [0b01110,0b10001,0b00001,0b00110,0b00001,0b10001,0b01110],
  '4': [0b00010,0b00110,0b01010,0b10010,0b11111,0b00010,0b00010],
  '5': [0b11111,0b10000,0b11110,0b00001,0b00001,0b10001,0b01110],
  '6': [0b01110,0b10000,0b11110,0b10001,0b10001,0b10001,0b01110],
  '7': [0b11111,0b00001,0b00010,0b00100,0b01000,0b01000,0b01000],
  '8': [0b01110,0b10001,0b10001,0b01110,0b10001,0b10001,0b01110],
  '9': [0b01110,0b10001,0b10001,0b01111,0b00001,0b00001,0b01110],
  'A': [0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  'B': [0b11110,0b10001,0b10001,0b11110,0b10001,0b10001,0b11110],
  'C': [0b01110,0b10001,0b10000,0b10000,0b10000,0b10001,0b01110],
  'D': [0b11110,0b10001,0b10001,0b10001,0b10001,0b10001,0b11110],
  'E': [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b11111],
  'F': [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b10000],
  'G': [0b01110,0b10001,0b10000,0b10111,0b10001,0b10001,0b01110],
  'H': [0b10001,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  'I': [0b01110,0b00100,0b00100,0b00100,0b00100,0b00100,0b01110],
  'K': [0b10001,0b10010,0b10100,0b11000,0b10100,0b10010,0b10001],
  'L': [0b10000,0b10000,0b10000,0b10000,0b10000,0b10000,0b11111],
  'M': [0b10001,0b11011,0b10101,0b10101,0b10001,0b10001,0b10001],
  'N': [0b10001,0b11001,0b10101,0b10011,0b10001,0b10001,0b10001],
  'O': [0b01110,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
  'P': [0b11110,0b10001,0b10001,0b11110,0b10000,0b10000,0b10000],
  'R': [0b11110,0b10001,0b10001,0b11110,0b10100,0b10010,0b10001],
  'S': [0b01110,0b10001,0b10000,0b01110,0b00001,0b10001,0b01110],
  'T': [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
  'U': [0b10001,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
  'W': [0b10001,0b10001,0b10001,0b10101,0b10101,0b11011,0b10001],
  'X': [0b10001,0b10001,0b01010,0b00100,0b01010,0b10001,0b10001],
  'Y': [0b10001,0b10001,0b01010,0b00100,0b00100,0b00100,0b00100],
  '/': [0b00001,0b00010,0b00010,0b00100,0b01000,0b01000,0b10000],
  ':': [0b00000,0b00100,0b00100,0b00000,0b00100,0b00100,0b00000],
  ' ': [0b00000,0b00000,0b00000,0b00000,0b00000,0b00000,0b00000],
  '-': [0b00000,0b00000,0b00000,0b11111,0b00000,0b00000,0b00000],
};

export class PixelFont {
  drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    scale: number,
    color: string,
  ): void {
    ctx.fillStyle = color;
    let cursorX = x;

    for (const ch of text.toUpperCase()) {
      const bitmap = CHARS[ch];
      if (!bitmap) { cursorX += 6 * scale; continue; }

      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (bitmap[row] & (1 << (4 - col))) {
            ctx.fillRect(cursorX + col * scale, y + row * scale, scale, scale);
          }
        }
      }
      cursorX += 6 * scale;
    }
  }

  measureText(text: string, scale: number): number {
    return text.length * 6 * scale;
  }
}
```

- [ ] **Step 2: Write PixelFont test**

```typescript
// tests/pseudo3d/PixelFont.test.ts
import { describe, it, expect } from 'vitest';
import { PixelFont } from '@/pseudo3d/PixelFont';

describe('PixelFont', () => {
  it('measures text width correctly', () => {
    const font = new PixelFont();
    expect(font.measureText('HELLO', 2)).toBe(5 * 6 * 2); // 5 chars * 6px * scale 2
  });

  it('measures empty string as zero', () => {
    const font = new PixelFont();
    expect(font.measureText('', 3)).toBe(0);
  });
});
```

- [ ] **Step 3: Implement CanvasHUD**

```typescript
// src/pseudo3d/CanvasHUD.ts
import { PixelFont } from '@/pseudo3d/PixelFont';
import { Bike } from '@/entities/Bike';

export class CanvasHUD {
  private font = new PixelFont();

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bike: Bike,
    position: number,
    raceTime: number,
  ): void {
    // Speed — bottom left
    const kmh = Math.round(bike.speed * 3.6);
    this.font.drawText(ctx, `${kmh} KM/H`, 20, height - 40, 3, '#ffffff');

    // Position — top center
    const ordinals = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH'];
    const posText = ordinals[position - 1] ?? `${position}TH`;
    const posColor = position <= 3 ? '#44ff44' : '#ff4444';
    const posW = this.font.measureText(posText, 4);
    this.font.drawText(ctx, posText, width / 2 - posW / 2, 15, 4, posColor);

    // Timer — below position
    const mins = Math.floor(raceTime / 60);
    const secs = Math.floor(raceTime % 60).toString().padStart(2, '0');
    const timeText = `${mins}:${secs}`;
    const timeW = this.font.measureText(timeText, 2);
    this.font.drawText(ctx, timeText, width / 2 - timeW / 2, 50, 2, '#cccccc');

    // Health bar — bottom center
    const barW = 160;
    const barH = 10;
    const barX = width / 2 - barW / 2;
    const barY = height - 30;

    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barW, barH);

    const healthPct = bike.health / 100;
    const healthColor = healthPct > 0.6 ? '#44ff44' : healthPct > 0.3 ? '#ffaa00' : '#ff4444';
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barW * healthPct, barH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    this.font.drawText(ctx, 'HEALTH', barX, barY + barH + 4, 1, '#888888');

    // Weapon — bottom right
    if (bike.weapon) {
      const weaponText = bike.weapon.toUpperCase();
      const ww = this.font.measureText(weaponText, 2);
      this.font.drawText(ctx, weaponText, width - ww - 20, height - 35, 2, '#ffcc00');
    }

    // Nitro indicator
    if (bike.hasNitro) {
      this.font.drawText(ctx, 'NITRO READY', width / 2 - this.font.measureText('NITRO READY', 2) / 2, height - 60, 2, '#ff8800');
    } else if (bike.nitroActive) {
      this.font.drawText(ctx, 'NITRO', width / 2 - this.font.measureText('NITRO', 3) / 2, height - 65, 3, '#ff4400');
    }
  }

  static calcPosition(playerZ: number, aiZPositions: number[]): number {
    let position = 1;
    for (const z of aiZPositions) {
      if (z > playerZ) position++;
    }
    return position;
  }
}
```

- [ ] **Step 4: Implement WeatherOverlay**

```typescript
// src/pseudo3d/WeatherOverlay.ts
import { WeatherProperties } from '@/effects/WeatherSystem';

export class WeatherOverlay {
  private rainDrops: { x: number; y: number; speed: number }[] = [];
  private snowFlakes: { x: number; y: number; speed: number; drift: number }[] = [];
  private dustParticles: { x: number; y: number; speed: number }[] = [];

  constructor() {
    // Pre-allocate particles
    for (let i = 0; i < 80; i++) {
      this.rainDrops.push({ x: 0, y: 0, speed: 0 });
      this.snowFlakes.push({ x: 0, y: 0, speed: 0, drift: 0 });
      this.dustParticles.push({ x: 0, y: 0, speed: 0 });
    }
    this.resetParticles();
  }

  private resetParticles(): void {
    for (const d of this.rainDrops) {
      d.x = Math.random() * 2000;
      d.y = Math.random() * 1200;
      d.speed = 800 + Math.random() * 400;
    }
    for (const s of this.snowFlakes) {
      s.x = Math.random() * 2000;
      s.y = Math.random() * 1200;
      s.speed = 40 + Math.random() * 60;
      s.drift = (Math.random() - 0.5) * 30;
    }
    for (const p of this.dustParticles) {
      p.x = Math.random() * 2000;
      p.y = Math.random() * 1200;
      p.speed = 100 + Math.random() * 200;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dt: number,
    weather: WeatherProperties,
    playerSpeed: number,
  ): void {
    if (weather.particleType === 'none' && weather.visibility >= 0.95) return;

    // Fog/smog overlay
    if (weather.visibility < 0.95) {
      const fogAlpha = (1 - weather.visibility) * 0.4;
      const fogColor = weather.particleType === 'smog' ? `rgba(150,130,100,${fogAlpha})` : `rgba(200,210,220,${fogAlpha})`;
      ctx.fillStyle = fogColor;
      ctx.fillRect(0, 0, width, height);
    }

    const speedFactor = playerSpeed / 60;

    switch (weather.particleType) {
      case 'rain': {
        ctx.strokeStyle = `rgba(180,200,220,${weather.particleIntensity * 0.5})`;
        ctx.lineWidth = 1;
        for (const d of this.rainDrops) {
          d.y += d.speed * dt;
          d.x -= speedFactor * 50 * dt;
          if (d.y > height) { d.y = -20; d.x = Math.random() * width; }
          if (d.x < 0) d.x = width;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + 2 + speedFactor * 3, d.y + 15 + speedFactor * 5);
          ctx.stroke();
        }
        break;
      }
      case 'snow': {
        ctx.fillStyle = `rgba(255,255,255,${weather.particleIntensity * 0.7})`;
        for (const s of this.snowFlakes) {
          s.y += s.speed * dt;
          s.x += s.drift * dt + Math.sin(Date.now() * 0.001 + s.x) * 0.5;
          if (s.y > height) { s.y = -10; s.x = Math.random() * width; }
          ctx.beginPath();
          ctx.arc(s.x, s.y, 2 + Math.random(), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'dust': {
        ctx.fillStyle = `rgba(180,150,100,${weather.particleIntensity * 0.3})`;
        for (const p of this.dustParticles) {
          p.x += p.speed * dt * weather.windStrength;
          p.y += Math.sin(Date.now() * 0.002 + p.x) * dt * 20;
          if (p.x > width) { p.x = -10; p.y = Math.random() * height; }
          ctx.fillRect(p.x, p.y, 3 + Math.random() * 2, 2);
        }
        break;
      }
      case 'leaves': {
        ctx.fillStyle = `rgba(120,90,40,${weather.particleIntensity * 0.5})`;
        for (const p of this.dustParticles) {
          p.x += p.speed * dt * weather.windStrength * 1.5;
          p.y += Math.sin(Date.now() * 0.003 + p.x) * dt * 40;
          if (p.x > width) { p.x = -20; p.y = Math.random() * height; }
          ctx.fillRect(p.x, p.y, 4, 3);
        }
        break;
      }
    }

    // Night headlight cone
    if (weather.lightingIntensity < 0.4) {
      const grad = ctx.createRadialGradient(width / 2, height * 0.6, 10, width / 2, height * 0.4, height * 0.4);
      grad.addColorStop(0, 'rgba(255,255,200,0.15)');
      grad.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 30, height * 0.75);
      ctx.lineTo(width / 2 - 200, height * 0.35);
      ctx.lineTo(width / 2 + 200, height * 0.35);
      ctx.lineTo(width / 2 + 30, height * 0.75);
      ctx.fill();
    }
  }
}
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run tests/pseudo3d/PixelFont.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pseudo3d/WeatherOverlay.ts src/pseudo3d/PixelFont.ts src/pseudo3d/CanvasHUD.ts tests/pseudo3d/PixelFont.test.ts
git commit -m "feat: add weather overlay, pixel font, and canvas HUD for pseudo-3D"
```

---

### Task 6: PseudoRenderer — Master Orchestrator

**Files:**
- Create: `src/pseudo3d/PseudoRenderer.ts`

- [ ] **Step 1: Implement PseudoRenderer**

```typescript
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

    // 4. Road
    this.roadDrawer.draw(ctx, this.projection, road, playerZ, w, h);

    // 5. Collect all z-sorted drawables (scenery + traffic + AI bikes)
    // We need to draw back-to-front, so we interleave everything by Z

    // 5a. Scenery (already sorted internally, draws back to front)
    this.sceneryRenderer.draw(ctx, playerZ, road);

    // 5b. Traffic (sorted by Z, back to front)
    const sortedTraffic = [...traffic].sort((a, b) => b.z - a.z);
    for (const t of sortedTraffic) {
      if (t.z - playerZ < -20 || t.z - playerZ > 1500) continue;
      this.spriteRenderer.drawVehicle(ctx, t.type, t.direction, t.x, t.z, playerZ, road);
    }

    // 5c. AI bikes (sorted by Z, back to front)
    const sortedAi = [...aiBikes].sort((a, b) => b.bike.z - a.bike.z);
    for (const ai of sortedAi) {
      if (ai.bike.z - playerZ < -20 || ai.bike.z - playerZ > 1500) continue;
      this.spriteRenderer.drawBike(ctx, ai.personality, ai.frame, ai.bike.x, ai.bike.z, playerZ, road);
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
```

- [ ] **Step 2: Commit**

```bash
git add src/pseudo3d/PseudoRenderer.ts
git commit -m "feat: add PseudoRenderer master orchestrator for Canvas2D rendering"
```

---

### Task 7: Integration — Swap Rendering Pipeline in main.ts

This is the critical task. Strip Three.js from main.ts and wire in PseudoRenderer.

**Files:**
- Modify: `src/main.ts`
- Modify: `src/entities/Bike.ts`
- Modify: `src/world/Road.ts`
- Modify: `src/world/TrafficVehicle.ts`
- Modify: `src/world/TrafficManager.ts`
- Modify: `src/world/Environment.ts`
- Modify: `src/effects/WeatherSystem.ts`
- Modify: `index.html`

- [ ] **Step 1: Update index.html**

Replace `<div id="game">` and `<div id="hud">` with a single canvas:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Road Rash</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    canvas { display: block; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <canvas id="game-canvas"></canvas>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Strip Three.js mesh from Bike.ts**

Remove `mesh` field, `updateMesh()`, `createMesh()`, and the Three.js/BikeModelFactory imports. Add a `spriteFrame` field:

```typescript
// At top of Bike.ts — remove THREE and BikeModelFactory imports entirely
// Remove: mesh: THREE.Group field
// Remove: this.mesh = this.createMesh() from constructor
// Remove: updateMesh() method
// Remove: createMesh() method
// Add:
spriteFrame: string = 'center';
```

The Bike class becomes pure physics data.

- [ ] **Step 3: Strip Three.js from Road.ts**

Remove the `RoadRenderer` import and all mesh-related code. Keep segment data methods:

```typescript
// Remove: import { RoadRenderer } ...
// Remove: private roadGroup, renderer fields
// Remove: buildMesh() method
// Remove: getGroup(), getMarkingsGroup() methods
// Keep: getVisibleSegments(), getSegmentAt(), getRoadXOffset(), getElevation(), getWidth(), trackLength
```

- [ ] **Step 4: Strip Three.js from TrafficVehicle.ts**

Remove mesh field and updateMesh method. Add vehicleType field:

```typescript
// Remove: import * as THREE
// Remove: mesh: THREE.Group field
// Remove: Box3 bounding box calculation in constructor
// Remove: updateMesh() method
// Add to class:
vehicleType: string;

// Constructor becomes:
constructor(x: number, z: number, direction: 1 | -1, type: string, width: number, length: number) {
  this.x = x;
  this.z = z;
  this.direction = direction;
  this.vehicleType = type;
  this.width = width;
  this.length = length;
  this.speed = direction === 1 ? randomRange(15, 30) : randomRange(25, 45);
}
```

- [ ] **Step 5: Strip VehicleFactory from TrafficManager.ts**

Replace VehicleFactory with simple type selection and fixed dimensions:

```typescript
// Remove: import { VehicleFactory } from ...
// Remove: private vehicleFactory field

// In spawnVehicle(), replace:
const types = ['sedan', 'pickup', 'suv', 'bus', 'semi', 'sports'];
const vehicleType = types[Math.floor(Math.random() * types.length)];
const dims: Record<string, [number, number]> = {
  sedan: [1.8, 4.0], pickup: [2.0, 5.0], suv: [2.0, 4.5],
  bus: [2.5, 8.0], semi: [2.5, 12.0], sports: [1.9, 3.5],
};
const [w, l] = dims[vehicleType];
const vehicle = new TrafficVehicle(laneX, spawnZ, direction, vehicleType, w, l);
this.vehicles.push(vehicle);
// Remove: this.scene.add(vehicle.mesh)
// Remove: scene parameter from constructor
```

Also remove the `scene.remove(v.mesh)` line from the inactive vehicle cleanup.

- [ ] **Step 6: Strip Three.js from Environment.ts**

Convert to a pure data provider:

```typescript
// Remove all Three.js imports, SceneryFactory, SceneryLODManager
// Keep: SceneryInstance interface (but remove mesh field)
// Keep: placement loop in constructor (just store z, xOffset, side, type — no mesh)
// Remove: getGroup()
// Remove: updatePositions() (scenery rendering handled by SceneryRenderer now)
// Export the placements array for SceneryRenderer to use
```

- [ ] **Step 7: Strip particles from WeatherSystem.ts**

Remove Three.js particle code, keep state machine:

```typescript
// Remove: import * as THREE
// Remove: particles, particlePositions, particleCount fields
// Remove: initParticles() method
// Remove: updateParticles() method body (keep the call but make it empty or remove)
// Remove: destroy() method's scene.remove call
// Keep: constructor, update(), getCurrentState(), getWeatherProperties()
```

- [ ] **Step 8: Rewrite main.ts Game class**

This is the largest change. Replace the Three.js-based Game class with a Canvas2D-based one. The game logic stays identical — only the rendering layer changes.

Key changes:
- Remove all Three.js imports (THREE, Scene, Camera, WebGLRenderer)
- Remove all rendering imports (VehicleFactory, SceneryFactory, BikeModelFactory, LightingManager, SkyRenderer, SpeedEffects, CombatEffects, NitroEffects, RoadRenderer)
- Remove: renderer, scene, camera fields
- Add: canvas, PseudoRenderer
- Constructor: get `<canvas id="game-canvas">`, set size, create 2D context
- `startRace()`: create PseudoRenderer, init scenery, create game entities (no mesh adds)
- `update()`: keep all physics/combat/AI logic. Remove all mesh update calls. Instead, determine sprite frames from bike state.
- `render()`: call `this.pseudoRenderer.render(renderState)` instead of `this.renderer.render(scene, camera)`
- HUD is now canvas-drawn (remove HTML HUD creation)

The `render()` method builds a `RenderState` object from current game state and passes it to PseudoRenderer.

Sprite frame determination logic (add to update):
```typescript
// Player sprite frame
let playerFrame = 'center';
if (this.player.bike.crashed) playerFrame = 'crash';
else if (this.input.isActive(GameAction.SteerLeft)) playerFrame = 'lean_left';
else if (this.input.isActive(GameAction.SteerRight)) playerFrame = 'lean_right';
else if (this.input.justPressed(GameAction.PunchLeft)) playerFrame = 'punch_left';
else if (this.input.justPressed(GameAction.PunchRight)) playerFrame = 'punch_right';
else if (this.input.justPressed(GameAction.KickLeft)) playerFrame = 'kick_left';
else if (this.input.justPressed(GameAction.KickRight)) playerFrame = 'kick_right';
this.player.bike.spriteFrame = playerFrame;

// AI sprite frames
for (const ai of this.aiBikes) {
  if (ai.bike.crashed) ai.bike.spriteFrame = 'crash';
  else if (Math.abs(ai.bike.lean) > 0.1) ai.bike.spriteFrame = ai.bike.lean < 0 ? 'lean_left' : 'lean_right';
  else ai.bike.spriteFrame = 'center';
}
```

Traffic data for renderer:
```typescript
// Collect traffic data for rendering (no mesh references)
const trafficData = this.traffic.getVehicles().map(v => ({
  x: v.x, z: v.z, type: v.vehicleType, direction: v.direction,
}));
```

Add a `getVehicles()` method to `TrafficManager` that returns the vehicle array.

- [ ] **Step 9: Run all tests**

```bash
npx vitest run
```

Some existing tests that reference Three.js (VehicleFactory, SceneryFactory, BikeModelFactory, RoadRenderer) will fail because those modules are no longer used. That's expected — we can either remove those tests or keep the old rendering modules in place (unused).

- [ ] **Step 10: Run build**

```bash
npx vite build
```

- [ ] **Step 11: Remove `three` from package.json dependencies**

```bash
npm uninstall three @types/three
```

Note: Keep `canvas` and `tsx` (needed for atlas generation, which may still be useful for future texture work).

- [ ] **Step 12: Verify in browser**

```bash
npm run dev
```

Expected: Game renders with pseudo-3D road bands, sprite bikes, billboard scenery, parallax background, weather effects, pixel-font HUD. The Genesis-era Road Rash look.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: replace Three.js with pseudo-3D Canvas2D renderer (Genesis-era Road Rash look)"
```

---

### Task 8: Polish & Deploy

**Files:**
- Modify: `src/pseudo3d/RoadDrawer.ts` (tuning)
- Modify: `src/pseudo3d/SpriteSheet.ts` (tuning)
- Modify: various

- [ ] **Step 1: Tune road projection for authentic feel**

Adjust constants in `RoadProjection.ts` if the road doesn't feel right:
- `CAMERA_HEIGHT` controls vertical perspective
- `CAMERA_DEPTH` controls field-of-view
- `DRAW_DISTANCE` controls how far you can see
- Horizon position (0.35) may need tweaking

- [ ] **Step 2: Tune road band colors for each track**

Verify each track's color scheme looks distinct and authentic.

- [ ] **Step 3: Run all tests and build**

```bash
npx vitest run
npm run build
```

- [ ] **Step 4: Deploy to GitHub Pages**

```bash
npx gh-pages -d dist
```

- [ ] **Step 5: Final commit and push**

```bash
git add -A
git commit -m "feat: polish pseudo-3D renderer and deploy"
git push
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Road projection math | RoadProjection.ts |
| 2 | Sky + road band drawer | SkyDrawer.ts, RoadDrawer.ts |
| 3 | Sprite sheet generator | SpriteSheet.ts |
| 4 | Sprite/scenery/parallax renderers | SpriteRenderer.ts, SceneryRenderer.ts, ParallaxLayer.ts |
| 5 | Weather overlay + HUD | WeatherOverlay.ts, PixelFont.ts, CanvasHUD.ts |
| 6 | PseudoRenderer orchestrator | PseudoRenderer.ts |
| 7 | Main.ts integration (swap pipeline) | main.ts, Bike.ts, Road.ts, TrafficVehicle.ts, etc. |
| 8 | Polish & deploy | Tuning, testing, deployment |
