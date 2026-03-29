import * as THREE from 'three';

export class Bike {
  // Position and physics
  x: number;
  y: number = 0;
  z: number;
  speed: number = 0;
  lean: number = 0;
  health: number = 100;

  // Physics constants
  readonly maxSpeed: number = 60;
  readonly acceleration: number = 25;
  readonly brakeForce: number = 40;
  readonly dragFactor: number = 0.3;
  readonly steerSpeed: number = 15;
  readonly maxLean: number = 0.4;

  // State
  hasNitro: boolean = true;
  nitroActive: boolean = false;
  crashed: boolean = false;
  crashTimer: number = 0;
  weapon: string | null = null;

  // Combat state (used by Task 10)
  isDucking: boolean = false;
  isBlocking: boolean = false;
  attackCooldown: number = 0;

  // Nitro timer
  private nitroTimer: number = 0;

  // Three.js mesh
  mesh: THREE.Group;

  constructor(x: number, z: number) {
    this.x = x;
    this.z = z;
    this.mesh = this.createMesh();
  }

  get currentMaxSpeed(): number {
    return this.nitroActive ? this.maxSpeed * 1.5 : this.maxSpeed;
  }

  accelerate(dt: number): void {
    if (this.crashed) return;
    this.speed = Math.min(this.currentMaxSpeed, this.speed + this.acceleration * dt);
  }

  brake(dt: number): void {
    if (this.crashed) return;
    this.speed = Math.max(0, this.speed - this.brakeForce * dt);
  }

  applyDrag(dt: number): void {
    this.speed = Math.max(0, this.speed - this.speed * this.dragFactor * dt);
  }

  steer(dir: number, dt: number): void {
    if (this.crashed) return;
    const steerAmount = dir * this.steerSpeed * (this.speed / this.maxSpeed) * dt;
    this.x += steerAmount;
    this.lean = Math.max(-this.maxLean, Math.min(this.maxLean, dir * this.maxLean));
  }

  updatePosition(dt: number): void {
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (this.crashed) {
      this.crashTimer -= dt;
      if (this.crashTimer <= 0) {
        this.crashed = false;
        this.crashTimer = 0;
        this.health = 100;
      }
      return;
    }

    this.z += this.speed * dt;

    // Nitro timer
    if (this.nitroActive) {
      this.nitroTimer -= dt;
      if (this.nitroTimer <= 0) {
        this.nitroActive = false;
        this.nitroTimer = 0;
        // Cap speed to normal max if over
        if (this.speed > this.maxSpeed) {
          this.speed = this.maxSpeed;
        }
      }
    }

    // Lean decay
    this.lean *= 0.85;
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.crash();
    }
  }

  crash(): void {
    this.crashed = true;
    this.crashTimer = 2;
    this.speed = 0;
  }

  activateNitro(): void {
    if (!this.hasNitro) return;
    this.hasNitro = false;
    this.nitroActive = true;
    this.nitroTimer = 3;
  }

  updateMesh(roadXOffset: number, roadY: number): void {
    this.mesh.position.set(this.x + roadXOffset, roadY + 0.5, 0);
    this.mesh.rotation.z = -this.lean;

    // Flash when crashed
    if (this.crashed) {
      const visible = Math.floor(this.crashTimer * 10) % 2 === 0;
      this.mesh.visible = visible;
    } else {
      this.mesh.visible = true;
    }
  }

  private createMesh(): THREE.Group {
    const group = new THREE.Group();

    // Bike body (red)
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.5, 1.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff2200, flatShading: true });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.5, 0);
    group.add(body);

    // Front wheel (black)
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 8);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, flatShading: true });

    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.25, -0.7);
    group.add(frontWheel);

    // Rear wheel (black)
    const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(0, 0.25, 0.7);
    group.add(rearWheel);

    // Rider body (blue)
    const riderGeo = new THREE.BoxGeometry(0.4, 0.7, 0.5);
    const riderMat = new THREE.MeshStandardMaterial({ color: 0x2244cc, flatShading: true });
    const rider = new THREE.Mesh(riderGeo, riderMat);
    rider.position.set(0, 1.2, 0.1);
    group.add(rider);

    // Head (skin tone)
    const headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, flatShading: true });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.75, -0.05);
    group.add(head);

    return group;
  }
}
