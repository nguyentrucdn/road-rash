import { describe, it, expect } from 'vitest';
import { getAttack, AttackType } from '@/combat/AttackTypes';

describe('AttackTypes', () => {
  it('punch has quick speed and low damage', () => {
    const punch = getAttack(AttackType.PunchLeft);
    expect(punch.damage).toBeLessThan(15);
    expect(punch.cooldown).toBeLessThan(0.4);
    expect(punch.range).toBeLessThan(2);
  });
  it('kick has more damage and range than punch', () => {
    const kick = getAttack(AttackType.KickLeft);
    const punch = getAttack(AttackType.PunchLeft);
    expect(kick.damage).toBeGreaterThan(punch.damage);
    expect(kick.range).toBeGreaterThan(punch.range);
    expect(kick.cooldown).toBeGreaterThan(punch.cooldown);
  });
  it('weapon attacks do more damage than melee', () => {
    const chain = getAttack(AttackType.WeaponChain);
    const punch = getAttack(AttackType.PunchLeft);
    expect(chain.damage).toBeGreaterThan(punch.damage);
  });
  it('all attacks have a side', () => {
    const punchL = getAttack(AttackType.PunchLeft);
    const punchR = getAttack(AttackType.PunchRight);
    expect(punchL.side).toBe('left');
    expect(punchR.side).toBe('right');
  });
});
