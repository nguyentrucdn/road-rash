import * as THREE from 'three';
import { Road } from '@/world/Road';
import { TrackData, SceneryDef } from '@/tracks/TrackData';
import { SceneryFactory } from '@/rendering/SceneryFactory';
import { SceneryLODManager } from '@/rendering/SceneryLODManager';

interface SceneryInstance {
  z: number;
  xOffset: number; // distance from road edge
  side: 1 | -1;
  type: string;
  mesh: THREE.Group;
}

export class Environment {
  private instances: SceneryInstance[] = [];
  private group = new THREE.Group();
  private lodManager: SceneryLODManager;

  constructor(track: TrackData, road: Road) {
    this.lodManager = new SceneryLODManager(this.group as unknown as THREE.Scene);
    const sceneryFactory = new SceneryFactory();
    const segments = track.generateSegments();

    for (const seg of segments) {
      for (const sceneryDef of track.scenery) {
        if (Math.random() > sceneryDef.frequency) continue;

        const side = Math.random() > 0.5 ? 1 : -1;
        const xOffset = (seg.width / 2 + 3 + Math.random() * 20) * side;
        const mesh = sceneryFactory.createDetailed(sceneryDef.type, sceneryDef.scale, sceneryDef.color);

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
        this.lodManager.add(mesh, seg.worldZ, xOffset);
      }
    }
  }

  /** Update scenery positions relative to player for rendering. */
  updatePositions(playerZ: number, road: Road): void {
    this.lodManager.update(playerZ);

    for (const inst of this.instances) {
      const relZ = -(inst.z - playerZ);
      inst.mesh.position.z = relZ;

      if (inst.mesh.visible) {
        const roadX = road.getRoadXOffset(inst.z);
        const roadY = road.getElevation(inst.z);
        inst.mesh.position.x = inst.xOffset + roadX;
        inst.mesh.position.y = roadY;
      }
    }
  }

  getGroup(): THREE.Group {
    return this.group;
  }
}
