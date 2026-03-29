// src/pseudo3d/CanvasHUD.ts
import { PixelFont } from '@/pseudo3d/PixelFont';
import { Bike } from '@/entities/Bike';

export class CanvasHUD {
  private font = new PixelFont();

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bike: Bike,
    position: number,
    raceTime: number,
  ): void {
    // Speed — bottom left
    const kmh = Math.round(bike.speed * 3.6);
    this.font.drawText(ctx, `${kmh} KM/H`, 20, height - 40, 3, '#ffffff');

    // Position — top center
    const ordinals = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH'];
    const posText = ordinals[position - 1] ?? `${position}TH`;
    const posColor = position <= 3 ? '#44ff44' : '#ff4444';
    const posW = this.font.measureText(posText, 4);
    this.font.drawText(ctx, posText, width / 2 - posW / 2, 15, 4, posColor);

    // Timer — below position
    const mins = Math.floor(raceTime / 60);
    const secs = Math.floor(raceTime % 60).toString().padStart(2, '0');
    const timeText = `${mins}:${secs}`;
    const timeW = this.font.measureText(timeText, 2);
    this.font.drawText(ctx, timeText, width / 2 - timeW / 2, 50, 2, '#cccccc');

    // Health bar — bottom center
    const barW = 160;
    const barH = 10;
    const barX = width / 2 - barW / 2;
    const barY = height - 30;

    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barW, barH);

    const healthPct = bike.health / 100;
    const healthColor = healthPct > 0.6 ? '#44ff44' : healthPct > 0.3 ? '#ffaa00' : '#ff4444';
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barW * healthPct, barH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    this.font.drawText(ctx, 'HEALTH', barX, barY + barH + 4, 1, '#888888');

    // Weapon — bottom right
    if (bike.weapon) {
      const weaponText = bike.weapon.toUpperCase();
      const ww = this.font.measureText(weaponText, 2);
      this.font.drawText(ctx, weaponText, width - ww - 20, height - 35, 2, '#ffcc00');
    }

    // Nitro indicator
    if (bike.hasNitro) {
      this.font.drawText(ctx, 'NITRO READY', width / 2 - this.font.measureText('NITRO READY', 2) / 2, height - 60, 2, '#ff8800');
    } else if (bike.nitroActive) {
      this.font.drawText(ctx, 'NITRO', width / 2 - this.font.measureText('NITRO', 3) / 2, height - 65, 3, '#ff4400');
    }
  }

  static calcPosition(playerZ: number, aiZPositions: number[]): number {
    let position = 1;
    for (const z of aiZPositions) {
      if (z > playerZ) position++;
    }
    return position;
  }
}
