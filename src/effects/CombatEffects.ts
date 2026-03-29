// src/effects/CombatEffects.ts
import * as THREE from 'three';

export class CombatEffects {
  private camera: THREE.PerspectiveCamera;
  private shakeIntensity = 0;
  private shakeDecay = 8;
  private slowMoTimer = 0;
  private slowMoActive = false;

  // Screen flash overlay
  private flashOverlay: HTMLElement;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;

    this.flashOverlay = document.createElement('div');
    this.flashOverlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      pointer-events:none;z-index:5;background:transparent;
      transition:background 0.05s;
    `;
    document.body.appendChild(this.flashOverlay);
  }

  triggerShake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  triggerHitFlash(color: string = 'rgba(255,0,0,0.3)'): void {
    this.flashOverlay.style.background = color;
    setTimeout(() => { this.flashOverlay.style.background = 'transparent'; }, 80);
  }

  triggerSlowMo(): void {
    this.slowMoActive = true;
    this.slowMoTimer = 0.05; // 50ms
  }

  update(dt: number): number {
    // Screen shake
    if (this.shakeIntensity > 0.01) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.x += offsetX;
      this.camera.position.y += offsetY;
      this.shakeIntensity *= Math.exp(-this.shakeDecay * dt);
    }

    // Slow-mo: return time scale
    if (this.slowMoActive) {
      this.slowMoTimer -= dt;
      if (this.slowMoTimer <= 0) {
        this.slowMoActive = false;
      }
      return 0.2; // 20% speed during slow-mo
    }

    return 1.0;
  }

  destroy(): void {
    this.flashOverlay.remove();
  }
}
