import * as THREE from 'three';
import { RoadSegment, SEGMENT_LENGTH } from '@/world/RoadSegment';
import { TrackData } from '@/tracks/TrackData';
import { RoadRenderer } from '@/rendering/RoadRenderer';

const VISIBLE_SEGMENTS = 150;
const BEHIND_SEGMENTS = 10;

export class Road {
  private segments: RoadSegment[];
  private cumulativeCurve: number[] = [];
  private cumulativeHill: number[] = [];
  readonly totalSegments: number;
  private roadGroup = new THREE.Group();
  private renderer: RoadRenderer;

  constructor(private track: TrackData) {
    this.segments = track.generateSegments();
    this.totalSegments = this.segments.length;
    this.renderer = new RoadRenderer(this, track.roadColor, track.shoulderColor);
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
    this.renderer.rebuild(playerZ);
    return this.roadGroup;
  }

  getGroup(): THREE.Group { return this.renderer.getGroup(); }

  getMarkingsGroup(): THREE.Group { return this.renderer.getMarkingsGroup(); }

  get trackLength(): number { return this.totalSegments * SEGMENT_LENGTH; }
}
