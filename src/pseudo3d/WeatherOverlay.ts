// src/pseudo3d/WeatherOverlay.ts
import { WeatherProperties } from '@/effects/WeatherSystem';

export class WeatherOverlay {
  private rainDrops: { x: number; y: number; speed: number }[] = [];
  private snowFlakes: { x: number; y: number; speed: number; drift: number }[] = [];
  private dustParticles: { x: number; y: number; speed: number }[] = [];

  constructor() {
    // Pre-allocate particles
    for (let i = 0; i < 80; i++) {
      this.rainDrops.push({ x: 0, y: 0, speed: 0 });
      this.snowFlakes.push({ x: 0, y: 0, speed: 0, drift: 0 });
      this.dustParticles.push({ x: 0, y: 0, speed: 0 });
    }
    this.resetParticles();
  }

  private resetParticles(): void {
    for (const d of this.rainDrops) {
      d.x = Math.random() * 2000;
      d.y = Math.random() * 1200;
      d.speed = 800 + Math.random() * 400;
    }
    for (const s of this.snowFlakes) {
      s.x = Math.random() * 2000;
      s.y = Math.random() * 1200;
      s.speed = 40 + Math.random() * 60;
      s.drift = (Math.random() - 0.5) * 30;
    }
    for (const p of this.dustParticles) {
      p.x = Math.random() * 2000;
      p.y = Math.random() * 1200;
      p.speed = 100 + Math.random() * 200;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dt: number,
    weather: WeatherProperties,
    playerSpeed: number,
  ): void {
    if (weather.particleType === 'none' && weather.visibility >= 0.95) return;

    // Fog/smog overlay
    if (weather.visibility < 0.95) {
      const fogAlpha = (1 - weather.visibility) * 0.4;
      const fogColor = weather.particleType === 'smog' ? `rgba(150,130,100,${fogAlpha})` : `rgba(200,210,220,${fogAlpha})`;
      ctx.fillStyle = fogColor;
      ctx.fillRect(0, 0, width, height);
    }

    const speedFactor = playerSpeed / 60;

    switch (weather.particleType) {
      case 'rain': {
        ctx.strokeStyle = `rgba(180,200,220,${weather.particleIntensity * 0.5})`;
        ctx.lineWidth = 1;
        for (const d of this.rainDrops) {
          d.y += d.speed * dt;
          d.x -= speedFactor * 50 * dt;
          if (d.y > height) { d.y = -20; d.x = Math.random() * width; }
          if (d.x < 0) d.x = width;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + 2 + speedFactor * 3, d.y + 15 + speedFactor * 5);
          ctx.stroke();
        }
        break;
      }
      case 'snow': {
        ctx.fillStyle = `rgba(255,255,255,${weather.particleIntensity * 0.7})`;
        for (const s of this.snowFlakes) {
          s.y += s.speed * dt;
          s.x += s.drift * dt + Math.sin(Date.now() * 0.001 + s.x) * 0.5;
          if (s.y > height) { s.y = -10; s.x = Math.random() * width; }
          ctx.beginPath();
          ctx.arc(s.x, s.y, 2 + Math.random(), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'dust': {
        ctx.fillStyle = `rgba(180,150,100,${weather.particleIntensity * 0.3})`;
        for (const p of this.dustParticles) {
          p.x += p.speed * dt * weather.windStrength;
          p.y += Math.sin(Date.now() * 0.002 + p.x) * dt * 20;
          if (p.x > width) { p.x = -10; p.y = Math.random() * height; }
          ctx.fillRect(p.x, p.y, 3 + Math.random() * 2, 2);
        }
        break;
      }
      case 'leaves': {
        ctx.fillStyle = `rgba(120,90,40,${weather.particleIntensity * 0.5})`;
        for (const p of this.dustParticles) {
          p.x += p.speed * dt * weather.windStrength * 1.5;
          p.y += Math.sin(Date.now() * 0.003 + p.x) * dt * 40;
          if (p.x > width) { p.x = -20; p.y = Math.random() * height; }
          ctx.fillRect(p.x, p.y, 4, 3);
        }
        break;
      }
    }

    // Night headlight cone
    if (weather.lightingIntensity < 0.4) {
      const grad = ctx.createRadialGradient(width / 2, height * 0.6, 10, width / 2, height * 0.4, height * 0.4);
      grad.addColorStop(0, 'rgba(255,255,200,0.15)');
      grad.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 30, height * 0.75);
      ctx.lineTo(width / 2 - 200, height * 0.35);
      ctx.lineTo(width / 2 + 200, height * 0.35);
      ctx.lineTo(width / 2 + 30, height * 0.75);
      ctx.fill();
    }
  }
}
