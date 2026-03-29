import { describe, it, expect } from 'vitest';
import { RoadSegment, createSegment } from '@/world/RoadSegment';

describe('RoadSegment', () => {
  it('creates a segment with default values', () => {
    const seg = createSegment(0);
    expect(seg.index).toBe(0);
    expect(seg.curve).toBe(0);
    expect(seg.hill).toBe(0);
    expect(seg.width).toBe(12);
  });
  it('creates a segment with custom values', () => {
    const seg = createSegment(5, { curve: 0.3, hill: -0.1, width: 10 });
    expect(seg.index).toBe(5);
    expect(seg.curve).toBe(0.3);
    expect(seg.hill).toBe(-0.1);
    expect(seg.width).toBe(10);
  });
  it('world z position is index times segment length', () => {
    const seg = createSegment(10);
    expect(seg.worldZ).toBe(10 * seg.segmentLength);
  });
});
