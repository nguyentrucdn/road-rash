import * as THREE from 'three';
import { randomRange } from '@/utils/MathUtils';

export class TrafficVehicle {
  x: number;
  z: number;
  speed: number;
  direction: 1 | -1;
  width: number;
  length: number;
  mesh: THREE.Group;
  active = true;

  constructor(x: number, z: number, direction: 1 | -1, vehicleMesh: THREE.Group) {
    this.x = x;
    this.z = z;
    this.direction = direction;
    this.speed = direction === 1 ? randomRange(15, 30) : randomRange(25, 45);
    this.mesh = vehicleMesh;

    // Get bounding box for collision dimensions
    const box = new THREE.Box3().setFromObject(vehicleMesh);
    const size = box.getSize(new THREE.Vector3());
    this.width = size.x;
    this.length = size.z;
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
