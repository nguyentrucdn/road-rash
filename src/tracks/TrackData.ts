import { RoadSegment } from '@/world/RoadSegment';

export interface SceneryDef {
  type: string;
  color: number;
  scale: number;
  frequency: number;
}

export interface TrackData {
  name: string;
  segmentCount: number;
  trafficDensity: number;
  skyColor: number;
  groundColor: number;
  roadColor: number;
  shoulderColor: number;
  scenery: SceneryDef[];
  fogDensity: number;
  fogColor: number;
  generateSegments(): RoadSegment[];
}
