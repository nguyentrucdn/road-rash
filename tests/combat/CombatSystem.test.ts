import { describe, it, expect } from 'vitest';
import { CombatSystem } from '@/combat/CombatSystem';
import { Bike } from '@/entities/Bike';
import { AttackType } from '@/combat/AttackTypes';

describe('CombatSystem', () => {
  it('registers a hit when bikes are alongside within range', () => {
    const attacker = new Bike(0, 100);
    const defender = new Bike(1.2, 100);
    const combat = new CombatSystem();
    const result = combat.tryAttack(attacker, defender, AttackType.PunchRight);
    expect(result.hit).toBe(true);
    expect(defender.health).toBeLessThan(100);
  });
  it('misses when target is too far laterally', () => {
    const attacker = new Bike(0, 100);
    const defender = new Bike(5, 100);
    const combat = new CombatSystem();
    const result = combat.tryAttack(attacker, defender, AttackType.PunchRight);
    expect(result.hit).toBe(false);
    expect(defender.health).toBe(100);
  });
  it('misses when target is too far in Z', () => {
    const attacker = new Bike(0, 100);
    const defender = new Bike(1, 120);
    const combat = new CombatSystem();
    const result = combat.tryAttack(attacker, defender, AttackType.PunchRight);
    expect(result.hit).toBe(false);
  });
  it('wrong side attack misses', () => {
    const attacker = new Bike(0, 100);
    const defender = new Bike(-1.2, 100);
    const combat = new CombatSystem();
    const result = combat.tryAttack(attacker, defender, AttackType.PunchRight);
    expect(result.hit).toBe(false);
  });
  it('duck avoids high attacks', () => {
    const attacker = new Bike(0, 100);
    const defender = new Bike(1.2, 100);
    defender.isDucking = true;
    const combat = new CombatSystem();
    const result = combat.tryAttack(attacker, defender, AttackType.PunchRight);
    expect(result.hit).toBe(false);
    expect(result.ducked).toBe(true);
  });
  it('block reduces damage', () => {
    const attacker = new Bike(0, 100);
    const defender = new Bike(1.2, 100);
    defender.isBlocking = true;
    const combat = new CombatSystem();
    const result = combat.tryAttack(attacker, defender, AttackType.PunchRight);
    expect(result.hit).toBe(true);
    expect(result.blocked).toBe(true);
    expect(defender.health).toBeGreaterThan(100 - 8);
  });
  it('respects attack cooldown', () => {
    const attacker = new Bike(0, 100);
    const defender = new Bike(1.2, 100);
    const combat = new CombatSystem();
    combat.tryAttack(attacker, defender, AttackType.PunchRight);
    const result2 = combat.tryAttack(attacker, defender, AttackType.PunchRight);
    expect(result2.onCooldown).toBe(true);
    expect(result2.hit).toBe(false);
  });
});
