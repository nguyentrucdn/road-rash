// src/effects/NitroEffects.ts
import * as THREE from 'three';

export class NitroEffects {
  private flames: THREE.Points;
  private flamePositions: Float32Array;
  private flameCount = 50;

  constructor(scene: THREE.Scene) {
    this.flamePositions = new Float32Array(this.flameCount * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.flamePositions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.3,
      transparent: true,
      opacity: 0.8,
    });

    this.flames = new THREE.Points(geometry, material);
    this.flames.visible = false;
    scene.add(this.flames);
  }

  update(dt: number, bikeX: number, bikeZ: number, nitroActive: boolean): void {
    this.flames.visible = nitroActive;

    if (!nitroActive) return;

    for (let i = 0; i < this.flameCount; i++) {
      const i3 = i * 3;
      this.flamePositions[i3] = bikeX + (Math.random() - 0.5) * 0.5;
      this.flamePositions[i3 + 1] = 0.3 + Math.random() * 0.5;
      this.flamePositions[i3 + 2] = bikeZ + 1 + Math.random() * 3; // behind bike
    }

    (this.flames.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}
