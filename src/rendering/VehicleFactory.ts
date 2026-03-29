import * as THREE from 'three';

export type VehicleType = 'sedan' | 'pickup' | 'suv' | 'bus' | 'semi' | 'sports';

const WHEEL_GEO = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 8);
const WHEEL_MAT = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true });

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
    const wheel = new THREE.Mesh(WHEEL_GEO, WHEEL_MAT);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    group.add(wheel);
  }
}

function addLights(group: THREE.Group, width: number, length: number, bodyY: number): void {
  const headlightGeo = new THREE.BoxGeometry(0.15, 0.12, 0.05);
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffcc, emissiveIntensity: 0.8 });
  const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.6 });

  for (const side of [-1, 1]) {
    const hl = new THREE.Mesh(headlightGeo, headlightMat);
    hl.position.set(side * (width / 2 - 0.2), bodyY, -length / 2);
    group.add(hl);

    const tl = new THREE.Mesh(headlightGeo, taillightMat);
    tl.position.set(side * (width / 2 - 0.2), bodyY, length / 2);
    group.add(tl);
  }
}

function createSedan(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, flatShading: true });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x223344, flatShading: true, transparent: true, opacity: 0.7 });

  // Lower body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 4.0), bodyMat);
  body.position.y = 0.6;
  g.add(body);

  // Hood (sloped)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.0), bodyMat);
  hood.position.set(0, 0.95, -1.0);
  hood.rotation.x = 0.15;
  g.add(hood);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.6), bodyMat);
  cabin.position.set(0, 1.1, 0.2);
  g.add(cabin);

  // Windows
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.05), glassMat);
  windshield.position.set(0, 1.1, -0.6);
  windshield.rotation.x = -0.3;
  g.add(windshield);

  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.05), glassMat);
  rearWindow.position.set(0, 1.1, 1.0);
  rearWindow.rotation.x = 0.2;
  g.add(rearWindow);

  // Trunk
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.8), bodyMat);
  trunk.position.set(0, 0.9, 1.5);
  g.add(trunk);

  // Bumpers
  const bumperGeo = new THREE.BoxGeometry(1.7, 0.15, 0.1);
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x333333, flatShading: true });
  const fb = new THREE.Mesh(bumperGeo, bumperMat);
  fb.position.set(0, 0.45, -2.0);
  g.add(fb);
  const rb = new THREE.Mesh(bumperGeo, bumperMat);
  rb.position.set(0, 0.45, 2.0);
  g.add(rb);

  addWheels(g, 1.8, 4.0, 0.35, 4);
  addLights(g, 1.8, 4.0, 0.7);

  return g;
}

function createPickup(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc8844, flatShading: true });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x223344, flatShading: true, transparent: true, opacity: 0.7 });

  // Cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 2.0), bodyMat);
  cab.position.set(0, 1.1, -0.8);
  g.add(cab);

  // Windshield
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.05), glassMat);
  ws.position.set(0, 1.3, -1.8);
  ws.rotation.x = -0.2;
  g.add(ws);

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
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 5.0), bodyMat);
  chassis.position.set(0, 0.5, 0);
  g.add(chassis);

  addWheels(g, 2.0, 5.0, 0.35, 4);
  addLights(g, 2.0, 5.0, 0.7);

  return g;
}

function createSUV(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x44aa44, flatShading: true });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x223344, flatShading: true, transparent: true, opacity: 0.7 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 4.5), bodyMat);
  body.position.y = 0.7;
  g.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 3.0), bodyMat);
  cabin.position.set(0, 1.35, 0.2);
  g.add(cabin);

  // Roof rack
  const rack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 2.5), new THREE.MeshStandardMaterial({ color: 0x333333, flatShading: true }));
  rack.position.set(0, 1.75, 0.2);
  g.add(rack);

  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 0.05), glassMat);
  ws.position.set(0, 1.35, -1.3);
  ws.rotation.x = -0.2;
  g.add(ws);

  addWheels(g, 2.0, 4.5, 0.35, 4);
  addLights(g, 2.0, 4.5, 0.8);

  return g;
}

function createBus(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xccaa22, flatShading: true });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x885500, flatShading: true });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x223344, flatShading: true, transparent: true, opacity: 0.7 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 8.0), bodyMat);
  body.position.y = 1.3;
  g.add(body);

  // Stripe band
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.3, 8.02), stripeMat);
  stripe.position.y = 1.0;
  g.add(stripe);

  // Window row
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.8), glassMat);
      win.position.set(side * 1.26, 1.7, -3.0 + i * 1.1);
      g.add(win);
    }
  }

  const ws = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 0.05), glassMat);
  ws.position.set(0, 1.5, -4.0);
  g.add(ws);

  addWheels(g, 2.5, 8.0, 0.35, 6);
  addLights(g, 2.5, 8.0, 0.8);

  return g;
}

function createSemi(): THREE.Group {
  const g = new THREE.Group();
  const cabMat = new THREE.MeshStandardMaterial({ color: 0x888888, flatShading: true });
  const trailerMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, flatShading: true });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x223344, flatShading: true, transparent: true, opacity: 0.7 });

  // Cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.0, 3.0), cabMat);
  cab.position.set(0, 1.5, -4.0);
  g.add(cab);

  const ws = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.0, 0.05), glassMat);
  ws.position.set(0, 2.0, -5.5);
  g.add(ws);

  // Trailer
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 8.0), trailerMat);
  trailer.position.set(0, 1.7, 1.5);
  g.add(trailer);

  addWheels(g, 2.5, 3.0, 0.35, 4); // cab wheels
  // Trailer wheels (extra set at back)
  for (const side of [-1, 1]) {
    for (const zOff of [4.0, 4.8]) {
      const w = new THREE.Mesh(WHEEL_GEO, WHEEL_MAT);
      w.rotation.z = Math.PI / 2;
      w.position.set(side * 1.3, 0.35, zOff);
      g.add(w);
    }
  }

  addLights(g, 2.5, 12.0, 1.0);

  return g;
}

function createSports(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, flatShading: true });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x223344, flatShading: true, transparent: true, opacity: 0.7 });

  // Low sleek body
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 3.5), bodyMat);
  body.position.y = 0.45;
  g.add(body);

  // Tapered hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.15, 1.2), bodyMat);
  hood.position.set(0, 0.65, -0.9);
  hood.rotation.x = 0.1;
  g.add(hood);

  // Low cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 1.2), bodyMat);
  cabin.position.set(0, 0.8, 0.3);
  g.add(cabin);

  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.05), glassMat);
  ws.position.set(0, 0.8, -0.3);
  ws.rotation.x = -0.4;
  g.add(ws);

  // Spoiler
  const spoilerPost = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), new THREE.MeshStandardMaterial({ color: 0x222222, flatShading: true }));
  for (const side of [-0.6, 0.6]) {
    const post = spoilerPost.clone();
    post.position.set(side, 0.85, 1.6);
    g.add(post);
  }
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.03, 0.3), bodyMat);
  wing.position.set(0, 0.95, 1.6);
  g.add(wing);

  addWheels(g, 1.9, 3.5, 0.28, 4);
  addLights(g, 1.9, 3.5, 0.5);

  return g;
}

const BUILDERS: Record<VehicleType, () => THREE.Group> = {
  sedan: createSedan,
  pickup: createPickup,
  suv: createSUV,
  bus: createBus,
  semi: createSemi,
  sports: createSports,
};

export class VehicleFactory {
  private prototypes = new Map<VehicleType, THREE.Group>();

  constructor() {
    for (const [type, builder] of Object.entries(BUILDERS)) {
      this.prototypes.set(type as VehicleType, builder());
    }
  }

  create(type: VehicleType): THREE.Group {
    const proto = this.prototypes.get(type);
    if (!proto) throw new Error(`Unknown vehicle type: ${type}`);
    return proto.clone();
  }

  static randomType(): VehicleType {
    const types: VehicleType[] = ['sedan', 'pickup', 'suv', 'bus', 'semi', 'sports'];
    return types[Math.floor(Math.random() * types.length)];
  }
}
