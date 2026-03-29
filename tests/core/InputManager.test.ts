import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputManager, GameAction } from '@/core/InputManager';

describe('InputManager', () => {
  let input: InputManager;
  beforeEach(() => { input = new InputManager(); });

  it('registers key down events', () => {
    input.handleKeyDown('KeyW');
    expect(input.isActive(GameAction.Accelerate)).toBe(true);
  });
  it('registers key up events', () => {
    input.handleKeyDown('KeyW');
    input.handleKeyUp('KeyW');
    expect(input.isActive(GameAction.Accelerate)).toBe(false);
  });
  it('maps WASD keys correctly', () => {
    input.handleKeyDown('KeyA');
    expect(input.isActive(GameAction.SteerLeft)).toBe(true);
    input.handleKeyDown('KeyD');
    expect(input.isActive(GameAction.SteerRight)).toBe(true);
    input.handleKeyDown('KeyS');
    expect(input.isActive(GameAction.Brake)).toBe(true);
  });
  it('maps arrow keys correctly', () => {
    input.handleKeyDown('ArrowUp');
    expect(input.isActive(GameAction.Accelerate)).toBe(true);
    input.handleKeyDown('ArrowLeft');
    expect(input.isActive(GameAction.SteerLeft)).toBe(true);
  });
  it('maps combat keys correctly', () => {
    input.handleKeyDown('KeyQ');
    expect(input.isActive(GameAction.PunchLeft)).toBe(true);
    input.handleKeyDown('KeyE');
    expect(input.isActive(GameAction.PunchRight)).toBe(true);
    input.handleKeyDown('KeyZ');
    expect(input.isActive(GameAction.KickLeft)).toBe(true);
    input.handleKeyDown('KeyC');
    expect(input.isActive(GameAction.KickRight)).toBe(true);
    input.handleKeyDown('KeyF');
    expect(input.isActive(GameAction.UseWeapon)).toBe(true);
    input.handleKeyDown('ShiftLeft');
    expect(input.isActive(GameAction.Block)).toBe(true);
    input.handleKeyDown('KeyG');
    expect(input.isActive(GameAction.GrabWeapon)).toBe(true);
    input.handleKeyDown('Space');
    expect(input.isActive(GameAction.Nitro)).toBe(true);
  });
  it('detects just-pressed (edge trigger)', () => {
    input.handleKeyDown('KeyW');
    expect(input.justPressed(GameAction.Accelerate)).toBe(true);
    input.endFrame();
    expect(input.justPressed(GameAction.Accelerate)).toBe(false);
    expect(input.isActive(GameAction.Accelerate)).toBe(true);
  });
  it('sets touch input actions', () => {
    input.setTouchAction(GameAction.Accelerate, true);
    expect(input.isActive(GameAction.Accelerate)).toBe(true);
    input.setTouchAction(GameAction.Accelerate, false);
    expect(input.isActive(GameAction.Accelerate)).toBe(false);
  });
  it('touch steering value is readable', () => {
    input.setTouchSteer(-0.5);
    expect(input.getTouchSteer()).toBe(-0.5);
  });
});
