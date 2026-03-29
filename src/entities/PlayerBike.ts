import { Bike } from '@/entities/Bike';
import { InputManager, GameAction } from '@/core/InputManager';
import { Road } from '@/world/Road';
import { CombatSystem, AttackResult } from '@/combat/CombatSystem';
import { AttackType } from '@/combat/AttackTypes';

export class PlayerBike {
  bike: Bike;
  constructor(private input: InputManager, private road: Road, startX: number, startZ: number) {
    this.bike = new Bike(startX, startZ);
  }
  update(dt: number): void {
    // Ducking / blocking
    this.bike.isDucking = false;
    this.bike.isBlocking = false;
    if (this.input.isActive(GameAction.Block)) {
      if (this.input.justPressed(GameAction.Block)) {
        this.bike.isBlocking = true;
      } else {
        this.bike.isDucking = true;
      }
    }

    if (this.input.isActive(GameAction.Accelerate)) this.bike.accelerate(dt);
    else if (this.input.isActive(GameAction.Brake)) this.bike.brake(dt);
    this.bike.applyDrag(dt);
    let steerDir = 0;
    if (this.input.isActive(GameAction.SteerLeft)) steerDir = -1;
    if (this.input.isActive(GameAction.SteerRight)) steerDir = 1;
    const touchSteer = this.input.getTouchSteer();
    if (Math.abs(touchSteer) > 0.1) steerDir = touchSteer;
    if (steerDir !== 0) this.bike.steer(steerDir, dt);
    const seg = this.road.getSegmentAt(this.bike.z);
    this.bike.x -= seg.curve * this.bike.speed * dt * 0.02;
    const halfWidth = this.road.getWidth(this.bike.z) / 2 + 3;
    if (Math.abs(this.bike.x) > halfWidth) this.bike.x = Math.sign(this.bike.x) * halfWidth;
    const roadHalfWidth = this.road.getWidth(this.bike.z) / 2;
    if (Math.abs(this.bike.x) > roadHalfWidth) this.bike.speed *= (1 - 0.5 * dt);
    if (this.input.justPressed(GameAction.Nitro)) this.bike.activateNitro();
    this.bike.updatePosition(dt);
    const roadX = this.road.getRoadXOffset(this.bike.z);
    const roadY = this.road.getElevation(this.bike.z);
    this.bike.updateMesh(roadX, roadY);
  }

  resolveAttacks(targets: Bike[], combat: CombatSystem): AttackResult | null {
    let attackType: AttackType | null = null;
    if (this.input.justPressed(GameAction.PunchLeft)) attackType = AttackType.PunchLeft;
    else if (this.input.justPressed(GameAction.PunchRight)) attackType = AttackType.PunchRight;
    else if (this.input.justPressed(GameAction.KickLeft)) attackType = AttackType.KickLeft;
    else if (this.input.justPressed(GameAction.KickRight)) attackType = AttackType.KickRight;
    else if (this.input.justPressed(GameAction.UseWeapon) && this.bike.weapon) {
      const weaponMap: Record<string, AttackType> = {
        chain: AttackType.WeaponChain, club: AttackType.WeaponClub, crowbar: AttackType.WeaponCrowbar,
      };
      attackType = weaponMap[this.bike.weapon] ?? null;
    }
    if (!attackType) return null;
    for (const target of targets) {
      const result = combat.tryAttack(this.bike, target, attackType);
      if (result.hit) return result;
    }
    return null;
  }
}
