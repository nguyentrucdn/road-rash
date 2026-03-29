export class PauseMenu {
  private container: HTMLElement;
  private visible = false;

  constructor(
    private onResume: () => void,
    private onRestart: () => void,
    private onQuit: () => void,
  ) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.7);display:none;flex-direction:column;
      align-items:center;justify-content:center;z-index:100;
      font-family:'Courier New',monospace;color:#fff;
    `;

    const title = document.createElement('h1');
    title.textContent = 'PAUSED';
    title.style.cssText = 'font-size:48px;margin-bottom:40px;';
    this.container.appendChild(title);

    const buttons = [
      { text: 'RESUME', action: () => this.toggle() },
      { text: 'RESTART', action: onRestart },
      { text: 'QUIT TO MENU', action: onQuit },
    ];

    for (const { text, action } of buttons) {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.style.cssText = `
        display:block;width:250px;padding:15px;margin:8px 0;
        background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.3);
        color:#fff;font-size:18px;font-family:'Courier New',monospace;
        cursor:pointer;border-radius:8px;
      `;
      btn.onmouseenter = () => { btn.style.borderColor = '#ff4444'; };
      btn.onmouseleave = () => { btn.style.borderColor = 'rgba(255,255,255,0.3)'; };
      btn.onclick = action;
      this.container.appendChild(btn);
    }

    document.body.appendChild(this.container);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'flex' : 'none';
    if (!this.visible) this.onResume();
  }

  get isPaused(): boolean {
    return this.visible;
  }

  destroy(): void {
    this.container.remove();
  }
}
