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
