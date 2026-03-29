export enum AttackType {
  PunchLeft = 'punch_left', PunchRight = 'punch_right',
  KickLeft = 'kick_left', KickRight = 'kick_right',
  WeaponChain = 'weapon_chain', WeaponClub = 'weapon_club', WeaponCrowbar = 'weapon_crowbar',
}

export interface Attack {
  type: AttackType; damage: number; range: number; cooldown: number;
  knockback: number; side: 'left' | 'right' | 'both'; isHigh: boolean;
}

const ATTACKS: Record<AttackType, Attack> = {
  [AttackType.PunchLeft]:     { type: AttackType.PunchLeft, damage: 8, range: 1.5, cooldown: 0.3, knockback: 0.5, side: 'left', isHigh: true },
  [AttackType.PunchRight]:    { type: AttackType.PunchRight, damage: 8, range: 1.5, cooldown: 0.3, knockback: 0.5, side: 'right', isHigh: true },
  [AttackType.KickLeft]:      { type: AttackType.KickLeft, damage: 15, range: 2.0, cooldown: 0.6, knockback: 1.5, side: 'left', isHigh: false },
  [AttackType.KickRight]:     { type: AttackType.KickRight, damage: 15, range: 2.0, cooldown: 0.6, knockback: 1.5, side: 'right', isHigh: false },
  [AttackType.WeaponChain]:   { type: AttackType.WeaponChain, damage: 20, range: 2.5, cooldown: 0.5, knockback: 1.0, side: 'both', isHigh: true },
  [AttackType.WeaponClub]:    { type: AttackType.WeaponClub, damage: 30, range: 1.8, cooldown: 0.8, knockback: 3.0, side: 'both', isHigh: true },
  [AttackType.WeaponCrowbar]: { type: AttackType.WeaponCrowbar, damage: 22, range: 2.2, cooldown: 0.5, knockback: 1.5, side: 'both', isHigh: true },
};

export function getAttack(type: AttackType): Attack { return ATTACKS[type]; }
