import * as THREE from 'three';

export type WeaponType = 'chain' | 'club' | 'crowbar';

const WEAPON_COLORS: Record<WeaponType, number> = {
  chain: 0xcccccc,
  club: 0x8b4513,
  crowbar: 0xff4444,
};

export class WeaponPickup {
  x: number;
  z: number;
  type: WeaponType;
  mesh: THREE.Mesh;
  collected = false;

  constructor(x: number, z: number, type: WeaponType) {
    this.x = x;
    this.z = z;
    this.type = type;

    this.mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.4),
      new THREE.MeshStandardMaterial({
        color: WEAPON_COLORS[type],
        emissive: WEAPON_COLORS[type],
        emissiveIntensity: 0.5,
        flatShading: true,
      })
    );
  }

  update(dt: number): void {
    // Spin and bob
    this.mesh.rotation.y += dt * 3;
    this.mesh.position.y = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
  }

  updateMesh(roadXOffset: number, roadY: number, playerZ: number): void {
    this.mesh.position.x = this.x + roadXOffset;
    this.mesh.position.y = roadY + 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
    this.mesh.position.z = -(this.z - playerZ);
  }

  checkPickup(bikeX: number, bikeZ: number): boolean {
    if (this.collected) return false;
    const dx = Math.abs(bikeX - this.x);
    const dz = Math.abs(bikeZ - this.z);
    return dx < 1.5 && dz < 2;
  }
}
