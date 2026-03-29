import { describe, it, expect } from 'vitest';
import { Bike } from '@/entities/Bike';

describe('Bike', () => {
  it('starts at given position with zero speed', () => {
    const bike = new Bike(0, 0);
    expect(bike.z).toBe(0);
    expect(bike.x).toBe(0);
    expect(bike.speed).toBe(0);
  });
  it('accelerates up to max speed', () => {
    const bike = new Bike(0, 0);
    for (let i = 0; i < 300; i++) bike.accelerate(1 / 60);
    expect(bike.speed).toBeGreaterThan(0);
    expect(bike.speed).toBeLessThanOrEqual(bike.maxSpeed);
  });
  it('brakes to reduce speed', () => {
    const bike = new Bike(0, 0);
    for (let i = 0; i < 60; i++) bike.accelerate(1 / 60);
    const speedBeforeBrake = bike.speed;
    bike.brake(1 / 60);
    expect(bike.speed).toBeLessThan(speedBeforeBrake);
  });
  it('drag slows bike when not accelerating', () => {
    const bike = new Bike(0, 0);
    for (let i = 0; i < 60; i++) bike.accelerate(1 / 60);
    const speedBefore = bike.speed;
    bike.applyDrag(1 / 60);
    expect(bike.speed).toBeLessThan(speedBefore);
  });
  it('steering changes x position', () => {
    const bike = new Bike(0, 0);
    bike.speed = 30;
    bike.steer(-1, 1 / 60);
    expect(bike.x).toBeLessThan(0);
  });
  it('lean angle reflects steering direction', () => {
    const bike = new Bike(0, 0);
    bike.speed = 30;
    bike.steer(1, 1 / 60);
    expect(bike.lean).toBeGreaterThan(0);
  });
  it('updatePosition moves bike forward', () => {
    const bike = new Bike(0, 0);
    bike.speed = 50;
    bike.updatePosition(1 / 60);
    expect(bike.z).toBeCloseTo(50 / 60, 1);
  });
  it('has health that can take damage', () => {
    const bike = new Bike(0, 0);
    expect(bike.health).toBe(100);
    bike.takeDamage(25);
    expect(bike.health).toBe(75);
  });
  it('health does not go below zero', () => {
    const bike = new Bike(0, 0);
    bike.takeDamage(200);
    expect(bike.health).toBe(0);
  });
  it('nitro boosts speed temporarily', () => {
    const bike = new Bike(0, 0);
    bike.speed = bike.maxSpeed;
    expect(bike.hasNitro).toBe(true);
    bike.activateNitro();
    expect(bike.hasNitro).toBe(false);
    expect(bike.nitroActive).toBe(true);
    expect(bike.currentMaxSpeed).toBeGreaterThan(bike.maxSpeed);
  });
});
