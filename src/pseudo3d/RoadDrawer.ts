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
