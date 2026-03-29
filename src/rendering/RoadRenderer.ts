import * as THREE from 'three';
import { Road } from '@/world/Road';
import { SEGMENT_LENGTH } from '@/world/RoadSegment';

export class RoadRenderer {
  private road: Road;
  private roadGroup = new THREE.Group();
  private markingsGroup = new THREE.Group();
  private roadMaterial: THREE.MeshStandardMaterial;
  private darkRoadMaterial: THREE.MeshStandardMaterial;
  private shoulderMaterial: THREE.MeshStandardMaterial;
  private markingMaterial: THREE.MeshStandardMaterial;
  private wetness = 0;

  constructor(road: Road, roadColor = 0x333333, shoulderColor = 0x8b7355) {
    this.road = road;

    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: roadColor,
      flatShading: true,
      roughness: 0.9,
      metalness: 0.0,
    });

    this.darkRoadMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(roadColor).multiplyScalar(0.85),
      flatShading: true,
      roughness: 0.9,
      metalness: 0.0,
    });

    this.shoulderMaterial = new THREE.MeshStandardMaterial({
      color: shoulderColor,
      flatShading: true,
      roughness: 1.0,
    });

    this.markingMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      flatShading: true,
      emissive: 0x222222,
      emissiveIntensity: 0.1,
    });
  }

  rebuild(playerZ: number): void {
    // Clear previous
    while (this.roadGroup.children.length > 0) this.roadGroup.remove(this.roadGroup.children[0]);
    while (this.markingsGroup.children.length > 0) this.markingsGroup.remove(this.markingsGroup.children[0]);

    const visible = this.road.getVisibleSegments(playerZ);

    for (let i = 0; i < visible.length - 1; i++) {
      const seg = visible[i];
      const nextSeg = visible[i + 1];

      const z1 = seg.worldZ - playerZ;
      const z2 = nextSeg.worldZ - playerZ;
      const x1 = this.road.getRoadXOffset(seg.worldZ);
      const x2 = this.road.getRoadXOffset(nextSeg.worldZ);
      const y1 = this.road.getElevation(seg.worldZ);
      const y2 = this.road.getElevation(nextSeg.worldZ);
      const w1 = seg.width / 2;
      const w2 = nextSeg.width / 2;

      // Alternating dark/light bands for speed perception
      const mat = seg.index % 2 === 0 ? this.roadMaterial : this.darkRoadMaterial;

      // Road surface
      const roadGeo = new THREE.BufferGeometry();
      roadGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        x1 - w1, y1, -z1, x1 + w1, y1, -z1, x2 + w2, y2, -z2,
        x1 - w1, y1, -z1, x2 + w2, y2, -z2, x2 - w2, y2, -z2,
      ]), 3));
      roadGeo.computeVertexNormals();
      this.roadGroup.add(new THREE.Mesh(roadGeo, mat));

      // Shoulders
      const shoulderWidth = 3;
      for (const side of [-1, 1]) {
        const sGeo = new THREE.BufferGeometry();
        sGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
          x1 + side * w1, y1, -z1,
          x1 + side * (w1 + shoulderWidth), y1 - 0.05, -z1,
          x2 + side * (w2 + shoulderWidth), y2 - 0.05, -z2,
          x1 + side * w1, y1, -z1,
          x2 + side * (w2 + shoulderWidth), y2 - 0.05, -z2,
          x2 + side * w2, y2, -z2,
        ]), 3));
        sGeo.computeVertexNormals();
        this.roadGroup.add(new THREE.Mesh(sGeo, this.shoulderMaterial));
      }

      // Center dashed line (every other pair of segments = dash, then gap)
      const dashPhase = Math.floor(seg.index / 2) % 2;
      if (dashPhase === 0) {
        const mw = 0.08; // half-width of marking
        const dashGeo = new THREE.BufferGeometry();
        dashGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
          x1 - mw, y1 + 0.01, -z1, x1 + mw, y1 + 0.01, -z1, x2 + mw, y2 + 0.01, -z2,
          x1 - mw, y1 + 0.01, -z1, x2 + mw, y2 + 0.01, -z2, x2 - mw, y2 + 0.01, -z2,
        ]), 3));
        dashGeo.computeVertexNormals();

        // Faded alpha for worn effect
        const fadedMat = this.markingMaterial.clone();
        fadedMat.opacity = 0.4 + Math.sin(seg.index * 0.3) * 0.3;
        fadedMat.transparent = fadedMat.opacity < 1;
        this.markingsGroup.add(new THREE.Mesh(dashGeo, fadedMat));
      }

      // Edge lines (solid, on both sides)
      for (const side of [-1, 1]) {
        const ew = 0.05;
        const ex1 = x1 + side * (w1 - 0.1);
        const ex2 = x2 + side * (w2 - 0.1);
        const edgeGeo = new THREE.BufferGeometry();
        edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
          ex1 - ew, y1 + 0.01, -z1, ex1 + ew, y1 + 0.01, -z1, ex2 + ew, y2 + 0.01, -z2,
          ex1 - ew, y1 + 0.01, -z1, ex2 + ew, y2 + 0.01, -z2, ex2 - ew, y2 + 0.01, -z2,
        ]), 3));
        edgeGeo.computeVertexNormals();
        const edgeMat = this.markingMaterial.clone();
        edgeMat.opacity = 0.5 + Math.sin(seg.index * 0.5) * 0.2;
        edgeMat.transparent = edgeMat.opacity < 1;
        this.markingsGroup.add(new THREE.Mesh(edgeGeo, edgeMat));
      }
    }
  }

  setWetness(value: number): void {
    this.wetness = value;
    this.roadMaterial.metalness = value * 0.3;
    this.roadMaterial.roughness = 0.9 - value * 0.5;
    this.darkRoadMaterial.metalness = value * 0.3;
    this.darkRoadMaterial.roughness = 0.9 - value * 0.5;
  }

  getGroup(): THREE.Group { return this.roadGroup; }
  getMarkingsGroup(): THREE.Group { return this.markingsGroup; }
}
