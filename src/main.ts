import { GameLoop } from '@/core/GameLoop';
import { InputManager, GameAction } from '@/core/InputManager';
import { Road } from '@/world/Road';
import { PlayerBike } from '@/entities/PlayerBike';
import { AiBike, AiPersonality } from '@/entities/AiBike';
import { TrafficManager } from '@/world/TrafficManager';
import { CombatSystem } from '@/combat/CombatSystem';
import { WeaponPickup, WeaponType } from '@/entities/Weapon';
import { MenuScreen } from '@/ui/MenuScreen';
import { ResultsScreen, RaceResults } from '@/ui/ResultsScreen';
import { PauseMenu } from '@/ui/PauseMenu';
import { TouchControls } from '@/ui/TouchControls';
import { Environment } from '@/world/Environment';
import { TrackData } from '@/tracks/TrackData';
import { desertTrack } from '@/tracks/desert';
import { coastTrack } from '@/tracks/coast';
import { cityTrack } from '@/tracks/city';
import { mountainTrack } from '@/tracks/mountain';
import { nightTrack } from '@/tracks/night';
import { canyonTrack } from '@/tracks/canyon';
import { randomRange } from '@/utils/MathUtils';
import { AudioManager } from '@/core/AudioManager';
import { WeatherSystem } from '@/effects/WeatherSystem';
import { PseudoRenderer, RenderState } from '@/pseudo3d/PseudoRenderer';
import { CanvasHUD } from '@/pseudo3d/CanvasHUD';

type GameState = 'menu' | 'racing' | 'results';

class Game {
  private canvas: HTMLCanvasElement;
  private pseudoRenderer!: PseudoRenderer;
  private input: InputManager;
  private gameLoop: GameLoop;
  private state: GameState = 'menu';

  // Racing state
  private road!: Road;
  private player!: PlayerBike;
  private aiBikes: AiBike[] = [];
  private traffic!: TrafficManager;
  private combat = new CombatSystem();
  private weapons: WeaponPickup[] = [];
  private pauseMenu!: PauseMenu;
  private environment!: Environment;
  private touchControls!: TouchControls;
  private raceTime = 0;
  private stats = { hitsLanded: 0, knockoffs: 0, weaponsGrabbed: 0 };
  private currentTrack!: TrackData;

  // Weather
  private weather!: WeatherSystem;

  // Audio
  private audio = new AudioManager();

  // Race state
  private raceFrozen = false;
  private lastDt = 0;

  // UI
  private menuScreen: MenuScreen | null = null;
  private resultsScreen: ResultsScreen | null = null;

  private tracks: TrackData[] = [
    desertTrack,
    coastTrack,
    cityTrack,
    mountainTrack,
    nightTrack,
    canyonTrack,
  ];

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.input = new InputManager();
    this.input.bindDom();

    // Unlock audio on first user gesture
    const unlockAudio = () => {
      this.audio.init();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render(),
    );

    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      if (this.pseudoRenderer) {
        this.pseudoRenderer.resize(window.innerWidth, window.innerHeight);
      }
    });

    this.showMenu();
    this.gameLoop.start();
  }

  private showMenu(): void {
    this.state = 'menu';
    this.menuScreen = new MenuScreen(this.tracks, (track) => this.startRace(track));
  }

  private startRace(track: TrackData): void {
    this.currentTrack = track;
    this.state = 'racing';
    this.raceTime = 0;
    this.stats = { hitsLanded: 0, knockoffs: 0, weaponsGrabbed: 0 };

    // Create pseudo-3D renderer
    this.pseudoRenderer = new PseudoRenderer(this.canvas, track.name);

    // Road
    this.road = new Road(track);

    // Environment (pure data — scenery placements)
    this.environment = new Environment(track, this.road);

    // Init scenery in renderer
    const sceneryTypes = track.scenery.map(s => s.type);
    this.pseudoRenderer.initScenery(this.road.totalSegments, sceneryTypes, track.scenery.length > 0 ? track.scenery[0].frequency : 0.1);

    // Player
    this.player = new PlayerBike(this.input, this.road, 0, 0);

    // AI
    const personalities = [
      AiPersonality.Aggressive, AiPersonality.Defensive, AiPersonality.Racer,
      AiPersonality.Aggressive, AiPersonality.Racer,
    ];
    this.aiBikes = personalities.map((p, i) => {
      return new AiBike(randomRange(-3, 3), 20 + i * 5, p);
    });

    // Traffic
    this.traffic = new TrafficManager(this.road, track.trafficDensity);

    // Weapons
    this.weapons = [];
    const weaponTypes: WeaponType[] = ['chain', 'club', 'crowbar'];
    const segments = track.generateSegments();
    for (const seg of segments) {
      if (seg.weaponPickup) {
        const type = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
        const pickup = new WeaponPickup(randomRange(-3, 3), seg.worldZ, type);
        this.weapons.push(pickup);
      }
    }

    // Weather
    this.weather = new WeatherSystem(track.name);

    // Audio
    this.audio.stopEngine();
    this.audio.startEngine();

    // Touch controls
    this.touchControls = new TouchControls(this.input);

    // Pause
    this.pauseMenu = new PauseMenu(
      () => {},
      () => { this.pauseMenu.destroy(); this.startRace(track); },
      () => { this.pauseMenu.destroy(); this.showMenu(); },
    );

    // Countdown
    this.startCountdown();
  }

  private startCountdown(): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      display:flex;align-items:center;justify-content:center;
      z-index:90;pointer-events:none;font-family:'Courier New',monospace;
    `;
    const text = document.createElement('div');
    text.style.cssText = 'font-size:120px;color:#fff;text-shadow:3px 3px 0 #000;';
    overlay.appendChild(text);
    document.body.appendChild(overlay);

    let count = 3;
    this.raceFrozen = true;

    const tick = () => {
      if (count > 0) {
        text.textContent = String(count);
        count--;
        setTimeout(tick, 1000);
      } else {
        text.textContent = 'GO!';
        this.raceFrozen = false;
        setTimeout(() => overlay.remove(), 500);
      }
    };
    tick();
  }

  private update(dt: number): void {
    this.lastDt = dt;
    if (this.state !== 'racing') return;
    if (this.raceFrozen) {
      this.input.endFrame();
      return;
    }
    if (this.pauseMenu?.isPaused) {
      if (this.input.justPressed(GameAction.Pause)) this.pauseMenu.toggle();
      this.input.endFrame();
      return;
    }

    if (this.input.justPressed(GameAction.Pause)) {
      this.pauseMenu.toggle();
      this.input.endFrame();
      return;
    }

    this.raceTime += dt;
    this.player.update(dt);

    // AI update
    const allBikes = [this.player.bike, ...this.aiBikes.map(a => a.bike)];
    for (const ai of this.aiBikes) {
      ai.applyRubberBanding(this.player.bike.z, ai.bike.z);
      const roadWidth = this.road.getWidth(ai.bike.z);
      const roadX = this.road.getRoadXOffset(ai.bike.z);
      ai.updateSteering(roadX, roadWidth, dt);
      ai.updateRacing(dt);
      const seg = this.road.getSegmentAt(ai.bike.z);
      ai.bike.x -= seg.curve * ai.bike.speed * dt * 0.02;
      ai.updateCombat(allBikes, this.combat, dt);
    }

    // Traffic
    this.traffic.update(dt, this.player.bike.z);
    const trafficDmg = this.traffic.checkCollision(this.player.bike.x, this.player.bike.z, this.player.bike.speed);
    if (trafficDmg > 0) {
      this.player.bike.takeDamage(trafficDmg);
      if (trafficDmg >= 100) this.player.bike.crash();
      else this.player.bike.speed *= 0.3;
    }
    for (const ai of this.aiBikes) {
      const aiDmg = this.traffic.checkCollision(ai.bike.x, ai.bike.z, ai.bike.speed);
      if (aiDmg >= 100) ai.bike.crash();
      else if (aiDmg > 0) ai.bike.speed *= 0.3;
    }

    // Player combat
    const result = this.player.resolveAttacks(this.aiBikes.map(a => a.bike), this.combat);
    if (result?.hit) {
      this.stats.hitsLanded++;
      if (result.damage >= 100) this.stats.knockoffs++;
      this.audio.playHit();
    }

    // Weapons
    for (const w of this.weapons) {
      if (w.collected) continue;
      if (this.input.justPressed(GameAction.GrabWeapon) && w.checkPickup(this.player.bike.x, this.player.bike.z)) {
        this.player.bike.weapon = w.type;
        w.collected = true;
        this.stats.weaponsGrabbed++;
        this.audio.playPickup();
      }
    }

    // Audio
    this.audio.updateEngine(this.player.bike.speed, this.player.bike.maxSpeed);

    // Weather
    const raceProgress = this.player.bike.z / this.road.trackLength;
    this.weather.update(dt, raceProgress);

    // Player sprite frame
    let playerFrame = 'center';
    if (this.player.bike.crashed) playerFrame = 'crash';
    else if (this.input.isActive(GameAction.SteerLeft)) playerFrame = 'lean_left';
    else if (this.input.isActive(GameAction.SteerRight)) playerFrame = 'lean_right';
    else if (this.input.justPressed(GameAction.PunchLeft)) playerFrame = 'punch_left';
    else if (this.input.justPressed(GameAction.PunchRight)) playerFrame = 'punch_right';
    else if (this.input.justPressed(GameAction.KickLeft)) playerFrame = 'kick_left';
    else if (this.input.justPressed(GameAction.KickRight)) playerFrame = 'kick_right';
    this.player.bike.spriteFrame = playerFrame;

    // AI sprite frames
    for (const ai of this.aiBikes) {
      if (ai.bike.crashed) ai.bike.spriteFrame = 'crash';
      else if (Math.abs(ai.bike.lean) > 0.1) ai.bike.spriteFrame = ai.bike.lean < 0 ? 'lean_left' : 'lean_right';
      else ai.bike.spriteFrame = 'center';
    }

    // Finish line check
    const position = CanvasHUD.calcPosition(this.player.bike.z, this.aiBikes.map(a => a.bike.z));
    if (this.player.bike.z >= this.road.trackLength) {
      this.finishRace(position);
    }

    this.input.endFrame();
  }

  private finishRace(position: number): void {
    this.state = 'results';
    this.audio.stopEngine();
    const results: RaceResults = { position, time: this.raceTime, ...this.stats };
    this.resultsScreen = new ResultsScreen(
      results,
      () => { this.resultsScreen!.destroy(); this.startRace(this.currentTrack); },
      () => { this.resultsScreen!.destroy(); this.showMenu(); },
    );
  }

  private render(): void {
    if (this.state !== 'racing' || !this.pseudoRenderer) return;

    const position = CanvasHUD.calcPosition(this.player.bike.z, this.aiBikes.map(a => a.bike.z));
    const weatherProps = this.weather.getWeatherProperties();

    // Collect traffic data for rendering
    const trafficData = this.traffic.getVehicles().map(v => ({
      x: v.x, z: v.z, type: v.vehicleType, direction: v.direction as 1 | -1,
    }));

    const renderState: RenderState = {
      road: this.road,
      playerBike: this.player.bike,
      playerFrame: this.player.bike.spriteFrame,
      aiBikes: this.aiBikes.map(ai => ({
        bike: ai.bike,
        personality: ai.personality,
        frame: ai.bike.spriteFrame,
      })),
      traffic: trafficData,
      position,
      raceTime: this.raceTime,
      weather: weatherProps,
      dt: this.lastDt,
    };

    this.pseudoRenderer.render(renderState);
  }
}

new Game();
