export interface RaceResults {
  position: number;
  time: number;
  hitsLanded: number;
  knockoffs: number;
  weaponsGrabbed: number;
}

export class ResultsScreen {
  private container: HTMLElement;

  constructor(results: RaceResults, onRestart: () => void, onMenu: () => void) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.85);display:flex;flex-direction:column;
      align-items:center;justify-content:center;z-index:100;
      font-family:'Courier New',monospace;color:#fff;
    `;

    const won = results.position <= 3;
    const title = document.createElement('h1');
    title.textContent = won ? 'RACE COMPLETE!' : 'RACE OVER';
    title.style.cssText = `font-size:48px;color:${won ? '#44ff44' : '#ff4444'};margin-bottom:30px;`;
    this.container.appendChild(title);

    const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
    const posEl = document.createElement('div');
    posEl.textContent = ordinals[results.position - 1] || `${results.position}th`;
    posEl.style.cssText = `font-size:72px;font-weight:bold;color:${won ? '#ffcc00' : '#ff6666'};margin-bottom:20px;`;
    this.container.appendChild(posEl);

    const mins = Math.floor(results.time / 60);
    const secs = Math.floor(results.time % 60).toString().padStart(2, '0');
    const stats = [
      `Time: ${mins}:${secs}`,
      `Hits Landed: ${results.hitsLanded}`,
      `Knockoffs: ${results.knockoffs}`,
      `Weapons Grabbed: ${results.weaponsGrabbed}`,
    ];
    for (const stat of stats) {
      const el = document.createElement('p');
      el.textContent = stat;
      el.style.cssText = 'font-size:20px;margin:5px 0;color:#ccc;';
      this.container.appendChild(el);
    }

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'margin-top:30px;display:flex;gap:20px;';

    const restartBtn = this.createButton('RACE AGAIN', onRestart);
    const menuBtn = this.createButton('MAIN MENU', onMenu);
    btnContainer.appendChild(restartBtn);
    btnContainer.appendChild(menuBtn);
    this.container.appendChild(btnContainer);

    document.body.appendChild(this.container);
  }

  private createButton(text: string, onClick: () => void): HTMLElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      background:#ff4444;color:#fff;border:none;padding:15px 30px;
      font-size:18px;font-family:'Courier New',monospace;cursor:pointer;
      border-radius:8px;font-weight:bold;
    `;
    btn.onmouseenter = () => { btn.style.background = '#ff6666'; };
    btn.onmouseleave = () => { btn.style.background = '#ff4444'; };
    btn.onclick = onClick;
    return btn;
  }

  destroy(): void {
    this.container.remove();
  }
}
