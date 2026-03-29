import { randomRange } from '@/utils/MathUtils';

export class TrafficVehicle {
  x: number;
  z: number;
  speed: number;
  direction: 1 | -1;
  width: number;
  length: number;
  vehicleType: string;
  active = true;

  constructor(x: number, z: number, direction: 1 | -1, type: string, width: number, length: number) {
    this.x = x;
    this.z = z;
    this.direction = direction;
    this.vehicleType = type;
    this.width = width;
    this.length = length;
    this.speed = direction === 1 ? randomRange(15, 30) : randomRange(25, 45);
  }

  update(dt: number): void {
    this.z += this.speed * this.direction * dt;
  }
}
