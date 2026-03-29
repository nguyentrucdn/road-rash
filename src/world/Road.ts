import * as THREE from 'three';
import { RoadSegment, SEGMENT_LENGTH } from '@/world/RoadSegment';
import { TrackData } from '@/tracks/TrackData';

const VISIBLE_SEGMENTS = 150;
const BEHIND_SEGMENTS = 10;

export class Road {
  private segments: RoadSegment[];
  private cumulativeCurve: number[] = [];
  private cumulativeHill: number[] = [];
  readonly totalSegments: number;
  private roadGroup = new THREE.Group();
  private roadMaterial: THREE.MeshStandardMaterial;
  private shoulderMaterial: THREE.MeshStandardMaterial;

  constructor(private track: TrackData) {
    this.segments = track.generateSegments();
    this.totalSegments = this.segments.length;
    this.roadMaterial = new THREE.MeshStandardMaterial({ color: track.roadColor, flatShading: true });
    this.shoulderMaterial = new THREE.MeshStandardMaterial({ color: track.shoulderColor, flatShading: true });
    let cx = 0, cy = 0;
    for (let i = 0; i < this.segments.length; i++) {
      this.cumulativeCurve.push(cx);
      this.cumulativeHill.push(cy);
      cx += this.segments[i].curve * 0.3;
      cy += this.segments[i].hill * 0.2;
    }
  }

  getVisibleSegments(playerZ: number): RoadSegment[] {
    const currentIdx = Math.floor(playerZ / SEGMENT_LENGTH);
    const startIdx = Math.max(0, currentIdx - BEHIND_SEGMENTS);
    const endIdx = Math.min(this.totalSegments - 1, currentIdx + VISIBLE_SEGMENTS);
    return this.segments.slice(startIdx, endIdx + 1);
  }

  getSegmentAt(z: number): RoadSegment {
    const idx = Math.floor(z / SEGMENT_LENGTH);
    return this.segments[Math.max(0, Math.min(idx, this.totalSegments - 1))];
  }

  getRoadXOffset(z: number): number {
    const idx = Math.floor(z / SEGMENT_LENGTH);
    if (idx <= 0) return 0;
    return this.cumulativeCurve[Math.min(idx, this.cumulativeCurve.length - 1)];
  }

  getElevation(z: number): number {
    const idx = Math.floor(z / SEGMENT_LENGTH);
    if (idx <= 0) return 0;
    return this.cumulativeHill[Math.min(idx, this.cumulativeHill.length - 1)];
  }

  getWidth(z: number): number {
    return this.getSegmentAt(z).width;
  }

  buildMesh(playerZ: number): THREE.Group {
    while (this.roadGroup.children.length > 0) {
      this.roadGroup.remove(this.roadGroup.children[0]);
    }
    const visible = this.getVisibleSegments(playerZ);
    for (let i = 0; i < visible.length - 1; i++) {
      const seg = visible[i], nextSeg = visible[i + 1];
      const z1 = seg.worldZ - playerZ, z2 = nextSeg.worldZ - playerZ;
      const x1 = this.getRoadXOffset(seg.worldZ), x2 = this.getRoadXOffset(nextSeg.worldZ);
      const y1 = this.getElevation(seg.worldZ), y2 = this.getElevation(nextSeg.worldZ);
      const w1 = seg.width / 2, w2 = nextSeg.width / 2;

      const roadGeo = new THREE.BufferGeometry();
      roadGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        x1-w1,y1,-z1, x1+w1,y1,-z1, x2+w2,y2,-z2,
        x1-w1,y1,-z1, x2+w2,y2,-z2, x2-w2,y2,-z2,
      ]), 3));
      roadGeo.computeVertexNormals();
      this.roadGroup.add(new THREE.Mesh(roadGeo, this.roadMaterial));

      const shoulderWidth = 3;
      for (const side of [-1, 1]) {
        const sGeo = new THREE.BufferGeometry();
        sGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
          x1+side*w1,y1,-z1, x1+side*(w1+shoulderWidth),y1-0.05,-z1, x2+side*(w2+shoulderWidth),y2-0.05,-z2,
          x1+side*w1,y1,-z1, x2+side*(w2+shoulderWidth),y2-0.05,-z2, x2+side*w2,y2,-z2,
        ]), 3));
        sGeo.computeVertexNormals();
        this.roadGroup.add(new THREE.Mesh(sGeo, this.shoulderMaterial));
      }
    }
    return this.roadGroup;
  }

  getGroup(): THREE.Group { return this.roadGroup; }

  get trackLength(): number { return this.totalSegments * SEGMENT_LENGTH; }
}
