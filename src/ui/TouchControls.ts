import { InputManager, GameAction } from '@/core/InputManager';

export class TouchControls {
  private container: HTMLElement;
  private visible = false;

  constructor(private input: InputManager) {
    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.style.cssText = `
      position:fixed;bottom:0;left:0;width:100%;height:200px;
      pointer-events:none;z-index:50;display:none;
    `;

    // Left side — joystick zone
    const leftZone = document.createElement('div');
    leftZone.style.cssText = `
      position:absolute;left:20px;bottom:20px;width:120px;height:120px;
      background:rgba(255,255,255,0.15);border-radius:60px;pointer-events:auto;
      border:2px solid rgba(255,255,255,0.3);
    `;
    const knob = document.createElement('div');
    knob.style.cssText = `
      width:50px;height:50px;background:rgba(255,255,255,0.4);border-radius:25px;
      position:absolute;top:35px;left:35px;transition:transform 0.05s;
    `;
    leftZone.appendChild(knob);

    let joystickActive = false;
    const centerX = 60, centerY = 60;

    leftZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      joystickActive = true;
      input.setTouchAction(GameAction.Accelerate, true);
    }, { passive: false });

    leftZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!joystickActive) return;
      const touch = e.touches[0];
      const rect = leftZone.getBoundingClientRect();
      const dx = (touch.clientX - rect.left - centerX) / centerX;
      const dy = (touch.clientY - rect.top - centerY) / centerY;

      const clampedDx = Math.max(-1, Math.min(1, dx));
      const clampedDy = Math.max(-1, Math.min(1, dy));

      knob.style.transform = `translate(${clampedDx * 30}px, ${clampedDy * 30}px)`;

      input.setTouchSteer(clampedDx);
      input.setTouchAction(GameAction.Brake, clampedDy > 0.3);
      input.setTouchAction(GameAction.Accelerate, clampedDy <= 0.3);
    }, { passive: false });

    leftZone.addEventListener('touchend', () => {
      joystickActive = false;
      knob.style.transform = 'translate(0, 0)';
      input.setTouchSteer(0);
      input.setTouchAction(GameAction.Accelerate, false);
      input.setTouchAction(GameAction.Brake, false);
    });

    this.container.appendChild(leftZone);

    // Right side — action buttons
    const rightZone = document.createElement('div');
    rightZone.style.cssText = `
      position:absolute;right:20px;bottom:20px;display:grid;
      grid-template-columns:1fr 1fr;gap:8px;pointer-events:auto;
    `;

    const buttons: { label: string; action: GameAction }[] = [
      { label: '👊', action: GameAction.PunchRight },
      { label: '🦶', action: GameAction.KickRight },
      { label: '🗡️', action: GameAction.UseWeapon },
      { label: '🛡️', action: GameAction.Block },
    ];

    for (const btn of buttons) {
      const el = document.createElement('div');
      el.textContent = btn.label;
      el.style.cssText = `
        width:60px;height:60px;background:rgba(255,255,255,0.2);
        border-radius:30px;display:flex;align-items:center;justify-content:center;
        font-size:24px;border:2px solid rgba(255,255,255,0.3);user-select:none;
      `;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        input.setTouchAction(btn.action, true);
        el.style.background = 'rgba(255,255,255,0.4)';
      }, { passive: false });
      el.addEventListener('touchend', () => {
        input.setTouchAction(btn.action, false);
        el.style.background = 'rgba(255,255,255,0.2)';
      });
      rightZone.appendChild(el);
    }

    // Nitro button
    const nitroBtn = document.createElement('div');
    nitroBtn.textContent = '🔥';
    nitroBtn.style.cssText = `
      position:absolute;right:180px;bottom:60px;width:50px;height:50px;
      background:rgba(255,136,0,0.3);border-radius:25px;pointer-events:auto;
      display:flex;align-items:center;justify-content:center;font-size:24px;
      border:2px solid rgba(255,136,0,0.5);user-select:none;
    `;
    nitroBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      input.setTouchAction(GameAction.Nitro, true);
    }, { passive: false });
    nitroBtn.addEventListener('touchend', () => {
      input.setTouchAction(GameAction.Nitro, false);
    });

    this.container.appendChild(rightZone);
    this.container.appendChild(nitroBtn);
    document.body.appendChild(this.container);

    // Auto-detect touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.show();
    }
  }

  show(): void {
    this.visible = true;
    this.container.style.display = 'block';
  }

  hide(): void {
    this.visible = false;
    this.container.style.display = 'none';
  }

  destroy(): void {
    this.container.remove();
  }
}
