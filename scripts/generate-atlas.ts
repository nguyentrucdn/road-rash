import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

const ATLAS_SIZE = 2048;
const canvas = createCanvas(ATLAS_SIZE, ATLAS_SIZE);
const ctx = canvas.getContext('2d');

// Atlas region definitions: name -> { x, y, w, h }
interface Region { x: number; y: number; w: number; h: number; }
const regions: Record<string, Region> = {};
let cursorX = 0;
let cursorY = 0;
let rowHeight = 0;

function allocate(name: string, w: number, h: number): Region {
  if (cursorX + w > ATLAS_SIZE) {
    cursorX = 0;
    cursorY += rowHeight;
    rowHeight = 0;
  }
  const region: Region = { x: cursorX, y: cursorY, w, h };
  regions[name] = region;
  cursorX += w;
  rowHeight = Math.max(rowHeight, h);
  return region;
}

// --- Draw functions for each texture region ---

function drawAsphalt(r: Region): void {
  ctx.fillStyle = '#333333';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  // Cracks
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const sx = r.x + Math.random() * r.w;
    const sy = r.y + Math.random() * r.h;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 30, sy + (Math.random() - 0.5) * 30);
    ctx.stroke();
  }
  // Oil stains
  for (let i = 0; i < 8; i++) {
    const ox = r.x + Math.random() * r.w;
    const oy = r.y + Math.random() * r.h;
    const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, 15 + Math.random() * 20);
    grad.addColorStop(0, 'rgba(20,20,30,0.4)');
    grad.addColorStop(1, 'rgba(20,20,30,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(ox - 30, oy - 30, 60, 60);
  }
  // Noise grain
  for (let i = 0; i < 2000; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const v = 40 + Math.random() * 30;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(px, py, 1, 1);
  }
}

function drawShoulder(r: Region): void {
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  for (let i = 0; i < 500; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const v = 100 + Math.random() * 60;
    ctx.fillStyle = `rgb(${v},${v - 20},${v - 40})`;
    ctx.fillRect(px, py, 2, 2);
  }
}

function drawBark(r: Region): void {
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = '#4a2a10';
  ctx.lineWidth = 2;
  for (let y = r.y; y < r.y + r.h; y += 8 + Math.random() * 6) {
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    for (let x = r.x; x < r.x + r.w; x += 10) {
      ctx.lineTo(x, y + (Math.random() - 0.5) * 4);
    }
    ctx.stroke();
  }
}

function drawLeafCanopy(r: Region): void {
  ctx.fillStyle = '#2d6a1e';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  for (let i = 0; i < 200; i++) {
    const lx = r.x + Math.random() * r.w;
    const ly = r.y + Math.random() * r.h;
    const shade = 30 + Math.random() * 50;
    ctx.fillStyle = `rgb(${shade},${80 + Math.random() * 40},${shade - 10})`;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 3 + Math.random() * 5, 2 + Math.random() * 3, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPalmFronds(r: Region): void {
  ctx.fillStyle = '#1a5a10';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  for (let i = 0; i < 12; i++) {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const angle = (i / 12) * Math.PI * 2;
    ctx.strokeStyle = `rgb(${20 + Math.random() * 20},${100 + Math.random() * 50},${10})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(
      cx + Math.cos(angle) * r.w * 0.3, cy + Math.sin(angle) * r.h * 0.3,
      cx + Math.cos(angle) * r.w * 0.45, cy + Math.sin(angle) * r.h * 0.45
    );
    ctx.stroke();
  }
}

function drawPineNeedles(r: Region): void {
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  for (let i = 0; i < 400; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    ctx.strokeStyle = `rgb(${20 + Math.random() * 20},${50 + Math.random() * 30},${15})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + (Math.random() - 0.5) * 8, py + Math.random() * 6);
    ctx.stroke();
  }
}

function drawBrick(r: Region): void {
  ctx.fillStyle = '#8b4444';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#6a3333';
  const bw = 20, bh = 10;
  for (let row = 0; row < r.h / bh; row++) {
    const offset = (row % 2) * (bw / 2);
    for (let col = -1; col < r.w / bw + 1; col++) {
      const bx = r.x + col * bw + offset;
      const by = r.y + row * bh;
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
    }
  }
}

function drawConcrete(r: Region): void {
  ctx.fillStyle = '#999999';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  for (let i = 0; i < 300; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const v = 130 + Math.random() * 50;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(px, py, 2, 2);
  }
}

function drawGlass(r: Region): void {
  const grad = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
  grad.addColorStop(0, '#4477aa');
  grad.addColorStop(0.5, '#6699cc');
  grad.addColorStop(1, '#335588');
  ctx.fillStyle = grad;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawRockSurface(r: Region): void {
  ctx.fillStyle = '#777766';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  for (let i = 0; i < 400; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const v = 80 + Math.random() * 80;
    ctx.fillStyle = `rgb(${v},${v - 5},${v - 10})`;
    ctx.fillRect(px, py, 3 + Math.random() * 4, 3 + Math.random() * 4);
  }
}

function drawVehiclePaint(r: Region, color: string): void {
  const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color);
  grad.addColorStop(0.5, '#ffffff30');
  grad.addColorStop(0.6, color);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawVehicleGlass(r: Region): void {
  ctx.fillStyle = '#223344';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const grad = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
  grad.addColorStop(0, 'rgba(100,150,200,0.3)');
  grad.addColorStop(1, 'rgba(30,50,70,0.1)');
  ctx.fillStyle = grad;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawTire(r: Region): void {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const y = r.y + (i / 8) * r.h;
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    ctx.lineTo(r.x + r.w, y + r.h * 0.05);
    ctx.stroke();
  }
}

function drawGround(r: Region, baseColor: string, dotColor: string): void {
  ctx.fillStyle = baseColor;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  for (let i = 0; i < 600; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    ctx.fillStyle = dotColor;
    ctx.fillRect(px, py, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
}

// --- Allocate and draw all regions ---

const rAsphalt = allocate('road_asphalt', 512, 512);
drawAsphalt(rAsphalt);

const rShoulder = allocate('road_shoulder', 256, 256);
drawShoulder(rShoulder);

const rBark = allocate('bark', 128, 128);
drawBark(rBark);

const rLeaf = allocate('leaf_canopy', 256, 256);
drawLeafCanopy(rLeaf);

const rPalm = allocate('palm_fronds', 256, 256);
drawPalmFronds(rPalm);

const rPine = allocate('pine_needles', 256, 256);
drawPineNeedles(rPine);

const rBrick = allocate('building_brick', 256, 256);
drawBrick(rBrick);

const rConcrete = allocate('building_concrete', 256, 256);
drawConcrete(rConcrete);

const rGlass = allocate('building_glass', 128, 128);
drawGlass(rGlass);

const rRock = allocate('rock_surface', 256, 256);
drawRockSurface(rRock);

// Vehicle paints
const vehicleColors = [
  { name: 'paint_sedan', color: '#4488cc' },
  { name: 'paint_pickup', color: '#cc8844' },
  { name: 'paint_suv', color: '#44aa44' },
  { name: 'paint_bus', color: '#ccaa22' },
  { name: 'paint_semi', color: '#888888' },
  { name: 'paint_sports', color: '#cc2222' },
];
for (const vc of vehicleColors) {
  const r = allocate(vc.name, 128, 128);
  drawVehiclePaint(r, vc.color);
}

const rVGlass = allocate('vehicle_glass', 128, 128);
drawVehicleGlass(rVGlass);

const rTire = allocate('vehicle_tire', 64, 64);
drawTire(rTire);

const rSand = allocate('ground_sand', 256, 256);
drawGround(rSand, '#c2b280', '#b8a870');

const rGrass = allocate('ground_grass', 256, 256);
drawGround(rGrass, '#3a7a2a', '#4a8a3a');

const rSnow = allocate('ground_snow', 256, 256);
drawGround(rSnow, '#e8e8f0', '#ffffff');

// --- Write output ---
const outDir = path.resolve(__dirname, '..', 'public', 'textures');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const pngBuffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(outDir, 'atlas.png'), pngBuffer);

// Write region map as JSON for the runtime module
const uvMap: Record<string, { u1: number; v1: number; u2: number; v2: number }> = {};
for (const [name, r] of Object.entries(regions)) {
  uvMap[name] = {
    u1: r.x / ATLAS_SIZE,
    v1: 1 - (r.y + r.h) / ATLAS_SIZE, // flip Y for WebGL
    u2: (r.x + r.w) / ATLAS_SIZE,
    v2: 1 - r.y / ATLAS_SIZE,
  };
}
fs.writeFileSync(path.join(outDir, 'atlas-regions.json'), JSON.stringify(uvMap, null, 2));

console.log(`Atlas generated: ${ATLAS_SIZE}x${ATLAS_SIZE}, ${Object.keys(regions).length} regions`);
console.log(`Output: ${outDir}/atlas.png, ${outDir}/atlas-regions.json`);
