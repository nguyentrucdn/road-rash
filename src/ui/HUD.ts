import { Bike } from '@/entities/Bike';

export class HUD {
  private container: HTMLElement;
  private speedEl: HTMLElement;
  private positionEl: HTMLElement;
  private healthBar: HTMLElement;
  private healthFill: HTMLElement;
  private weaponEl: HTMLElement;
  private timerEl: HTMLElement;

  constructor() {
    this.container = document.getElementById('hud')!;

    this.container.innerHTML = `
      <div style="position:absolute;bottom:30px;left:30px;">
        <div id="hud-speed" style="font-size:48px;font-weight:bold;">0 km/h</div>
      </div>
      <div style="position:absolute;top:20px;left:50%;transform:translateX(-50%);text-align:center;">
        <div id="hud-position" style="font-size:36px;font-weight:bold;">1st</div>
        <div id="hud-timer" style="font-size:18px;margin-top:4px;">0:00</div>
      </div>
      <div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);width:200px;">
        <div style="background:rgba(0,0,0,0.5);border-radius:4px;height:12px;overflow:hidden;">
          <div id="hud-health-fill" style="background:#44ff44;height:100%;width:100%;transition:width 0.2s;"></div>
        </div>
        <div style="text-align:center;font-size:12px;margin-top:2px;">HEALTH</div>
      </div>
      <div style="position:absolute;bottom:30px;right:30px;">
        <div id="hud-weapon" style="font-size:18px;"></div>
      </div>
      <div id="hud-nitro" style="position:absolute;bottom:80px;left:50%;transform:translateX(-50%);font-size:14px;color:#ff8800;"></div>
    `;

    this.speedEl = document.getElementById('hud-speed')!;
    this.positionEl = document.getElementById('hud-position')!;
    this.healthBar = this.container.querySelector('#hud-health-fill')!.parentElement!;
    this.healthFill = document.getElementById('hud-health-fill')!;
    this.weaponEl = document.getElementById('hud-weapon')!;
    this.timerEl = document.getElementById('hud-timer')!;
  }

  update(playerBike: Bike, position: number, raceTime: number): void {
    // Speed (convert m/s to km/h)
    const kmh = Math.round(playerBike.speed * 3.6);
    this.speedEl.textContent = `${kmh} km/h`;

    // Position
    const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
    this.positionEl.textContent = ordinals[position - 1] || `${position}th`;
    this.positionEl.style.color = position <= 3 ? '#44ff44' : '#ff4444';

    // Health
    const healthPct = playerBike.health;
    this.healthFill.style.width = `${healthPct}%`;
    if (healthPct > 60) this.healthFill.style.background = '#44ff44';
    else if (healthPct > 30) this.healthFill.style.background = '#ffaa00';
    else this.healthFill.style.background = '#ff4444';

    // Weapon
    if (playerBike.weapon) {
      const icons: Record<string, string> = { chain: '⛓️ Chain', club: '🏏 Club', crowbar: '🔧 Crowbar' };
      this.weaponEl.textContent = icons[playerBike.weapon] || playerBike.weapon;
    } else {
      this.weaponEl.textContent = '';
    }

    // Timer
    const mins = Math.floor(raceTime / 60);
    const secs = Math.floor(raceTime % 60).toString().padStart(2, '0');
    this.timerEl.textContent = `${mins}:${secs}`;

    // Nitro indicator
    const nitroEl = document.getElementById('hud-nitro')!;
    if (playerBike.hasNitro) {
      nitroEl.textContent = '🔥 NITRO READY [SPACE]';
    } else if (playerBike.nitroActive) {
      nitroEl.textContent = '🔥🔥🔥 NITRO!!! 🔥🔥🔥';
      nitroEl.style.fontSize = '24px';
    } else {
      nitroEl.textContent = '';
    }
  }

  /** Calculate player's race position among all riders. */
  static calcPosition(playerZ: number, aiZPositions: number[]): number {
    let position = 1;
    for (const z of aiZPositions) {
      if (z > playerZ) position++;
    }
    return position;
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  show(): void {
    this.container.style.display = 'block';
  }
}
