// src/effects/SpeedEffects.ts
import * as THREE from 'three';

export class SpeedEffects {
  private particles: THREE.Points;
  private particleCount = 100;
  private positions: Float32Array;
  private velocities: Float32Array;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      this.resetParticle(i);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
    });

    this.particles = new THREE.Points(geometry, material);
    scene.add(this.particles);
  }

  private resetParticle(i: number): void {
    const i3 = i * 3;
    this.positions[i3] = (Math.random() - 0.5) * 10;
    this.positions[i3 + 1] = Math.random() * 5;
    this.positions[i3 + 2] = -(Math.random() * 50);
    this.velocities[i3 + 2] = 2 + Math.random() * 3;
  }

  update(dt: number, speed: number, maxSpeed: number): void {
    const speedRatio = speed / maxSpeed;
    const material = this.particles.material as THREE.PointsMaterial;
    material.opacity = speedRatio > 0.7 ? (speedRatio - 0.7) * 3.33 : 0;

    if (speedRatio < 0.7) return;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * speedRatio * dt * 30;

      if (this.positions[i3 + 2] > 5) {
        this.resetParticle(i);
      }
    }

    (this.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}
