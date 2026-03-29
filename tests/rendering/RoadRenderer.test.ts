import { describe, it, expect } from 'vitest';
import { RoadRenderer } from '@/rendering/RoadRenderer';
import { desertTrack } from '@/tracks/desert';
import { Road } from '@/world/Road';

describe('RoadRenderer', () => {
  it('creates road mesh group with children', () => {
    const road = new Road(desertTrack);
    const renderer = new RoadRenderer(road);
    renderer.rebuild(100);
    const group = renderer.getGroup();
    expect(group.children.length).toBeGreaterThan(0);
  });

  it('creates lane markings group', () => {
    const road = new Road(desertTrack);
    const renderer = new RoadRenderer(road);
    renderer.rebuild(100);
    const markings = renderer.getMarkingsGroup();
    expect(markings.children.length).toBeGreaterThan(0);
  });
});
