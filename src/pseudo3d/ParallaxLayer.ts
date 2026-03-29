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
