import * as THREE from 'three';

interface LODEntry {
  detailed: THREE.Group;
  billboard: THREE.Sprite | null;
  currentMode: 'detailed' | 'billboard';
  worldZ: number;
  xOffset: number;
}

const LOD_NEAR = 80;
const LOD_FAR = 100;

export class SceneryLODManager {
  private entries: LODEntry[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  add(detailed: THREE.Group, worldZ: number, xOffset: number): void {
    this.scene.add(detailed);
    this.entries.push({
      detailed,
      billboard: null, // generated lazily
      currentMode: 'detailed',
      worldZ,
      xOffset,
    });
  }

  update(playerZ: number): void {
    for (const entry of this.entries) {
      const dist = Math.abs(entry.worldZ - playerZ);

      // Cull very far objects
      if (dist > 700) {
        entry.detailed.visible = false;
        if (entry.billboard) entry.billboard.visible = false;
        continue;
      }

      // Behind player cull
      if (entry.worldZ - playerZ < -50) {
        entry.detailed.visible = false;
        if (entry.billboard) entry.billboard.visible = false;
        continue;
      }

      if (dist > LOD_FAR) {
        // Billboard mode
        entry.detailed.visible = false;
        if (entry.billboard) {
          entry.billboard.visible = true;
        }
      } else if (dist > LOD_NEAR) {
        // Crossfade zone — show detailed with reduced opacity
        entry.detailed.visible = true;
        const alpha = 1 - (dist - LOD_NEAR) / (LOD_FAR - LOD_NEAR);
        entry.detailed.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.opacity = alpha;
              mesh.material.transparent = alpha < 1;
            }
          }
        });
        if (entry.billboard) entry.billboard.visible = false;
      } else {
        // Full detail
        entry.detailed.visible = true;
        entry.detailed.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.opacity = 1;
              mesh.material.transparent = false;
            }
          }
        });
        if (entry.billboard) entry.billboard.visible = false;
      }
    }
  }
}
