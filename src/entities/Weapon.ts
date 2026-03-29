export type WeaponType = 'chain' | 'club' | 'crowbar';

export class WeaponPickup {
  x: number;
  z: number;
  type: WeaponType;
  collected = false;

  constructor(x: number, z: number, type: WeaponType) {
    this.x = x;
    this.z = z;
    this.type = type;
  }

  checkPickup(bikeX: number, bikeZ: number): boolean {
    if (this.collected) return false;
    const dx = Math.abs(bikeX - this.x);
    const dz = Math.abs(bikeZ - this.z);
    return dx < 1.5 && dz < 2;
  }
}
