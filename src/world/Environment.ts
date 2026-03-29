import * as THREE from 'three';
import { Road } from '@/world/Road';
import { TrackData, SceneryDef } from '@/tracks/TrackData';

interface SceneryInstance {
  z: number;
  xOffset: number; // distance from road edge
  side: 1 | -1;
  type: string;
  mesh: THREE.Mesh;
}

export class Environment {
  private instances: SceneryInstance[] = [];
  private group = new THREE.Group();

  constructor(track: TrackData, road: Road) {
    const segments = track.generateSegments();

    for (const seg of segments) {
      for (const sceneryDef of track.scenery) {
        if (Math.random() > sceneryDef.frequency) continue;

        const side = Math.random() > 0.5 ? 1 : -1;
        const xOffset = (seg.width / 2 + 3 + Math.random() * 20) * side;
        const mesh = this.createSceneryMesh(sceneryDef);

        const instance: SceneryInstance = {
          z: seg.worldZ,
          xOffset,
          side,
          type: sceneryDef.type,
          mesh,
        };

        const roadX = road.getRoadXOffset(seg.worldZ);
        const roadY = road.getElevation(seg.worldZ);
        mesh.position.set(xOffset + roadX, roadY, 0);

        this.instances.push(instance);
        this.group.add(mesh);
      }
    }
  }

  private createSceneryMesh(def: SceneryDef): THREE.Mesh {
    let geometry: THREE.BufferGeometry;

    switch (def.type) {
      case 'cactus':
        geometry = new THREE.CylinderGeometry(0.2 * def.scale, 0.3 * def.scale, 2 * def.scale, 5);
        break;
      case 'palm_tree':
      case 'pine_tree':
        geometry = new THREE.ConeGeometry(0.8 * def.scale, 3 * def.scale, 5);
        break;
      case 'rock':
        geometry = new THREE.DodecahedronGeometry(0.5 * def.scale, 0);
        break;
      case 'building':
        geometry = new THREE.BoxGeometry(
          2 * def.scale * (0.5 + Math.random() * 0.5),
          def.scale * (1 + Math.random() * 2),
          2 * def.scale * (0.5 + Math.random() * 0.5)
        );
        break;
      case 'mesa':
        geometry = new THREE.CylinderGeometry(
          2 * def.scale, 3 * def.scale, 2 * def.scale, 6
        );
        break;
      case 'sign':
        geometry = new THREE.BoxGeometry(0.1, 1.5 * def.scale, 1 * def.scale);
        break;
      case 'light_post':
        geometry = new THREE.CylinderGeometry(0.05, 0.05, 3 * def.scale, 4);
        break;
      default:
        geometry = new THREE.BoxGeometry(def.scale, def.scale, def.scale);
    }

    const material = new THREE.MeshStandardMaterial({
      color: def.color,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = false;
    return mesh;
  }

  /** Update scenery positions relative to player for rendering. */
  updatePositions(playerZ: number, road: Road): void {
    for (const inst of this.instances) {
      const relZ = -(inst.z - playerZ);
      inst.mesh.position.z = relZ;

      // Only show nearby scenery
      inst.mesh.visible = relZ > -700 && relZ < 50;

      if (inst.mesh.visible) {
        const roadX = road.getRoadXOffset(inst.z);
        const roadY = road.getElevation(inst.z);
        inst.mesh.position.x = inst.xOffset + roadX;
        inst.mesh.position.y = roadY + (inst.mesh.geometry.boundingBox ? 0 : 0);
      }
    }
  }

  getGroup(): THREE.Group {
    return this.group;
  }
}
