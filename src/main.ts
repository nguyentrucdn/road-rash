import * as THREE from 'three';
import { GameLoop } from '@/core/GameLoop';
import { InputManager, GameAction } from '@/core/InputManager';
import { Road } from '@/world/Road';
import { PlayerBike } from '@/entities/PlayerBike';
import { AiBike, AiPersonality } from '@/entities/AiBike';
import { TrafficManager } from '@/world/TrafficManager';
import { CombatSystem } from '@/combat/CombatSystem';
import { WeaponPickup, WeaponType } from '@/entities/Weapon';
import { HUD } from '@/ui/HUD';
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
import { SpeedEffects } from '@/effects/SpeedEffects';
import { CombatEffects } from '@/effects/CombatEffects';
import { NitroEffects } from '@/effects/NitroEffects';
import { AudioManager } from '@/core/AudioManager';
import { LightingManager } from '@/rendering/LightingManager';
import { WeatherSystem } from '@/effects/WeatherSystem';
import { SkyRenderer } from '@/rendering/SkyRenderer';

type GameState = 'menu' | 'racing' | 'results';

class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
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
  private hud!: HUD;
  private pauseMenu!: PauseMenu;
  private environment!: Environment;
  private touchControls!: TouchControls;
  private raceTime = 0;
  private stats = { hitsLanded: 0, knockoffs: 0, weaponsGrabbed: 0 };
  private currentTrack!: TrackData;

  // Effects
  private speedEffects!: SpeedEffects;
  private combatEffects!: CombatEffects;
  private nitroEffects!: NitroEffects;

  // Lighting
  private lighting!: LightingManager;

  // Weather
  private weather!: WeatherSystem;
  private sky!: SkyRenderer;

  // Audio
  private audio = new AudioManager();

  // Race state
  private raceFrozen = false;

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
    const container = document.getElementById('game')!;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

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
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
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

    // Clear scene
    while (this.scene.children.length > 0) this.scene.remove(this.scene.children[0]);

    // Setup scene — sky dome with clouds replaces flat background color
    this.sky = new SkyRenderer(track.skyColor);
    this.sky.addToScene(this.scene);
    this.scene.fog = new THREE.FogExp2(track.fogColor, track.fogDensity);

    this.lighting = new LightingManager(this.scene, this.renderer);
    this.lighting.setupForTrack(track);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 5000),
      new THREE.MeshStandardMaterial({ color: track.groundColor })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    this.scene.add(ground);

    // Road
    this.road = new Road(track);
    this.scene.add(this.road.getGroup());
    this.scene.add(this.road.getMarkingsGroup());

    // Environment
    this.environment = new Environment(track, this.road);
    this.scene.add(this.environment.getGroup());

    // Player
    this.player = new PlayerBike(this.input, this.road, 0, 0);
    this.scene.add(this.player.bike.mesh);
    this.lighting.enableShadowsOn(this.player.bike.mesh);
    this.lighting.enableReceiveShadows(ground);

    // AI
    const personalities = [
      AiPersonality.Aggressive, AiPersonality.Defensive, AiPersonality.Racer,
      AiPersonality.Aggressive, AiPersonality.Racer,
    ];
    this.aiBikes = personalities.map((p, i) => {
      const ai = new AiBike(randomRange(-3, 3), 20 + i * 5, p);
      this.scene.add(ai.bike.mesh);
      return ai;
    });

    // Traffic
    this.traffic = new TrafficManager(this.scene, this.road, track.trafficDensity);

    // Weapons
    this.weapons = [];
    const weaponTypes: WeaponType[] = ['chain', 'club', 'crowbar'];
    const segments = track.generateSegments();
    for (const seg of segments) {
      if (seg.weaponPickup) {
        const type = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
        const pickup = new WeaponPickup(randomRange(-3, 3), seg.worldZ, type);
        this.weapons.push(pickup);
        this.scene.add(pickup.mesh);
      }
    }

    // HUD
    this.hud = new HUD();
    this.hud.show();

    // Weather
    this.weather = new WeatherSystem(track.name);
    this.weather.initParticles(this.scene);

    // Effects
    this.speedEffects = new SpeedEffects(this.scene);
    this.combatEffects = new CombatEffects(this.camera);
    this.nitroEffects = new NitroEffects(this.scene);

    // Audio
    this.audio.stopEngine();
    this.audio.startEngine();

    // Touch controls
    this.touchControls = new TouchControls(this.input);

    // Pause
    this.pauseMenu = new PauseMenu(
      () => {},
      () => { this.pauseMenu.destroy(); this.startRace(track); },
      () => { this.pauseMenu.destroy(); this.hud.hide(); this.showMenu(); },
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
      ai.updateMesh(this.road, this.player.bike.z);
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
      this.combatEffects.triggerShake(0.3);
      this.combatEffects.triggerHitFlash();
      if (result.damage >= 25) this.combatEffects.triggerSlowMo();
      this.audio.playHit();
    }

    // Weapons
    for (const w of this.weapons) {
      if (w.collected) continue;
      const roadX = this.road.getRoadXOffset(w.z);
      const roadY = this.road.getElevation(w.z);
      w.update(dt);
      w.updateMesh(roadX, roadY, this.player.bike.z);
      if (this.input.justPressed(GameAction.GrabWeapon) && w.checkPickup(this.player.bike.x, this.player.bike.z)) {
        this.player.bike.weapon = w.type;
        w.collected = true;
        this.scene.remove(w.mesh);
        this.stats.weaponsGrabbed++;
        this.audio.playPickup();
      }
    }

    // Road mesh
    this.road.buildMesh(this.player.bike.z);

    // Scenery
    this.environment.updatePositions(this.player.bike.z, this.road);

    // Visual effects
    this.sky.update(dt);
    this.speedEffects.update(dt, this.player.bike.speed, this.player.bike.maxSpeed);
    const nitroRoadX = this.road.getRoadXOffset(this.player.bike.z);
    this.nitroEffects.update(dt, this.player.bike.x + nitroRoadX, this.player.bike.z, this.player.bike.nitroActive);
    this.combatEffects.update(dt);

    // Audio
    this.audio.updateEngine(this.player.bike.speed, this.player.bike.maxSpeed);

    // Camera
    const roadX = this.road.getRoadXOffset(this.player.bike.z);
    const roadY = this.road.getElevation(this.player.bike.z);
    const targetCamPos = new THREE.Vector3(this.player.bike.x + roadX, roadY + 3, 5);
    this.camera.position.lerp(targetCamPos, 0.1);
    this.camera.lookAt(new THREE.Vector3(this.player.bike.x + roadX, roadY + 1.5, -30));
    const baseFov = 75;
    this.camera.fov = baseFov + (this.player.bike.speed / this.player.bike.maxSpeed) * 15;
    this.camera.updateProjectionMatrix();

    // Weather
    const raceProgress = this.player.bike.z / this.road.trackLength;
    this.weather.update(dt, raceProgress);
    const weatherProps = this.weather.getWeatherProperties();

    // Update fog density based on visibility
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = 0.002 + (1 - weatherProps.visibility) * 0.008;
    }

    // Lightning during stormy
    if (this.weather.getCurrentState() === 'stormy' && Math.random() < 0.002) {
      this.lighting.triggerLightning();
      this.combatEffects.triggerHitFlash('rgba(255,255,255,0.5)');
    }

    // Lighting
    const playerWorldPos = new THREE.Vector3(
      this.player.bike.x + roadX,
      roadY,
      0
    );
    this.lighting.update(playerWorldPos);

    // HUD
    const position = HUD.calcPosition(this.player.bike.z, this.aiBikes.map(a => a.bike.z));
    this.hud.update(this.player.bike, position, this.raceTime);

    // Finish line check
    if (this.player.bike.z >= this.road.trackLength) {
      this.finishRace(position);
    }

    this.input.endFrame();
  }

  private finishRace(position: number): void {
    this.state = 'results';
    this.hud.hide();
    this.audio.stopEngine();
    const results: RaceResults = { position, time: this.raceTime, ...this.stats };
    this.resultsScreen = new ResultsScreen(
      results,
      () => { this.resultsScreen!.destroy(); this.startRace(this.currentTrack); },
      () => { this.resultsScreen!.destroy(); this.showMenu(); },
    );
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}

new Game();
