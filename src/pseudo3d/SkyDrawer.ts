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
