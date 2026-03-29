import { describe, it, expect, vi } from 'vitest';
import { GameLoop } from '@/core/GameLoop';

describe('GameLoop', () => {
  it('calls update with fixed delta time', () => {
    const updateFn = vi.fn();
    const renderFn = vi.fn();
    const loop = new GameLoop(updateFn, renderFn);
    loop.tick(1000 / 60);
    expect(updateFn).toHaveBeenCalledWith(1 / 60);
  });

  it('accumulates time for multiple physics steps', () => {
    const updateFn = vi.fn();
    const renderFn = vi.fn();
    const loop = new GameLoop(updateFn, renderFn);
    loop.tick((1000 / 60) * 2);
    expect(updateFn).toHaveBeenCalledTimes(2);
  });

  it('calls render once per tick regardless of physics steps', () => {
    const updateFn = vi.fn();
    const renderFn = vi.fn();
    const loop = new GameLoop(updateFn, renderFn);
    loop.tick((1000 / 60) * 3);
    expect(renderFn).toHaveBeenCalledTimes(1);
  });

  it('caps accumulated time to prevent spiral of death', () => {
    const updateFn = vi.fn();
    const renderFn = vi.fn();
    const loop = new GameLoop(updateFn, renderFn);
    loop.tick(1000);
    expect(updateFn.mock.calls.length).toBeLessThanOrEqual(5);
  });
});
