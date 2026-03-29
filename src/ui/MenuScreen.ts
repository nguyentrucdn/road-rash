import { TrackData } from '@/tracks/TrackData';

export class MenuScreen {
  private container: HTMLElement;
  private onTrackSelect: (track: TrackData) => void;

  constructor(tracks: TrackData[], onTrackSelect: (track: TrackData) => void) {
    this.onTrackSelect = onTrackSelect;
    this.container = document.createElement('div');
    this.container.id = 'menu-screen';
    this.container.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      z-index:100;font-family:'Courier New',monospace;color:#fff;
    `;

    const title = document.createElement('h1');
    title.textContent = 'ROAD RASH';
    title.style.cssText = 'font-size:72px;color:#ff4444;text-shadow:3px 3px 0 #880000;margin-bottom:10px;';
    this.container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Select a Track';
    subtitle.style.cssText = 'font-size:24px;color:#aaa;margin-bottom:40px;';
    this.container.appendChild(subtitle);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:800px;padding:0 20px;';

    for (const track of tracks) {
      const card = document.createElement('div');
      card.style.cssText = `
        background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.2);
        border-radius:12px;padding:20px;cursor:pointer;transition:all 0.2s;text-align:center;
      `;
      card.onmouseenter = () => { card.style.borderColor = '#ff4444'; card.style.transform = 'scale(1.05)'; };
      card.onmouseleave = () => { card.style.borderColor = 'rgba(255,255,255,0.2)'; card.style.transform = 'scale(1)'; };
      card.onclick = () => this.selectTrack(track);

      const name = document.createElement('h3');
      name.textContent = track.name;
      name.style.cssText = 'font-size:18px;margin-bottom:8px;color:#ff8844;';
      card.appendChild(name);

      const density = ['Sparse', 'Light', 'Medium', 'Heavy'][Math.floor(track.trafficDensity * 3.99)];
      const info = document.createElement('p');
      info.textContent = `Traffic: ${density}`;
      info.style.cssText = 'font-size:12px;color:#888;';
      card.appendChild(info);

      grid.appendChild(card);
    }

    this.container.appendChild(grid);

    const controls = document.createElement('div');
    controls.style.cssText = 'margin-top:30px;color:#666;font-size:12px;text-align:center;max-width:600px;';
    controls.innerHTML = `
      <p><strong>Controls:</strong> WASD/Arrows = Move | Q/E = Punch | Z/C = Kick | F = Weapon | Shift = Block/Duck | G = Grab | Space = Nitro | Esc = Pause</p>
    `;
    this.container.appendChild(controls);

    document.body.appendChild(this.container);
  }

  private selectTrack(track: TrackData): void {
    this.hide();
    this.onTrackSelect(track);
  }

  show(): void {
    this.container.style.display = 'flex';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  destroy(): void {
    this.container.remove();
  }
}
