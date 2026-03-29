import * as THREE from 'three';

export type VehicleType = 'sedan' | 'pickup' | 'suv' | 'bus' | 'semi' | 'sports';

/* ── Shared Geometries ──────────────────────────────────────────── */

const WHEEL_GEO = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 16);
const HUB_GEO = new THREE.CylinderGeometry(0.18, 0.18, 0.23, 16);
const FENDER_GEO = (() => {
  // Quarter-cylinder for wheel arches
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.48, 0, Math.PI, false);
  shape.lineTo(-0.48, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
  return geo;
})();

/* ── Materials ──────────────────────────────────────────────────── */

const TIRE_MAT = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.9,
  metalness: 0.0,
});

const HUB_MAT = new THREE.MeshStandardMaterial({
  color: 0xbbbbbb,
  roughness: 0.2,
  metalness: 0.8,
});

const CHROME_MAT = new THREE.MeshStandardMaterial({
  color: 0xdddddd,
  roughness: 0.1,
  metalness: 0.9,
});

const DARK_MAT = new THREE.MeshStandardMaterial({
  color: 0x111111,
  roughness: 0.8,
  metalness: 0.0,
});

const GRILLE_MAT = new THREE.MeshStandardMaterial({
  color: 0x0a0a0a,
  roughness: 0.4,
  metalness: 0.3,
});

const UNDERCARRIAGE_MAT = new THREE.MeshStandardMaterial({
  color: 0x050505,
  roughness: 1.0,
  metalness: 0.0,
  transparent: true,
  opacity: 0.6,
});

const LICENSE_MAT = new THREE.MeshStandardMaterial({
  color: 0xeeeeee,
  roughness: 0.6,
  metalness: 0.1,
});

function makeGlassMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x88bbdd,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.4,
  });
}

/* ── Paint colors ───────────────────────────────────────────────── */

const PAINT_PALETTE = [
  0xffffff, // white
  0x111111, // black
  0xb0b0b0, // silver
  0xcc2222, // red
  0x2244aa, // blue
  0x1a4a1a, // dark green
  0xc8b888, // beige
  0x444444, // dark grey
  0x6a1a2a, // burgundy
  0x1a3a6a, // navy
];

function makeBodyMat(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.4,
  });
}

function randomPaintColor(): number {
  return PAINT_PALETTE[Math.floor(Math.random() * PAINT_PALETTE.length)];
}

/* ── Utility builders ───────────────────────────────────────────── */

function addWheels(group: THREE.Group, width: number, length: number, y: number, count: number): void {
  const hw = width / 2 + 0.05;
  const positions: [number, number][] = [];

  if (count >= 4) {
    positions.push([-hw, -length * 0.35], [hw, -length * 0.35]);
    positions.push([-hw, length * 0.35], [hw, length * 0.35]);
  }
  if (count >= 6) {
    positions.push([-hw, length * 0.15], [hw, length * 0.15]);
  }

  for (const [x, z] of positions) {
    const wheel = new THREE.Mesh(WHEEL_GEO, TIRE_MAT);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    group.add(wheel);

    // Hub cap
    const hub = new THREE.Mesh(HUB_GEO, HUB_MAT);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, y, z);
    group.add(hub);
  }
}

function addWheelWells(group: THREE.Group, width: number, length: number, y: number, count: number): void {
  const hw = width / 2 - 0.15;
  const positions: [number, number][] = [];

  if (count >= 4) {
    positions.push([-hw, -length * 0.35], [hw, -length * 0.35]);
    positions.push([-hw, length * 0.35], [hw, length * 0.35]);
  }
  if (count >= 6) {
    positions.push([-hw, length * 0.15], [hw, length * 0.15]);
  }

  // Scale arches to fit within body width
  const archScale = 0.6;
  for (const [x, z] of positions) {
    const arch = new THREE.Mesh(FENDER_GEO, DARK_MAT);
    arch.position.set(x, y + 0.05, z - 0.09);
    arch.rotation.y = x > 0 ? Math.PI : 0;
    arch.scale.set(x > 0 ? -archScale : archScale, archScale, 0.5);
    group.add(arch);
  }
}

function addLights(group: THREE.Group, width: number, length: number, bodyY: number): void {
  const headlightGeo = new THREE.BoxGeometry(0.18, 0.1, 0.06);
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffcc,
    emissive: 0xffffcc,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.3,
  });
  const taillightGeo = new THREE.BoxGeometry(0.2, 0.08, 0.06);
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    emissive: 0xff2200,
    emissiveIntensity: 0.6,
    roughness: 0.3,
    metalness: 0.2,
  });

  // Headlight reflector housing
  const housingGeo = new THREE.BoxGeometry(0.22, 0.14, 0.04);

  for (const side of [-1, 1]) {
    // Headlight housing
    const hh = new THREE.Mesh(housingGeo, CHROME_MAT);
    hh.position.set(side * (width / 2 - 0.2), bodyY, -length / 2 - 0.02);
    group.add(hh);

    const hl = new THREE.Mesh(headlightGeo, headlightMat);
    hl.position.set(side * (width / 2 - 0.2), bodyY, -length / 2);
    group.add(hl);

    const tl = new THREE.Mesh(taillightGeo, taillightMat);
    tl.position.set(side * (width / 2 - 0.2), bodyY, length / 2);
    group.add(tl);
  }
}

function addUndercarriage(group: THREE.Group, width: number, length: number): void {
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    UNDERCARRIAGE_MAT,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, 0);
  group.add(shadow);
}

function addGrille(group: THREE.Group, width: number, length: number, bodyY: number): void {
  // Dark grille area
  const grilleW = width * 0.5;
  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(grilleW, 0.2, 0.04),
    GRILLE_MAT,
  );
  grille.position.set(0, bodyY - 0.1, -length / 2 - 0.02);
  group.add(grille);

  // Chrome surround
  const surround = new THREE.Mesh(
    new THREE.BoxGeometry(grilleW + 0.06, 0.24, 0.02),
    CHROME_MAT,
  );
  surround.position.set(0, bodyY - 0.1, -length / 2 - 0.04);
  group.add(surround);
}

function addLicensePlate(group: THREE.Group, length: number, bodyY: number): void {
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.15, 0.02),
    LICENSE_MAT,
  );
  plate.position.set(0, bodyY - 0.15, length / 2 + 0.01);
  group.add(plate);
}

function addDoorLines(group: THREE.Group, width: number, length: number, bodyY: number, bodyH: number): void {
  const lineGeo = new THREE.BoxGeometry(0.01, bodyH * 0.8, 0.01);
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1.0, metalness: 0.0 });

  for (const side of [-1, 1]) {
    for (const zOff of [-0.3, 0.5]) {
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(side * (width / 2 + 0.005), bodyY, zOff);
      group.add(line);
    }
  }
}

function addSideWindows(
  group: THREE.Group,
  width: number,
  cabinZ: number,
  cabinLen: number,
  cabinY: number,
  cabinH: number,
  glassMat: THREE.MeshStandardMaterial,
): void {
  for (const side of [-1, 1]) {
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(cabinLen * 0.85, cabinH * 0.7),
      glassMat,
    );
    win.position.set(side * (width / 2 + 0.01), cabinY, cabinZ);
    win.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(win);
  }
}

/* ── Vehicle Builders ───────────────────────────────────────────── */

function createSedan(paintColor: number): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = makeBodyMat(paintColor);
  const glassMat = makeGlassMat();

  // Lower body -- slightly tapered
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 4.0), bodyMat);
  body.position.y = 0.6;
  g.add(body);

  // Hood (sloped down toward front)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.12, 1.1), bodyMat);
  hood.position.set(0, 0.92, -1.05);
  hood.rotation.x = 0.12;
  g.add(hood);

  // Cabin with slightly narrower top for curvature illusion
  const cabinBase = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.3, 1.6), bodyMat);
  cabinBase.position.set(0, 1.0, 0.2);
  g.add(cabinBase);

  const cabinTop = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.25, 1.5), bodyMat);
  cabinTop.position.set(0, 1.25, 0.2);
  g.add(cabinTop);

  // Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.48, 0.05), glassMat);
  windshield.position.set(0, 1.1, -0.58);
  windshield.rotation.x = -0.3;
  g.add(windshield);

  // Rear window
  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.4, 0.05), glassMat);
  rearWindow.position.set(0, 1.1, 1.0);
  rearWindow.rotation.x = 0.25;
  g.add(rearWindow);

  // Side windows
  addSideWindows(g, 1.5, 0.2, 1.5, 1.15, 0.45, glassMat);

  // Trunk (sloped down)
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.85), bodyMat);
  trunk.position.set(0, 0.88, 1.5);
  trunk.rotation.x = -0.08;
  g.add(trunk);

  // Chrome bumpers
  const fbGeo = new THREE.BoxGeometry(1.75, 0.12, 0.08);
  const fb = new THREE.Mesh(fbGeo, CHROME_MAT);
  fb.position.set(0, 0.42, -2.02);
  g.add(fb);
  const rb = new THREE.Mesh(fbGeo, CHROME_MAT);
  rb.position.set(0, 0.42, 2.02);
  g.add(rb);

  addGrille(g, 1.8, 4.0, 0.7);
  addLicensePlate(g, 4.0, 0.55);
  addDoorLines(g, 1.8, 4.0, 0.6, 0.5);
  addWheels(g, 1.8, 4.0, 0.35, 4);
  addWheelWells(g, 1.8, 4.0, 0.5, 4);
  addLights(g, 1.8, 4.0, 0.7);
  addUndercarriage(g, 1.8, 4.0);

  return g;
}

function createPickup(paintColor: number): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = makeBodyMat(paintColor);
  const glassMat = makeGlassMat();

  // Cab body
  const cabLower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 2.2), bodyMat);
  cabLower.position.set(0, 0.9, -0.8);
  g.add(cabLower);

  const cabUpper = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 2.0), bodyMat);
  cabUpper.position.set(0, 1.35, -0.8);
  g.add(cabUpper);

  // Windshield
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.05), glassMat);
  ws.position.set(0, 1.3, -1.82);
  ws.rotation.x = -0.2;
  g.add(ws);

  // Rear cab window
  const rw = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 0.05), glassMat);
  rw.position.set(0, 1.3, 0.22);
  g.add(rw);

  // Side windows
  addSideWindows(g, 1.9, -0.8, 1.8, 1.35, 0.4, glassMat);

  // Bed (open)
  const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 2.5), bodyMat);
  bedFloor.position.set(0, 0.6, 1.25);
  g.add(bedFloor);

  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 2.5), bodyMat);
    wall.position.set(side * 0.95, 0.9, 1.25);
    g.add(wall);
  }
  const tailgate = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 0.08), bodyMat);
  tailgate.position.set(0, 0.9, 2.5);
  g.add(tailgate);

  // Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 5.0), bodyMat);
  chassis.position.set(0, 0.48, 0);
  g.add(chassis);

  // Chrome bumpers
  const fb = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.1), CHROME_MAT);
  fb.position.set(0, 0.45, -1.95);
  g.add(fb);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.1), CHROME_MAT);
  rb.position.set(0, 0.45, 2.55);
  g.add(rb);

  addGrille(g, 2.0, 5.0, 0.75);
  addLicensePlate(g, 5.0, 0.6);
  addDoorLines(g, 2.0, 2.2, 0.9, 0.6);
  addWheels(g, 2.0, 5.0, 0.35, 4);
  addWheelWells(g, 2.0, 5.0, 0.5, 4);
  addLights(g, 2.0, 5.0, 0.7);
  addUndercarriage(g, 2.0, 5.0);

  return g;
}

function createSUV(paintColor: number): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = makeBodyMat(paintColor);
  const glassMat = makeGlassMat();

  // Lower body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.5), bodyMat);
  body.position.y = 0.7;
  g.add(body);

  // Cabin lower
  const cabinLower = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.4, 3.0), bodyMat);
  cabinLower.position.set(0, 1.2, 0.2);
  g.add(cabinLower);

  // Cabin upper (tapered for roof shape)
  const cabinUpper = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.35, 2.8), bodyMat);
  cabinUpper.position.set(0, 1.55, 0.2);
  g.add(cabinUpper);

  // Roof rails (chrome)
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.06, 2.6),
      CHROME_MAT,
    );
    rail.position.set(side * 0.85, 1.76, 0.2);
    g.add(rail);

    // Rail supports
    for (const zz of [-0.8, 0.2, 1.2]) {
      const support = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.08, 0.04),
        CHROME_MAT,
      );
      support.position.set(side * 0.85, 1.72, zz);
      g.add(support);
    }
  }

  // Windshield
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.6, 0.05), glassMat);
  ws.position.set(0, 1.4, -1.32);
  ws.rotation.x = -0.2;
  g.add(ws);

  // Rear window
  const rw = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.5, 0.05), glassMat);
  rw.position.set(0, 1.4, 1.72);
  rw.rotation.x = 0.15;
  g.add(rw);

  // Side windows
  addSideWindows(g, 1.8, 0.2, 2.6, 1.4, 0.55, glassMat);

  // Chrome bumpers
  const fb = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.1), CHROME_MAT);
  fb.position.set(0, 0.5, -2.28);
  g.add(fb);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.1), CHROME_MAT);
  rb.position.set(0, 0.5, 2.28);
  g.add(rb);

  addGrille(g, 2.0, 4.5, 0.8);
  addLicensePlate(g, 4.5, 0.6);
  addDoorLines(g, 1.85, 3.0, 1.2, 0.4);
  addWheels(g, 2.0, 4.5, 0.35, 4);
  addWheelWells(g, 2.0, 4.5, 0.55, 4);
  addLights(g, 2.0, 4.5, 0.8);
  addUndercarriage(g, 2.0, 4.5);

  return g;
}

function createBus(paintColor: number): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = makeBodyMat(paintColor);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x885500, roughness: 0.5, metalness: 0.2 });
  const glassMat = makeGlassMat();

  // Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 8.0), bodyMat);
  body.position.y = 1.3;
  g.add(body);

  // Rounded top edge (long cylinder across top)
  const roofEdge = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.1, 7.8),
    bodyMat,
  );
  roofEdge.position.set(0, 2.25, 0);
  g.add(roofEdge);

  // Stripe band
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.3, 8.02), stripeMat);
  stripe.position.y = 1.0;
  g.add(stripe);

  // Window row
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.75), glassMat);
      win.position.set(side * 1.26, 1.7, -3.0 + i * 1.1);
      g.add(win);

      // Window frame (chrome)
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.56, 0.81),
        CHROME_MAT,
      );
      frame.position.set(side * 1.27, 1.7, -3.0 + i * 1.1);
      g.add(frame);
    }
  }

  // Windshield
  const ws = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 0.05), glassMat);
  ws.position.set(0, 1.5, -4.02);
  g.add(ws);

  // Chrome bumpers
  const fb = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 0.12), CHROME_MAT);
  fb.position.set(0, 0.45, -4.05);
  g.add(fb);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 0.12), CHROME_MAT);
  rb.position.set(0, 0.45, 4.05);
  g.add(rb);

  addGrille(g, 2.5, 8.0, 0.9);
  addLicensePlate(g, 8.0, 0.65);
  addWheels(g, 2.5, 8.0, 0.35, 6);
  addWheelWells(g, 2.5, 8.0, 0.45, 6);
  addLights(g, 2.5, 8.0, 0.8);
  addUndercarriage(g, 2.5, 8.0);

  return g;
}

function createSemi(paintColor: number): THREE.Group {
  const g = new THREE.Group();
  const cabMat = makeBodyMat(paintColor);
  const trailerMat = new THREE.MeshStandardMaterial({
    color: 0xbbbbbb,
    roughness: 0.5,
    metalness: 0.3,
  });
  const glassMat = makeGlassMat();

  // Cab -- slightly tapered front
  const cabLower = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 3.0), cabMat);
  cabLower.position.set(0, 1.1, -4.0);
  g.add(cabLower);

  const cabUpper = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 2.6), cabMat);
  cabUpper.position.set(0, 2.15, -3.8);
  g.add(cabUpper);

  // Windshield
  const ws = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.0, 0.05), glassMat);
  ws.position.set(0, 2.0, -5.52);
  ws.rotation.x = -0.1;
  g.add(ws);

  // Side windows on cab
  for (const side of [-1, 1]) {
    const sw = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.6),
      glassMat,
    );
    sw.position.set(side * 1.21, 2.1, -4.0);
    sw.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    g.add(sw);
  }

  // Exhaust stacks (chrome)
  for (const side of [-1, 1]) {
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.5, 8),
      CHROME_MAT,
    );
    stack.position.set(side * 1.15, 2.5, -3.2);
    g.add(stack);
  }

  // Trailer
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 8.0), trailerMat);
  trailer.position.set(0, 1.7, 1.5);
  g.add(trailer);

  // Trailer ribbing (vertical lines on sides)
  for (let i = 0; i < 10; i++) {
    for (const side of [-1, 1]) {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 2.4, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.4, metalness: 0.4 }),
      );
      rib.position.set(side * 1.26, 1.7, -2.2 + i * 0.8);
      g.add(rib);
    }
  }

  // Chrome bumpers
  const fb = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 0.12), CHROME_MAT);
  fb.position.set(0, 0.5, -5.55);
  g.add(fb);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 0.12), CHROME_MAT);
  rb.position.set(0, 0.5, 5.55);
  g.add(rb);

  addGrille(g, 2.5, 3.0, 0.9);

  // Cab wheels
  addWheels(g, 2.5, 3.0, 0.35, 4);
  // Trailer wheels (extra set at back)
  for (const side of [-1, 1]) {
    for (const zOff of [4.0, 4.8]) {
      const w = new THREE.Mesh(WHEEL_GEO, TIRE_MAT);
      w.rotation.z = Math.PI / 2;
      w.position.set(side * 1.3, 0.35, zOff);
      g.add(w);

      const h = new THREE.Mesh(HUB_GEO, HUB_MAT);
      h.rotation.z = Math.PI / 2;
      h.position.set(side * 1.3, 0.35, zOff);
      g.add(h);
    }
  }

  addLights(g, 2.5, 12.0, 1.0);
  addUndercarriage(g, 2.5, 12.0);

  // Rear reflectors on trailer
  for (const side of [-1, 1]) {
    const ref = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.3 }),
    );
    ref.position.set(side * 0.8, 0.8, 5.52);
    g.add(ref);
  }

  return g;
}

function createSports(paintColor: number): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = makeBodyMat(paintColor);
  const glassMat = makeGlassMat();

  // Low sleek body -- wider and flatter
  const bodyLower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, 3.6), bodyMat);
  bodyLower.position.y = 0.38;
  g.add(bodyLower);

  // Upper body with taper
  const bodyUpper = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.15, 3.4), bodyMat);
  bodyUpper.position.y = 0.55;
  g.add(bodyUpper);

  // Tapered hood (wedge shape -- use rotated box)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.4), bodyMat);
  hood.position.set(0, 0.6, -0.95);
  hood.rotation.x = 0.1;
  g.add(hood);

  // Hood scoop
  const scoop = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.06, 0.4),
    DARK_MAT,
  );
  scoop.position.set(0, 0.68, -0.7);
  g.add(scoop);

  // Low cabin
  const cabinBase = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.2, 1.2), bodyMat);
  cabinBase.position.set(0, 0.72, 0.3);
  g.add(cabinBase);

  const cabinTop = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.18, 1.1), bodyMat);
  cabinTop.position.set(0, 0.9, 0.3);
  g.add(cabinTop);

  // Wide rear fenders
  for (const side of [-1, 1]) {
    const fender = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.2, 1.0),
      bodyMat,
    );
    fender.position.set(side * 1.05, 0.45, 1.1);
    g.add(fender);
  }

  // Windshield
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.05), glassMat);
  ws.position.set(0, 0.82, -0.28);
  ws.rotation.x = -0.45;
  g.add(ws);

  // Rear window
  const rw = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.05), glassMat);
  rw.position.set(0, 0.82, 0.88);
  rw.rotation.x = 0.35;
  g.add(rw);

  // Side windows
  addSideWindows(g, 1.6, 0.3, 1.0, 0.82, 0.3, glassMat);

  // Spoiler
  const spoilerPostMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.3 });
  for (const side of [-0.6, 0.6]) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.2, 0.04),
      spoilerPostMat,
    );
    post.position.set(side, 0.78, 1.65);
    g.add(post);
  }
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.25), bodyMat);
  wing.position.set(0, 0.88, 1.65);
  g.add(wing);

  // Diffuser (dark underside at rear)
  const diffuser = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.08, 0.3),
    DARK_MAT,
  );
  diffuser.position.set(0, 0.28, 1.75);
  g.add(diffuser);

  // Chrome bumpers
  const fb = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.06), CHROME_MAT);
  fb.position.set(0, 0.3, -1.82);
  g.add(fb);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.06), CHROME_MAT);
  rb.position.set(0, 0.3, 1.82);
  g.add(rb);

  addGrille(g, 1.9, 3.6, 0.45);
  addLicensePlate(g, 3.6, 0.35);
  addWheels(g, 2.0, 3.5, 0.28, 4);
  addWheelWells(g, 2.0, 3.5, 0.42, 4);
  addLights(g, 1.9, 3.6, 0.5);
  addUndercarriage(g, 2.0, 3.6);

  return g;
}

/* ── Factory ────────────────────────────────────────────────────── */

const BUILDERS: Record<VehicleType, (color: number) => THREE.Group> = {
  sedan: createSedan,
  pickup: createPickup,
  suv: createSUV,
  bus: createBus,
  semi: createSemi,
  sports: createSports,
};

export class VehicleFactory {
  create(type: VehicleType): THREE.Group {
    const builder = BUILDERS[type];
    if (!builder) throw new Error(`Unknown vehicle type: ${type}`);
    // Each vehicle gets a random paint color from the palette
    return builder(randomPaintColor());
  }

  static randomType(): VehicleType {
    const types: VehicleType[] = ['sedan', 'pickup', 'suv', 'bus', 'semi', 'sports'];
    return types[Math.floor(Math.random() * types.length)];
  }
}
