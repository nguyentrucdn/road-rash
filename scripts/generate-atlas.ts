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

/* ── Helpers ──────────────────────────────────────────────────── */

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function randInt(lo: number, hi: number): number {
  return Math.floor(lo + Math.random() * (hi - lo));
}

/** Fill region with subtle noise over a base color */
function fillNoise(r: Region, baseR: number, baseG: number, baseB: number, spread: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const dr = (Math.random() - 0.5) * spread;
    const dg = (Math.random() - 0.5) * spread;
    const db = (Math.random() - 0.5) * spread;
    ctx.fillStyle = `rgb(${clamp(baseR + dr, 0, 255)|0},${clamp(baseG + dg, 0, 255)|0},${clamp(baseB + db, 0, 255)|0})`;
    ctx.fillRect(px, py, 1 + Math.random(), 1 + Math.random());
  }
}

/** Draw a branching crack from (sx, sy) with given direction */
function drawCrackBranch(r: Region, sx: number, sy: number, angle: number, length: number, width: number): void {
  ctx.lineWidth = width;
  let x = sx, y = sy;
  const steps = Math.floor(length / 4);
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let s = 0; s < steps; s++) {
    angle += (Math.random() - 0.5) * 0.6;
    x += Math.cos(angle) * 4;
    y += Math.sin(angle) * 4;
    // Keep within region
    if (x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.h) break;
    ctx.lineTo(x, y);

    // Occasional branch
    if (Math.random() < 0.12 && width > 0.5) {
      ctx.stroke();
      drawCrackBranch(r, x, y, angle + (Math.random() - 0.5) * 1.2, length * 0.4, width * 0.6);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = width;
    }
  }
  ctx.stroke();
}

/* ── Draw functions ───────────────────────────────────────────── */

function drawAsphalt(r: Region): void {
  // Base asphalt with slight color variation
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Aggregate texture (multi-colored small dots simulating gravel)
  for (let i = 0; i < 5000; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const type = Math.random();
    let rv: number, gv: number, bv: number;
    if (type < 0.3) {
      // Dark grey aggregate
      rv = gv = bv = 30 + Math.random() * 25;
    } else if (type < 0.6) {
      // Medium grey
      rv = gv = bv = 50 + Math.random() * 30;
    } else if (type < 0.8) {
      // Brownish
      rv = 55 + Math.random() * 20;
      gv = 45 + Math.random() * 15;
      bv = 35 + Math.random() * 10;
    } else {
      // Light speck
      rv = gv = bv = 70 + Math.random() * 25;
    }
    ctx.fillStyle = `rgb(${rv|0},${gv|0},${bv|0})`;
    const sz = 1 + Math.random() * 1.5;
    ctx.fillRect(px, py, sz, sz);
  }

  // Branching crack networks
  ctx.strokeStyle = '#1a1a1a';
  for (let i = 0; i < 8; i++) {
    const sx = r.x + Math.random() * r.w;
    const sy = r.y + Math.random() * r.h;
    const angle = Math.random() * Math.PI * 2;
    drawCrackBranch(r, sx, sy, angle, 40 + Math.random() * 60, 1.2 + Math.random() * 0.8);
  }

  // Thinner secondary cracks
  ctx.strokeStyle = '#252525';
  for (let i = 0; i < 15; i++) {
    const sx = r.x + Math.random() * r.w;
    const sy = r.y + Math.random() * r.h;
    drawCrackBranch(r, sx, sy, Math.random() * Math.PI * 2, 20 + Math.random() * 30, 0.6);
  }

  // Worn tire tracks (subtle darker parallel lines)
  for (let t = 0; t < 2; t++) {
    const tx = r.x + r.w * (0.3 + t * 0.4) + (Math.random() - 0.5) * 20;
    ctx.strokeStyle = 'rgba(25,25,25,0.15)';
    ctx.lineWidth = 18 + Math.random() * 10;
    ctx.beginPath();
    ctx.moveTo(tx, r.y);
    for (let y = r.y; y < r.y + r.h; y += 20) {
      ctx.lineTo(tx + (Math.random() - 0.5) * 3, y);
    }
    ctx.stroke();
  }

  // Oil stains with iridescent coloring
  for (let i = 0; i < 6; i++) {
    const ox = r.x + Math.random() * r.w;
    const oy = r.y + Math.random() * r.h;
    const radius = 12 + Math.random() * 25;

    // Dark core
    const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
    grad.addColorStop(0, 'rgba(15,15,20,0.5)');
    grad.addColorStop(0.5, 'rgba(20,18,30,0.3)');
    grad.addColorStop(1, 'rgba(20,20,25,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(ox - radius, oy - radius, radius * 2, radius * 2);

    // Iridescent sheen
    const irid = ctx.createRadialGradient(ox - 3, oy - 3, 0, ox, oy, radius * 0.8);
    irid.addColorStop(0, 'rgba(80,40,120,0.12)');
    irid.addColorStop(0.3, 'rgba(40,80,100,0.08)');
    irid.addColorStop(0.6, 'rgba(60,100,60,0.06)');
    irid.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = irid;
    ctx.fillRect(ox - radius, oy - radius, radius * 2, radius * 2);
  }

  // Patched repair areas (lighter grey rectangles)
  for (let i = 0; i < 3; i++) {
    const px = r.x + Math.random() * (r.w - 40);
    const py = r.y + Math.random() * (r.h - 30);
    const pw = 25 + Math.random() * 35;
    const ph = 20 + Math.random() * 25;
    ctx.fillStyle = `rgba(${55 + randInt(0, 15)},${55 + randInt(0, 15)},${55 + randInt(0, 15)},0.4)`;
    ctx.fillRect(px, py, pw, ph);
    // Patch edge
    ctx.strokeStyle = 'rgba(30,30,30,0.3)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(px, py, pw, ph);
  }
}

function drawShoulder(r: Region): void {
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Gravel texture with color variation
  for (let i = 0; i < 1200; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const type = Math.random();
    let rv: number, gv: number, bv: number;
    if (type < 0.4) {
      rv = 110 + randInt(0, 40); gv = rv - 20; bv = rv - 40;
    } else if (type < 0.7) {
      rv = gv = bv = 80 + randInt(0, 50);
    } else {
      rv = 130 + randInt(0, 30); gv = 120 + randInt(0, 25); bv = 90 + randInt(0, 20);
    }
    ctx.fillStyle = `rgb(${rv},${gv},${bv})`;
    const sz = 1 + Math.random() * 3;
    ctx.fillRect(px, py, sz, sz);
  }

  // Tire edge marks
  ctx.strokeStyle = 'rgba(60,50,40,0.2)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const sy = r.y + Math.random() * r.h;
    ctx.beginPath();
    ctx.moveTo(r.x, sy);
    ctx.lineTo(r.x + r.w * 0.3, sy + (Math.random() - 0.5) * 10);
    ctx.stroke();
  }
}

function drawBark(r: Region): void {
  // Base bark color
  ctx.fillStyle = '#4a2a12';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Deep vertical furrows
  for (let x = r.x; x < r.x + r.w; x += 5 + Math.random() * 8) {
    const furrowWidth = 2 + Math.random() * 4;
    const darkR = 35 + randInt(0, 20);
    const darkG = 18 + randInt(0, 12);
    const darkB = 5 + randInt(0, 10);
    ctx.fillStyle = `rgb(${darkR},${darkG},${darkB})`;
    // Wavy furrow
    ctx.beginPath();
    ctx.moveTo(x, r.y);
    for (let y = r.y; y < r.y + r.h; y += 4) {
      ctx.lineTo(x + (Math.random() - 0.5) * 2, y);
    }
    ctx.lineTo(x + furrowWidth + (Math.random() - 0.5) * 2, r.y + r.h);
    for (let y = r.y + r.h; y > r.y; y -= 4) {
      ctx.lineTo(x + furrowWidth + (Math.random() - 0.5) * 2, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Lighter ridges between furrows
  for (let x = r.x + 3; x < r.x + r.w; x += 7 + Math.random() * 9) {
    ctx.strokeStyle = `rgb(${85 + randInt(0, 20)},${55 + randInt(0, 15)},${30 + randInt(0, 10)})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, r.y);
    for (let y = r.y; y < r.y + r.h; y += 6) {
      ctx.lineTo(x + (Math.random() - 0.5) * 3, y);
    }
    ctx.stroke();
  }

  // Horizontal texture lines (bark plates)
  ctx.strokeStyle = 'rgba(30,15,5,0.3)';
  ctx.lineWidth = 0.8;
  for (let y = r.y; y < r.y + r.h; y += 12 + Math.random() * 15) {
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    for (let x = r.x; x < r.x + r.w; x += 8) {
      ctx.lineTo(x, y + (Math.random() - 0.5) * 3);
    }
    ctx.stroke();
  }
}

function drawLeafCanopy(r: Region): void {
  // Darker base
  ctx.fillStyle = '#1f5515';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Mid-tone leaf mass
  for (let i = 0; i < 150; i++) {
    const lx = r.x + Math.random() * r.w;
    const ly = r.y + Math.random() * r.h;
    const shade = 25 + randInt(0, 35);
    const green = 70 + randInt(0, 60);
    ctx.fillStyle = `rgb(${shade},${green},${shade - 5})`;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 6 + Math.random() * 8, 4 + Math.random() * 5, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Individual leaf shapes with highlight edges
  for (let i = 0; i < 300; i++) {
    const lx = r.x + Math.random() * r.w;
    const ly = r.y + Math.random() * r.h;
    const size = 2 + Math.random() * 5;
    const angle = Math.random() * Math.PI * 2;
    const green = 60 + randInt(0, 80);
    const red = 20 + randInt(0, 30);

    // Leaf body
    ctx.fillStyle = `rgb(${red},${green},${red - 5})`;
    ctx.beginPath();
    ctx.ellipse(lx, ly, size, size * 0.5, angle, 0, Math.PI * 2);
    ctx.fill();

    // Highlight edge (lighter)
    if (Math.random() < 0.4) {
      ctx.strokeStyle = `rgba(${red + 30},${green + 40},${red + 20},0.5)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(lx, ly, size, size * 0.5, angle, -0.3, Math.PI * 0.6);
      ctx.stroke();
    }
  }

  // Light dappling (sunlight through canopy)
  for (let i = 0; i < 30; i++) {
    const lx = r.x + Math.random() * r.w;
    const ly = r.y + Math.random() * r.h;
    const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 5 + Math.random() * 8);
    grad.addColorStop(0, 'rgba(180,220,100,0.15)');
    grad.addColorStop(1, 'rgba(180,220,100,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(lx - 10, ly - 10, 20, 20);
  }
}

function drawPalmFronds(r: Region): void {
  ctx.fillStyle = '#145a0c';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;

  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
    const frondLen = r.w * 0.42 + Math.random() * r.w * 0.06;

    // Main frond stem
    const green = 80 + randInt(0, 50);
    ctx.strokeStyle = `rgb(${15 + randInt(0, 15)},${green},${8})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);

    const midX = cx + Math.cos(angle) * frondLen * 0.5;
    const midY = cy + Math.sin(angle) * frondLen * 0.5;
    const endX = cx + Math.cos(angle) * frondLen;
    const endY = cy + Math.sin(angle) * frondLen;

    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();

    // Leaflets along frond
    const perpAngle = angle + Math.PI / 2;
    for (let t = 0.2; t < 0.95; t += 0.08) {
      const bx = cx + Math.cos(angle) * frondLen * t;
      const by = cy + Math.sin(angle) * frondLen * t;
      const leafLen = (1 - t) * 12 + 3;

      for (const dir of [-1, 1]) {
        ctx.strokeStyle = `rgb(${20 + randInt(0, 15)},${70 + randInt(0, 40)},${10})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(
          bx + Math.cos(perpAngle) * dir * leafLen,
          by + Math.sin(perpAngle) * dir * leafLen,
        );
        ctx.stroke();
      }
    }
  }
}

function drawPineNeedles(r: Region): void {
  ctx.fillStyle = '#1a3518';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Needle clusters
  for (let i = 0; i < 60; i++) {
    const cx = r.x + Math.random() * r.w;
    const cy = r.y + Math.random() * r.h;
    const clusterSize = 8 + Math.random() * 12;
    const needleCount = 8 + randInt(0, 12);
    const baseAngle = Math.random() * Math.PI * 2;

    for (let n = 0; n < needleCount; n++) {
      const angle = baseAngle + (n / needleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const len = clusterSize * (0.6 + Math.random() * 0.4);
      const green = 40 + randInt(0, 40);
      ctx.strokeStyle = `rgb(${15 + randInt(0, 10)},${green},${12 + randInt(0, 8)})`;
      ctx.lineWidth = 0.8 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke();
    }
  }

  // Highlight needles
  for (let i = 0; i < 80; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    ctx.strokeStyle = `rgba(60,${90 + randInt(0, 30)},30,0.6)`;
    ctx.lineWidth = 0.6;
    const angle = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(angle) * (4 + Math.random() * 5), py + Math.sin(angle) * (4 + Math.random() * 5));
    ctx.stroke();
  }
}

function drawBrick(r: Region): void {
  // Mortar base
  ctx.fillStyle = '#6a6a5a';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  const bw = 22, bh = 11;
  const mortarW = 2;

  for (let row = 0; row < r.h / bh + 1; row++) {
    const offset = (row % 2) * (bw / 2);
    for (let col = -1; col < r.w / bw + 1; col++) {
      const bx = r.x + col * bw + offset;
      const by = r.y + row * bh;

      // Skip if mostly outside region
      if (bx + bw < r.x || bx > r.x + r.w || by + bh < r.y || by > r.y + r.h) continue;

      // Individual brick color variation
      const baseR = 120 + randInt(0, 40);
      const baseG = 50 + randInt(0, 25);
      const baseB = 40 + randInt(0, 20);

      // Occasional darker/lighter bricks
      const variation = Math.random();
      let mr = 0, mg = 0, mb = 0;
      if (variation < 0.1) { mr = -30; mg = -15; mb = -10; } // very dark
      else if (variation < 0.2) { mr = 20; mg = 10; mb = 15; } // lighter

      ctx.fillStyle = `rgb(${clamp(baseR + mr, 0, 255)},${clamp(baseG + mg, 0, 255)},${clamp(baseB + mb, 0, 255)})`;
      ctx.fillRect(bx + mortarW, by + mortarW, bw - mortarW * 2, bh - mortarW * 2);

      // Surface texture on each brick
      for (let n = 0; n < 4; n++) {
        const nx = bx + mortarW + Math.random() * (bw - mortarW * 2);
        const ny = by + mortarW + Math.random() * (bh - mortarW * 2);
        ctx.fillStyle = `rgba(${baseR + randInt(-20, 20)},${baseG + randInt(-10, 10)},${baseB + randInt(-10, 10)},0.3)`;
        ctx.fillRect(nx, ny, 2 + Math.random() * 3, 1 + Math.random() * 2);
      }

      // Occasional damaged/chipped brick
      if (Math.random() < 0.04) {
        ctx.fillStyle = `rgb(${60 + randInt(0, 20)},${45 + randInt(0, 15)},${40 + randInt(0, 10)})`;
        const chipX = bx + mortarW + Math.random() * (bw - mortarW * 4);
        const chipY = by + mortarW + Math.random() * (bh - mortarW * 4);
        ctx.fillRect(chipX, chipY, 4 + Math.random() * 6, 3 + Math.random() * 4);
      }
    }
  }

  // Deeper mortar lines
  ctx.strokeStyle = '#555548';
  ctx.lineWidth = 0.5;
  for (let row = 0; row <= r.h / bh + 1; row++) {
    const y = r.y + row * bh;
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    ctx.lineTo(r.x + r.w, y);
    ctx.stroke();
  }
}

function drawConcrete(r: Region): void {
  // Base concrete
  ctx.fillStyle = '#9a9a94';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Subtle aggregate texture
  fillNoise(r, 155, 155, 150, 30, 800);

  // Form board marks (very faint horizontal lines)
  ctx.strokeStyle = 'rgba(120,120,115,0.25)';
  ctx.lineWidth = 0.8;
  for (let y = r.y; y < r.y + r.h; y += 6 + Math.random() * 4) {
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    ctx.lineTo(r.x + r.w, y + (Math.random() - 0.5) * 1);
    ctx.stroke();
  }

  // Expansion joints
  ctx.strokeStyle = '#707068';
  ctx.lineWidth = 1.5;
  const jointSpacing = r.w / 4;
  for (let x = r.x + jointSpacing; x < r.x + r.w; x += jointSpacing) {
    ctx.beginPath();
    ctx.moveTo(x + (Math.random() - 0.5) * 2, r.y);
    ctx.lineTo(x + (Math.random() - 0.5) * 2, r.y + r.h);
    ctx.stroke();
  }
  for (let y = r.y + jointSpacing; y < r.y + r.h; y += jointSpacing) {
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    ctx.lineTo(r.x + r.w, y + (Math.random() - 0.5) * 2);
    ctx.stroke();
  }

  // Water staining (darker streaks from top)
  for (let i = 0; i < 4; i++) {
    const sx = r.x + Math.random() * r.w;
    const grad = ctx.createLinearGradient(sx, r.y, sx + (Math.random() - 0.5) * 15, r.y + r.h * 0.6);
    grad.addColorStop(0, 'rgba(70,70,65,0.2)');
    grad.addColorStop(0.5, 'rgba(80,80,75,0.1)');
    grad.addColorStop(1, 'rgba(90,90,85,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - 8, r.y, 16 + Math.random() * 10, r.h * 0.7);
  }

  // Fine aggregate dots
  for (let i = 0; i < 400; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const v = 130 + randInt(0, 50);
    ctx.fillStyle = `rgb(${v},${v - 2},${v - 5})`;
    ctx.fillRect(px, py, 1 + Math.random(), 1 + Math.random());
  }
}

function drawGlass(r: Region): void {
  // Sky reflection gradient
  const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  grad.addColorStop(0, '#7aaccf');
  grad.addColorStop(0.3, '#5b8fb8');
  grad.addColorStop(0.7, '#3a6a8f');
  grad.addColorStop(1, '#2a4a66');
  ctx.fillStyle = grad;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Subtle horizontal streaks
  for (let i = 0; i < 15; i++) {
    const sy = r.y + Math.random() * r.h;
    ctx.strokeStyle = `rgba(180,210,240,${0.05 + Math.random() * 0.08})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(r.x, sy);
    ctx.lineTo(r.x + r.w, sy + (Math.random() - 0.5) * 2);
    ctx.stroke();
  }

  // Slight green/blue reflection
  const refl = ctx.createRadialGradient(
    r.x + r.w * 0.3, r.y + r.h * 0.3, 0,
    r.x + r.w * 0.3, r.y + r.h * 0.3, r.w * 0.5,
  );
  refl.addColorStop(0, 'rgba(200,230,255,0.12)');
  refl.addColorStop(1, 'rgba(200,230,255,0)');
  ctx.fillStyle = refl;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawRockSurface(r: Region): void {
  ctx.fillStyle = '#6a6a5e';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Layered sediment lines
  for (let y = r.y; y < r.y + r.h; y += 8 + Math.random() * 12) {
    const layerV = 80 + randInt(0, 60);
    ctx.strokeStyle = `rgb(${layerV},${layerV - 5},${layerV - 12})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    for (let x = r.x; x < r.x + r.w; x += 6) {
      ctx.lineTo(x, y + (Math.random() - 0.5) * 3);
    }
    ctx.stroke();
  }

  // Rough surface texture
  for (let i = 0; i < 600; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const v = 70 + randInt(0, 80);
    ctx.fillStyle = `rgb(${v},${v - 3},${v - 8})`;
    ctx.fillRect(px, py, 2 + Math.random() * 4, 2 + Math.random() * 3);
  }

  // Quartz veins (lighter lines)
  ctx.strokeStyle = 'rgba(200,195,180,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const sx = r.x + Math.random() * r.w;
    const sy = r.y + Math.random() * r.h;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    let vx = sx, vy = sy;
    for (let s = 0; s < 15; s++) {
      vx += (Math.random() - 0.5) * 15;
      vy += (Math.random() - 0.3) * 10;
      ctx.lineTo(vx, vy);
    }
    ctx.stroke();
  }

  // Lichen spots (green/yellow)
  for (let i = 0; i < 8; i++) {
    const lx = r.x + Math.random() * r.w;
    const ly = r.y + Math.random() * r.h;
    const radius = 3 + Math.random() * 6;
    const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius);
    const isGreen = Math.random() > 0.5;
    if (isGreen) {
      grad.addColorStop(0, 'rgba(80,100,40,0.4)');
      grad.addColorStop(1, 'rgba(80,100,40,0)');
    } else {
      grad.addColorStop(0, 'rgba(140,130,50,0.35)');
      grad.addColorStop(1, 'rgba(140,130,50,0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lx, ly, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVehiclePaint(r: Region, color: string): void {
  // Parse base color
  const pr = parseInt(color.slice(1, 3), 16);
  const pg = parseInt(color.slice(3, 5), 16);
  const pb = parseInt(color.slice(5, 7), 16);

  // Base coat
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Metal-flake noise (subtle sparkle)
  for (let i = 0; i < 500; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const bright = Math.random() * 30 - 10;
    ctx.fillStyle = `rgba(${clamp(pr + bright, 0, 255)|0},${clamp(pg + bright, 0, 255)|0},${clamp(pb + bright, 0, 255)|0},0.5)`;
    ctx.fillRect(px, py, 1, 1);
  }

  // Orange peel texture (tiny subtle bumps)
  for (let i = 0; i < 200; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, 2 + Math.random());
    grad.addColorStop(0, `rgba(${clamp(pr + 15, 0, 255)},${clamp(pg + 15, 0, 255)},${clamp(pb + 15, 0, 255)},0.15)`);
    grad.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(px - 3, py - 3, 6, 6);
  }

  // Clear coat highlight gradient (horizontal shine band)
  const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  grad.addColorStop(0, 'rgba(255,255,255,0.0)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.08)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.18)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = grad;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawVehicleGlass(r: Region): void {
  // Gradient from sky reflection at top to dark at bottom
  const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  grad.addColorStop(0, '#6699bb');
  grad.addColorStop(0.3, '#4477aa');
  grad.addColorStop(0.7, '#2a4466');
  grad.addColorStop(1, '#1a2a3a');
  ctx.fillStyle = grad;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Subtle streaks
  for (let i = 0; i < 10; i++) {
    const sx = r.x + Math.random() * r.w;
    ctx.strokeStyle = `rgba(150,190,220,${0.04 + Math.random() * 0.06})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath();
    ctx.moveTo(sx, r.y);
    ctx.lineTo(sx + (Math.random() - 0.5) * 8, r.y + r.h);
    ctx.stroke();
  }

  // Corner reflection highlight
  const refl = ctx.createRadialGradient(
    r.x + r.w * 0.25, r.y + r.h * 0.2, 0,
    r.x + r.w * 0.25, r.y + r.h * 0.2, r.w * 0.4,
  );
  refl.addColorStop(0, 'rgba(200,220,240,0.15)');
  refl.addColorStop(1, 'rgba(200,220,240,0)');
  ctx.fillStyle = refl;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawTire(r: Region): void {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Tread pattern
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    const y = r.y + (i / 12) * r.h;
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    ctx.lineTo(r.x + r.w * 0.4, y + r.h * 0.03);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r.x + r.w * 0.6, y + r.h * 0.01);
    ctx.lineTo(r.x + r.w, y + r.h * 0.04);
    ctx.stroke();
  }

  // Sidewall text-like bumps
  ctx.fillStyle = '#222222';
  for (let i = 0; i < 6; i++) {
    const bx = r.x + 4 + i * 8;
    ctx.fillRect(bx, r.y + r.h * 0.85, 5, 2);
  }

  // Rubber texture noise
  fillNoise(r, 26, 26, 26, 12, 100);
}

function drawSand(r: Region): void {
  ctx.fillStyle = '#c8b888';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Ripple patterns
  ctx.strokeStyle = 'rgba(180,165,115,0.3)';
  ctx.lineWidth = 1;
  for (let y = r.y; y < r.y + r.h; y += 6 + Math.random() * 5) {
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    for (let x = r.x; x < r.x + r.w; x += 8) {
      ctx.lineTo(x, y + Math.sin(x * 0.05) * 2 + (Math.random() - 0.5) * 1.5);
    }
    ctx.stroke();
  }

  // Shadow in ripple troughs
  ctx.strokeStyle = 'rgba(140,125,85,0.2)';
  ctx.lineWidth = 0.8;
  for (let y = r.y + 3; y < r.y + r.h; y += 6 + Math.random() * 5) {
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    for (let x = r.x; x < r.x + r.w; x += 8) {
      ctx.lineTo(x, y + Math.sin(x * 0.05) * 2);
    }
    ctx.stroke();
  }

  // Pebbles
  for (let i = 0; i < 40; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    const size = 1.5 + Math.random() * 3;
    const v = 130 + randInt(0, 50);
    ctx.fillStyle = `rgb(${v},${v - 10},${v - 25})`;
    ctx.beginPath();
    ctx.ellipse(px, py, size, size * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Color variation noise
  fillNoise(r, 195, 180, 130, 25, 600);
}

function drawGrass(r: Region): void {
  ctx.fillStyle = '#2a6a20';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Ground base variation
  fillNoise(r, 50, 90, 35, 30, 400);

  // Blade-like strokes in varying greens
  for (let i = 0; i < 800; i++) {
    const bx = r.x + Math.random() * r.w;
    const by = r.y + Math.random() * r.h;
    const bladeH = 4 + Math.random() * 10;
    const green = 70 + randInt(0, 80);
    const red = 20 + randInt(0, 30);
    const lean = (Math.random() - 0.5) * 4;

    ctx.strokeStyle = `rgb(${red},${green},${red - 5})`;
    ctx.lineWidth = 0.6 + Math.random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + lean * 0.5, by - bladeH * 0.5, bx + lean, by - bladeH);
    ctx.stroke();
  }

  // Highlight blades (lighter green tips)
  for (let i = 0; i < 200; i++) {
    const bx = r.x + Math.random() * r.w;
    const by = r.y + Math.random() * r.h;
    const bladeH = 3 + Math.random() * 6;
    ctx.strokeStyle = `rgba(${60 + randInt(0, 30)},${140 + randInt(0, 40)},${30 + randInt(0, 20)},0.6)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + (Math.random() - 0.5) * 3, by - bladeH);
    ctx.stroke();
  }
}

function drawSnow(r: Region): void {
  ctx.fillStyle = '#e4e4ee';
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // Blue shadow areas
  for (let i = 0; i < 20; i++) {
    const sx = r.x + Math.random() * r.w;
    const sy = r.y + Math.random() * r.h;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 15 + Math.random() * 20);
    grad.addColorStop(0, 'rgba(180,190,220,0.2)');
    grad.addColorStop(1, 'rgba(200,205,230,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - 25, sy - 25, 50, 50);
  }

  // Surface undulations (subtle lighter/darker bands)
  for (let y = r.y; y < r.y + r.h; y += 10 + Math.random() * 8) {
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.1})`;
    ctx.lineWidth = 2 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(r.x, y);
    for (let x = r.x; x < r.x + r.w; x += 12) {
      ctx.lineTo(x, y + (Math.random() - 0.5) * 3);
    }
    ctx.stroke();
  }

  // Sparkle dots
  for (let i = 0; i < 150; i++) {
    const px = r.x + Math.random() * r.w;
    const py = r.y + Math.random() * r.h;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.random() * 0.5})`;
    ctx.fillRect(px, py, 1, 1);
  }

  // Very subtle noise
  fillNoise(r, 230, 230, 238, 12, 300);
}

/* ── Allocate and draw all regions ──────────────────────────────── */

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
drawSand(rSand);

const rGrass = allocate('ground_grass', 256, 256);
drawGrass(rGrass);

const rSnow = allocate('ground_snow', 256, 256);
drawSnow(rSnow);

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
