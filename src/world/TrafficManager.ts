import * as THREE from 'three';
import { TrafficVehicle } from '@/world/TrafficVehicle';
import { Road } from '@/world/Road';
import { randomRange } from '@/utils/MathUtils';

export class TrafficManager {
  private vehicles: TrafficVehicle[] = [];
  private scene: THREE.Scene;
  private road: Road;
  private density: number;
  private spawnTimer = 0;
  private spawnInterval: number;

  constructor(scene: THREE.Scene, road: Road, density: number) {
    this.scene = scene;
    this.road = road;
    this.density = density;
    this.spawnInterval = Math.max(0.3, 2 - density * 2);
  }

  update(dt: number, playerZ: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.spawnInterval * randomRange(0.5, 1.5);
      this.spawnVehicle(playerZ);
    }
    for (const v of this.vehicles) {
      v.update(dt);
      const roadX = this.road.getRoadXOffset(v.z);
      const roadY = this.road.getElevation(v.z);
      v.updateMesh(roadX, roadY, playerZ);
      if (Math.abs(v.z - playerZ) > 500) v.active = false;
    }
    this.vehicles = this.vehicles.filter((v) => {
      if (!v.active) { this.scene.remove(v.mesh); return false; }
      return true;
    });
  }

  private spawnVehicle(playerZ: number): void {
    const roadWidth = this.road.getWidth(playerZ);
    const halfWidth = roadWidth / 2;
    const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
    const spawnZ = direction === 1 ? playerZ + randomRange(100, 300) : playerZ + randomRange(80, 250);
    const laneX = direction === 1 ? randomRange(0, halfWidth - 1) : randomRange(-halfWidth + 1, 0);
    const vehicle = new TrafficVehicle(laneX, spawnZ, direction);
    this.vehicles.push(vehicle);
    this.scene.add(vehicle.mesh);
  }

  checkCollision(bikeX: number, bikeZ: number, bikeSpeed: number): number {
    for (const v of this.vehicles) {
      const dx = Math.abs(bikeX - v.x);
      const dz = Math.abs(bikeZ - v.z);
      if (dx < (v.width / 2 + 0.3) && dz < (v.length / 2 + 0.75)) {
        const relativeSpeed = Math.abs(bikeSpeed - v.speed * v.direction);
        v.active = false;
        if (relativeSpeed > 40) return 100;
        return Math.min(50, relativeSpeed * 0.8);
      }
    }
    return 0;
  }
}
