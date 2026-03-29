export enum GameAction {
  Accelerate, Brake, SteerLeft, SteerRight,
  PunchLeft, PunchRight, KickLeft, KickRight,
  UseWeapon, Block, GrabWeapon, Nitro, Pause,
}

const KEY_MAP: Record<string, GameAction> = {
  KeyW: GameAction.Accelerate, ArrowUp: GameAction.Accelerate,
  KeyS: GameAction.Brake, ArrowDown: GameAction.Brake,
  KeyA: GameAction.SteerLeft, ArrowLeft: GameAction.SteerLeft,
  KeyD: GameAction.SteerRight, ArrowRight: GameAction.SteerRight,
  KeyQ: GameAction.PunchLeft, KeyE: GameAction.PunchRight,
  KeyZ: GameAction.KickLeft, KeyC: GameAction.KickRight,
  KeyF: GameAction.UseWeapon,
  ShiftLeft: GameAction.Block, ShiftRight: GameAction.Block,
  KeyG: GameAction.GrabWeapon, Space: GameAction.Nitro, Escape: GameAction.Pause,
};

export class InputManager {
  private activeActions = new Set<GameAction>();
  private justPressedActions = new Set<GameAction>();
  private touchSteer = 0;

  handleKeyDown(code: string): void {
    const action = KEY_MAP[code];
    if (action !== undefined) {
      if (!this.activeActions.has(action)) {
        this.justPressedActions.add(action);
      }
      this.activeActions.add(action);
    }
  }

  handleKeyUp(code: string): void {
    const action = KEY_MAP[code];
    if (action !== undefined) {
      this.activeActions.delete(action);
    }
  }

  isActive(action: GameAction): boolean {
    return this.activeActions.has(action);
  }

  justPressed(action: GameAction): boolean {
    return this.justPressedActions.has(action);
  }

  endFrame(): void {
    this.justPressedActions.clear();
  }

  setTouchAction(action: GameAction, active: boolean): void {
    if (active) {
      if (!this.activeActions.has(action)) {
        this.justPressedActions.add(action);
      }
      this.activeActions.add(action);
    } else {
      this.activeActions.delete(action);
    }
  }

  setTouchSteer(value: number): void {
    this.touchSteer = value;
  }

  getTouchSteer(): number {
    return this.touchSteer;
  }

  bindDom(): void {
    window.addEventListener('keydown', (e) => {
      if (KEY_MAP[e.code] !== undefined) {
        e.preventDefault();
        this.handleKeyDown(e.code);
      }
    });
    window.addEventListener('keyup', (e) => {
      this.handleKeyUp(e.code);
    });
  }
}
