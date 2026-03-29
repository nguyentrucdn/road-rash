# Road Rash

A browser-based motorcycle combat racing game inspired by the classic Road Rash series. Built with Three.js, TypeScript, and Vite.

## Features

- **3D Low-Poly Graphics** — Detailed vehicle models, composite scenery with LOD, procedural sky dome with clouds, dynamic weather effects
- **6 Tracks** — Desert Highway, Pacific Coast, Downtown Rush, Mountain Pass, Night Highway, Canyon Run
- **Full Combat System** — Punch, kick, duck, block + weapon pickups (chain, club, crowbar)
- **5 AI Opponents** — Aggressive, Defensive, and Racer personalities with rubber-banding
- **Traffic System** — 6 vehicle types (sedan, pickup, SUV, bus, semi-truck, sports car) with collision physics
- **Dynamic Weather** — Rain, snow, dust storms, fog, smog, wind — changes mid-race per track
- **Shadows & Lighting** — Per-track lighting, shadow mapping, night headlights, lightning strikes
- **Visual Effects** — Speed lines, screen shake, hit flash, slow-mo, nitro flames
- **Audio** — Engine sounds, combat SFX, nitro whoosh, pickup chimes (Web Audio API)
- **Touch Controls** — Virtual joystick + action buttons for mobile
- **Arcade Mode** — Pick a track, race, compete for 1st-3rd place

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Build for Production

```bash
npm run build
```

Output goes to `dist/` — deploy as a static site.

### Run Tests

```bash
npm test
```

## Controls

| Action | Key |
|--------|-----|
| Accelerate | W / Up Arrow |
| Brake | S / Down Arrow |
| Steer | A/D or Left/Right Arrow |
| Punch left/right | Q / E |
| Kick left/right | Z / C |
| Use weapon | F |
| Block/Duck | Shift |
| Grab weapon | G |
| Nitro boost | Space |
| Pause | Escape |

Mobile: virtual joystick (left) + action buttons (right) appear automatically on touch devices.

## Project Structure

```
src/
  main.ts                 — Game class, state management, main loop
  core/                   — GameLoop, InputManager, AudioManager
  entities/               — Bike, PlayerBike, AiBike, Weapon
  combat/                 — CombatSystem, AttackTypes
  world/                  — Road, Environment, TrafficManager, TrafficVehicle
  tracks/                 — 6 track definitions (desert, coast, city, mountain, night, canyon)
  rendering/              — TextureAtlas, VehicleFactory, SceneryFactory, RoadRenderer,
                            BikeModelFactory, LightingManager, SkyRenderer, SceneryLODManager
  effects/                — SpeedEffects, CombatEffects, NitroEffects, WeatherSystem
  ui/                     — HUD, MenuScreen, ResultsScreen, PauseMenu, TouchControls
  utils/                  — MathUtils, ObjectPool
scripts/
  generate-atlas.ts       — Build-time texture atlas generator (Canvas2D)
tests/                    — 77 tests across 18 test files
```

## Tech Stack

- **Three.js** — 3D rendering
- **TypeScript** — type safety
- **Vite** — bundler + dev server
- **Vitest** — test runner
- **Web Audio API** — sound effects
- **Canvas2D** — procedural texture atlas generation

## License

MIT
