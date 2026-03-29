import * as THREE from 'three';
import { randomRange } from '@/utils/MathUtils';

export class TrafficVehicle {
  x: number;
  z: number;
  speed: number;
  direction: 1 | -1;
  width: number;
  length: number;
  mesh: THREE.Mesh;
  active = true;

  constructor(x: number, z: number, direction: 1 | -1) {
    this.x = x;
    this.z = z;
    this.direction = direction;
    this.speed = direction === 1 ? randomRange(15, 30) : randomRange(25, 45);
    this.width = randomRange(1.5, 2.5);
    this.length = randomRange(3, 6);
    const color = direction === 1
      ? [0x4488cc, 0x44cc88, 0xcccc44, 0xcc8844][Math.floor(Math.random() * 4)]
      : [0xcc4444, 0x884444, 0xcc6644, 0xaa4444][Math.floor(Math.random() * 4)];
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(this.width, 1.2, this.length),
      new THREE.MeshStandardMaterial({ color, flatShading: true })
    );
    this.mesh.position.y = 0.6;
  }

  update(dt: number): void {
    this.z += this.speed * this.direction * dt;
  }

  updateMesh(roadXOffset: number, roadY: number, playerZ: number): void {
    this.mesh.position.x = this.x + roadXOffset;
    this.mesh.position.y = roadY + 0.6;
    this.mesh.position.z = -(this.z - playerZ);
  }
}
