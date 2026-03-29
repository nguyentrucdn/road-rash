// src/rendering/LightingManager.ts
import * as THREE from 'three';
import { TrackData } from '@/tracks/TrackData';

interface TrackLighting {
  ambientColor: number;
  ambientIntensity: number;
  dirColor: number;
  dirIntensity: number;
  fogColor: number;
  fogDensity: number;
}

const TRACK_LIGHTING: Record<string, TrackLighting> = {
  'Desert Highway':  { ambientColor: 0xffd4a0, ambientIntensity: 0.6, dirColor: 0xffffff, dirIntensity: 1.2, fogColor: 0xf4a460, fogDensity: 0.002 },
  'Pacific Coast':   { ambientColor: 0xffe8cc, ambientIntensity: 0.5, dirColor: 0xffeedd, dirIntensity: 1.0, fogColor: 0x87ceeb, fogDensity: 0.0015 },
  'Downtown Rush':   { ambientColor: 0xccccdd, ambientIntensity: 0.5, dirColor: 0xddddee, dirIntensity: 0.8, fogColor: 0x556677, fogDensity: 0.003 },
  'Mountain Pass':   { ambientColor: 0xaabbdd, ambientIntensity: 0.4, dirColor: 0xddeeff, dirIntensity: 0.9, fogColor: 0xaabbcc, fogDensity: 0.004 },
  'Night Highway':   { ambientColor: 0x222244, ambientIntensity: 0.15, dirColor: 0x6677aa, dirIntensity: 0.3, fogColor: 0x0a0a1a, fogDensity: 0.005 },
  'Canyon Run':      { ambientColor: 0xffcc88, ambientIntensity: 0.5, dirColor: 0xffeecc, dirIntensity: 1.1, fogColor: 0xdd8855, fogDensity: 0.002 },
};

export class LightingManager {
  private ambient: THREE.AmbientLight;
  private directional: THREE.DirectionalLight;
  private playerHeadlight: THREE.SpotLight | null = null;

  constructor(
    private scene: THREE.Scene,
    private renderer: THREE.WebGLRenderer,
  ) {
    // Enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.ambient = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(this.ambient);

    this.directional = new THREE.DirectionalLight(0xffffff, 1);
    this.directional.position.set(5, 15, 5);
    this.directional.castShadow = true;
    this.directional.shadow.mapSize.width = 1024;
    this.directional.shadow.mapSize.height = 1024;
    this.directional.shadow.camera.near = 0.5;
    this.directional.shadow.camera.far = 100;
    this.directional.shadow.camera.left = -30;
    this.directional.shadow.camera.right = 30;
    this.directional.shadow.camera.top = 30;
    this.directional.shadow.camera.bottom = -30;
    scene.add(this.directional);
  }

  setupForTrack(track: TrackData): void {
    const config = TRACK_LIGHTING[track.name] ?? TRACK_LIGHTING['Desert Highway'];

    this.ambient.color.setHex(config.ambientColor);
    this.ambient.intensity = config.ambientIntensity;
    this.directional.color.setHex(config.dirColor);
    this.directional.intensity = config.dirIntensity;

    this.scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity);

    // Night track: add player headlight
    if (track.name === 'Night Highway') {
      this.playerHeadlight = new THREE.SpotLight(0xffffcc, 2, 50, Math.PI / 6, 0.3);
      this.playerHeadlight.castShadow = false;
      this.scene.add(this.playerHeadlight);
      this.scene.add(this.playerHeadlight.target);
    }
  }

  update(playerPos: THREE.Vector3): void {
    // Move shadow camera to follow player
    this.directional.position.set(playerPos.x + 5, 15, playerPos.z - 10);
    this.directional.target.position.set(playerPos.x, 0, playerPos.z - 20);

    // Update headlight
    if (this.playerHeadlight) {
      this.playerHeadlight.position.copy(playerPos);
      this.playerHeadlight.position.y += 0.7;
      this.playerHeadlight.target.position.set(playerPos.x, playerPos.y, playerPos.z - 30);
    }
  }

  enableShadowsOn(mesh: THREE.Object3D): void {
    mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
      }
    });
  }

  enableReceiveShadows(mesh: THREE.Object3D): void {
    mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.receiveShadow = true;
      }
    });
  }

  /** Flash for lightning effect */
  triggerLightning(): void {
    const origIntensity = this.directional.intensity;
    this.directional.intensity = 5;
    setTimeout(() => { this.directional.intensity = origIntensity; }, 100);
  }

  destroy(): void {
    if (this.playerHeadlight) {
      this.scene.remove(this.playerHeadlight);
      this.scene.remove(this.playerHeadlight.target);
    }
  }
}
