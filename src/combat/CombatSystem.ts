import { Bike } from '@/entities/Bike';
import { AttackType, getAttack } from '@/combat/AttackTypes';

export interface AttackResult {
  hit: boolean; damage: number; blocked: boolean;
  ducked: boolean; onCooldown: boolean; knockback: number;
}

const Z_RANGE = 5;

export class CombatSystem {
  tryAttack(attacker: Bike, defender: Bike, attackType: AttackType): AttackResult {
    const attack = getAttack(attackType);
    const result: AttackResult = { hit: false, damage: 0, blocked: false, ducked: false, onCooldown: false, knockback: 0 };
    if (attacker.attackCooldown > 0) { result.onCooldown = true; return result; }
    attacker.attackCooldown = attack.cooldown;
    const dz = Math.abs(attacker.z - defender.z);
    if (dz > Z_RANGE) return result;
    const dx = defender.x - attacker.x;
    if (Math.abs(dx) > attack.range) return result;
    if (attack.side === 'left' && dx > 0) return result;
    if (attack.side === 'right' && dx < 0) return result;
    if (defender.isDucking && attack.isHigh) { result.ducked = true; return result; }
    result.hit = true;
    let damage = attack.damage;
    if (defender.isBlocking) { result.blocked = true; damage = Math.floor(damage * 0.5); }
    result.damage = damage;
    result.knockback = attack.knockback;
    defender.takeDamage(damage);
    defender.x += Math.sign(dx) * attack.knockback * (result.blocked ? 0.3 : 1);
    return result;
  }

  findTargetsInRange(attacker: Bike, allBikes: Bike[]): Bike[] {
    return allBikes.filter((b) => {
      if (b === attacker || b.crashed) return false;
      return Math.abs(attacker.z - b.z) < Z_RANGE && Math.abs(attacker.x - b.x) < 3;
    });
  }
}
