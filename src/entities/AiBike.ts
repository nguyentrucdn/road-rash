import { Bike } from '@/entities/Bike';
import { clamp, randomRange } from '@/utils/MathUtils';
import { CombatSystem } from '@/combat/CombatSystem';
import { AttackType } from '@/combat/AttackTypes';

export enum AiPersonality {
  Aggressive = 'aggressive',
  Defensive = 'defensive',
  Racer = 'racer',
}

export class AiBike {
  bike: Bike;
  personality: AiPersonality;
  targetSpeed: number;
  targetLane = 0;
  private laneChangeTimer = 0;
  private laneChangeInterval: number;

  constructor(x: number, z: number, personality: AiPersonality) {
    this.bike = new Bike(x, z);
    this.personality = personality;
    this.targetSpeed = this.bike.maxSpeed * randomRange(0.7, 0.9);
    this.targetLane = randomRange(-0.5, 0.5);
    this.laneChangeInterval = randomRange(2, 5);
  }

  updateRacing(dt: number): void {
    if (this.bike.crashed) {
      this.bike.updatePosition(dt);
      return;
    }
    if (this.bike.speed < this.targetSpeed) {
      this.bike.accelerate(dt);
    } else {
      this.bike.applyDrag(dt);
    }
    this.bike.updatePosition(dt);
  }

  updateSteering(roadXOffset: number, roadWidth: number, dt: number): void {
    if (this.bike.crashed) return;
    this.laneChangeTimer -= dt;
    if (this.laneChangeTimer <= 0) {
      this.targetLane = randomRange(-0.4, 0.4) * (roadWidth / 2);
      this.laneChangeTimer = this.laneChangeInterval;
    }
    const diff = this.targetLane - this.bike.x;
    const steerDir = clamp(diff * 0.5, -1, 1);
    if (Math.abs(diff) > 0.5) {
      this.bike.steer(steerDir, dt);
    }
    const halfWidth = roadWidth / 2 + 1;
    this.bike.x = clamp(this.bike.x, -halfWidth, halfWidth);
  }

  applyRubberBanding(playerZ: number, aiZ: number): void {
    const delta = playerZ - aiZ;
    const baseSpeed = this.bike.maxSpeed * 0.8;
    if (delta > 50) {
      this.targetSpeed = this.bike.maxSpeed * 1.05;
    } else if (delta < -50) {
      this.targetSpeed = this.bike.maxSpeed * 0.65;
    } else {
      this.targetSpeed = baseSpeed + (delta / 50) * (this.bike.maxSpeed * 0.2);
    }
  }

  updateCombat(targets: Bike[], combat: CombatSystem, _dt: number): void {
    if (this.bike.crashed) return;
    const nearTargets = combat.findTargetsInRange(this.bike, targets);
    if (nearTargets.length === 0) return;
    const target = nearTargets[0];
    const dx = target.x - this.bike.x;

    switch (this.personality) {
      case AiPersonality.Aggressive:
        if (this.bike.attackCooldown <= 0) {
          combat.tryAttack(this.bike, target, dx < 0 ? AttackType.PunchLeft : AttackType.PunchRight);
        }
        break;
      case AiPersonality.Defensive:
        this.bike.isBlocking = Math.random() > 0.7;
        if (this.bike.attackCooldown <= 0 && Math.random() > 0.6) {
          combat.tryAttack(this.bike, target, dx < 0 ? AttackType.KickLeft : AttackType.KickRight);
        }
        break;
      case AiPersonality.Racer:
        if (Math.abs(dx) < 1.5 && this.bike.attackCooldown <= 0 && Math.random() > 0.8) {
          combat.tryAttack(this.bike, target, dx < 0 ? AttackType.PunchLeft : AttackType.PunchRight);
        }
        break;
    }
  }
}
