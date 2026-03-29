# Pseudo-3D Visual Overhaul — Design Spec

## Overview

Replace the current Three.js 3D rendering pipeline with a Genesis-era pseudo-3D Canvas2D renderer to match the visual identity of the original Road Rash (1991-1994). The road becomes horizontal trapezoid bands with perspective scaling, all entities become 2D sprites scaled by distance, scenery becomes billboard sprites at road edges, and the sky becomes a flat gradient.

**Core change:** Drop Three.js. Pure Canvas2D rendering. Keep all game logic (physics, combat, AI, input, audio) unchanged.

---

## 1. Pseudo-3D Road Renderer

### Projection Math

Each road segment is projected from world-space Z distance to screen coordinates:

```
screenY = screenHeight / 2 + screenHeight * cameraHeight / z
screenScale = cameraDepth / z
roadWidth_screen = roadWidth_world * screenScale * screenWidth / 2
```

Where `z` is the segment's distance from the camera, `cameraHeight` is the virtual camera elevation, and `cameraDepth` is a constant controlling field-of-view depth.

### Drawing (back to front, horizon → camera)

For each visible segment (furthest first):
1. Calculate screen Y and road width at this depth
2. Draw a horizontal trapezoid (current segment top edge → previous segment bottom edge)
3. Fill with road color (alternating dark `#555555` / light `#666666` bands every 3 segments)
4. Fill shoulder/grass strips on both sides (alternating dark/light per track ground color)
5. Overlay lane markings:
   - Center dashed line: white rectangles (visible every other segment group)
   - Edge lines: solid white, 2px scaled by depth
   - Rumble strips: red/white alternating blocks on shoulders

### Curves and Hills

- **Curves:** Each segment has a `curve` value. As segments are projected, a cumulative `dx` offset shifts each segment horizontally. This creates the classic left/right road bending.
- **Hills:** Each segment has a `hill` value. A cumulative `dy` offset shifts segments vertically. Going uphill compresses visible segments (horizon rises), downhill spreads them (horizon drops).

### Draw distance

- ~300 segments visible (from camera to horizon)
- Fog: segments near horizon drawn with reduced contrast (lerp toward sky color)

---

## 2. Sprite System

### SpriteSheet Generator

`src/pseudo3d/SpriteSheet.ts` — generates all sprites to offscreen canvases at startup using Canvas2D.

### Player Bike Sprites (procedurally drawn, ~64x64 each)

| Frame | Description |
|-------|-------------|
| center | Bike facing forward, rider upright |
| lean_left | Bike tilted ~15 deg left, rider leaning |
| lean_right | Bike tilted ~15 deg right |
| punch_left | Rider arm extended left |
| punch_right | Rider arm extended right |
| kick_left | Rider leg extended left |
| kick_right | Rider leg extended right |
| crash | Rider tumbling, bike sideways |

Each sprite drawn as simple colored shapes: bike body (colored rectangle), wheels (black circles), rider torso (colored rectangle), head (circle), limbs (lines/rectangles). Chunky, Genesis-appropriate.

### AI Bike Sprites

Same frame set as player. Different body colors per personality:
- Aggressive: orange `#ff8800`
- Defensive: green `#44aa44`
- Racer: purple `#8844ff`

### Traffic Vehicle Sprites (rear + front view per type, ~80x48)

| Type | Rear View | Front View |
|------|-----------|------------|
| Sedan | Boxy rear, taillights, license plate | Grille, headlights, windshield |
| Pickup | Open bed visible, tall stance | High grille, cab outline |
| SUV | Tall boxy rear, spare tire | Tall front, bull bar |
| Bus | Wide, tall, window rows, route number | Wide windshield, destination sign |
| Semi | Massive trailer rear, reflectors, mud flaps | Cab face, chrome grille, stacks |
| Sports | Low wide, large taillights, spoiler | Low aggressive, wide air intake |

Each drawn with randomized color from a 10-color palette at spawn time.

### Sprite Rendering

`src/pseudo3d/SpriteRenderer.ts`:
- `drawSprite(ctx, sprite, worldX, worldZ, roadProjection)` — projects world position to screen, scales sprite, draws with `ctx.drawImage()`
- Sprites sorted by Z (back to front) before drawing
- Player bike always drawn last at fixed screen position (bottom center, ~75% down)

---

## 3. Scenery Billboard Sprites

### Per-Track Scenery Types (procedurally drawn, ~32x64 to ~64x128)

| Track | Sprites |
|-------|---------|
| Desert | Tall cactus, short cactus with arms, mesa silhouette, road sign, tumbleweed |
| Coast | Palm tree, rocky outcrop, wooden fence, beach umbrella, lighthouse |
| City | Tall building, short building, street light, traffic light, mailbox, fire hydrant |
| Mountain | Pine tree (large), pine tree (small), snow rock, wooden cabin, guard rail |
| Night | Street lamp with glow halo, neon sign, highway barrier, reflective post |
| Canyon | Red rock pillar, dead tree, boulder, warning sign, arch formation |

### Placement

- Each track definition includes a scenery placement array: `{ type, z, side: 'left'|'right', offset }` generated from segment data
- Scenery density: ~1-3 objects per segment on each side
- Projected to screen same as road segments, drawn after road, before bikes

### Parallax Background Layers

Two scrolling background strips behind the road:
- **Layer 1 (far):** Mountain/skyline silhouette — scrolls at 5% of road curve rate
- **Layer 2 (mid):** Hills/tree line — scrolls at 15% of road curve rate

Per-track layer content:
| Track | Far Layer | Mid Layer |
|-------|-----------|-----------|
| Desert | Flat mesa silhouettes, orange | Sand dunes, tan |
| Coast | Ocean horizon, blue | Coastal hills, green |
| City | Skyline silhouettes, grey | Mid-rise buildings, dark grey |
| Mountain | Snow-capped peaks, white/blue | Pine forest line, dark green |
| Night | Same as city but dark with lit windows | Dark tree line with occasional light |
| Canyon | Layered canyon walls, red/orange | Closer rock formations, dark red |

Each layer is a wide canvas strip (~2000px wide, ~100-200px tall), drawn once at startup, rendered with horizontal offset from accumulated road curve.

---

## 4. Sky, Camera & Effects

### Sky

- Flat vertical gradient painted at top of canvas each frame
- Top: deep color, bottom (horizon): lighter haze
- Per-track sky colors:
  | Track | Top | Horizon |
  |-------|-----|---------|
  | Desert | `#4488cc` | `#ffddaa` (warm haze) |
  | Coast | `#2266bb` | `#aaddff` (misty) |
  | City | `#445566` | `#889999` (smoggy) |
  | Mountain | `#3355aa` | `#ccddee` (cold haze) |
  | Night | `#060618` | `#1a1a3a` (dark) |
  | Canyon | `#cc6633` | `#ffcc88` (dusty) |
- 3-5 flat cloud shapes along horizon (simple rounded rectangle fills), drifting 1-2px/sec

### Camera

- Fixed. No 3D camera. Projection math implies the camera.
- Player bike sprite pinned at screen position: center-X, ~75% down from top
- Vanishing point: center-X, ~35% down from top (horizon line)
- No camera movement on curves/hills — only road shifts, camera stays

### Speed Perception

- Road band scroll rate directly tied to `player.bike.speed`
- At max speed: bands fly past very quickly (Genesis feel)
- Scenery sprites rush past on sides
- Horizon stays fixed — only content below it animates
- Speed lines: horizontal white streaks at high speed (>80% max), drawn as thin semi-transparent lines

### Weather Effects (Canvas2D)

| Weather | Canvas Effect |
|---------|--------------|
| Rain | White/blue angled streak lines (30-50 lines, angle increases with speed) |
| Dust | Brown semi-transparent overlay + horizontal particle dots |
| Snow | Slow white dots falling with slight horizontal drift |
| Fog | Gradient overlay — road/scenery fades to fog color at reduced distance |
| Night | Overall dark palette + headlight cone (bright trapezoid on road ahead) |
| Storm | Heavy rain streaks + periodic screen flash (white overlay, 50ms) |
| Wind | Horizontal particle streaks + slight screen offset oscillation |
| Smog | Yellow-brown semi-transparent overlay, reduced draw distance |

Weather state machine (`WeatherSystem`) kept — it drives canvas overlay parameters instead of Three.js particles.

---

## 5. HUD (Canvas-Drawn)

Replace HTML HUD with canvas-drawn elements for a cohesive retro look:

- **Speedometer:** Bottom-left, large pixel-font number + "km/h" text
- **Position:** Top-center, "1ST" / "2ND" etc. in large bold pixel font
- **Health bar:** Bottom-center, horizontal bar (green → orange → red as health drops)
- **Weapon icon:** Bottom-right, small sprite of current weapon (chain/club/crowbar)
- **Timer:** Top-center below position, "M:SS" format
- **Nitro:** "NITRO READY" text or flame icon, bottom area
- **Minimap:** Not needed (original didn't have one) — remove

Font: simple pixel-font drawn character-by-character (each char is a 5x7 grid drawn with `fillRect`).

---

## 6. Architecture

### New Files

```
src/pseudo3d/
  PseudoRenderer.ts    — master renderer, orchestrates draw order
  RoadProjection.ts    — segment projection math, curve/hill accumulation
  RoadDrawer.ts        — draws road trapezoids, markings, shoulders
  SpriteSheet.ts       — generates all sprite images at startup
  SpriteRenderer.ts    — draws sprites at projected screen positions
  SceneryRenderer.ts   — places and draws billboard scenery sprites
  ParallaxLayer.ts     — scrolling background layers
  SkyDrawer.ts         — gradient sky + flat clouds
  WeatherOverlay.ts    — rain/dust/snow/fog canvas effects
  CanvasHUD.ts         — pixel-font HUD elements
  PixelFont.ts         — simple bitmap font renderer
```

### HTML Changes

`index.html` — replace the `<div id="game">` (which held Three.js WebGL canvas) with a `<canvas id="game-canvas">` element. The 2D context is obtained in `main.ts`. Canvas is sized to `window.innerWidth x window.innerHeight` and resized on window resize. The `#hud` div is removed (HUD is now canvas-drawn).

### Removed/Bypassed Files

- `src/rendering/*` — all Three.js rendering factories (VehicleFactory, SceneryFactory, BikeModelFactory, RoadRenderer, LightingManager, SkyRenderer, TextureAtlas, SceneryLODManager)
- Three.js renderer, scene, camera from `main.ts`
- `src/effects/SpeedEffects.ts`, `src/effects/CombatEffects.ts`, `src/effects/NitroEffects.ts` — replaced by canvas effects in PseudoRenderer

### Modified Files

- `src/main.ts` — replace Three.js init with `<canvas>` + `PseudoRenderer`. Game class keeps state management, calls `PseudoRenderer.render()` instead of Three.js render
- `src/entities/Bike.ts` — remove `mesh` field and all Three.js imports. Keep physics only. Add `spriteFrame` field (string indicating current visual state: 'center', 'lean_left', etc.)
- `src/entities/AiBike.ts` — remove mesh color override code, keep AI logic
- `src/world/Road.ts` — remove Three.js mesh building, keep segment data + projection helpers. Remove RoadRenderer dependency.
- `src/world/TrafficVehicle.ts` — remove THREE.Mesh, keep position/speed/collision data. Add `vehicleType` and `viewDirection` for sprite selection.
- `src/world/TrafficManager.ts` — remove VehicleFactory, keep spawn/collision logic
- `src/world/Environment.ts` — remove Three.js scenery meshes, keep placement data arrays. Becomes a data provider for SceneryRenderer.
- `src/tracks/*.ts` — add per-track configs: sky colors, parallax layer definitions, scenery sprite types
- `src/effects/WeatherSystem.ts` — remove Three.js particles, keep state machine. Return canvas-drawing parameters from `getWeatherProperties()`

### Unchanged Files

- `src/core/GameLoop.ts` — update/render loop stays
- `src/core/InputManager.ts` — keyboard/touch input stays
- `src/core/AudioManager.ts` — audio stays
- `src/combat/CombatSystem.ts`, `src/combat/AttackTypes.ts` — combat logic stays
- `src/entities/PlayerBike.ts` — input→bike mapping stays
- `src/world/RoadSegment.ts` — segment data model stays
- `src/tracks/TrackData.ts` — interface stays (extended with new visual configs)
- `src/effects/WeatherConfig.ts` — weather state definitions stay
- `src/ui/MenuScreen.ts`, `src/ui/ResultsScreen.ts`, `src/ui/PauseMenu.ts` — HTML overlays stay
- `src/ui/TouchControls.ts` — stays
- `src/utils/*` — stays

### Rendering Pipeline (per frame)

```
PseudoRenderer.render(gameState):
  1. ctx.clearRect() — clear canvas
  2. SkyDrawer.draw() — gradient + clouds
  3. ParallaxLayer.draw() — background strips with curve offset
  4. RoadDrawer.draw() — road segments back-to-front
  5. SceneryRenderer.draw() — billboard sprites sorted by Z
  6. SpriteRenderer.drawTraffic() — vehicle sprites sorted by Z
  7. SpriteRenderer.drawBikes() — AI bikes sorted by Z
  8. SpriteRenderer.drawPlayer() — player at fixed screen position
  9. WeatherOverlay.draw() — rain/dust/snow/fog effects
  10. CanvasHUD.draw() — speed, position, health, weapon, timer
```

---

## 7. Performance Considerations

- Canvas 2D is fast for this use case — Genesis games ran at 320x224. We render at native resolution but the drawing operations are simple fills and image blits.
- Sprite generation happens once at startup (all sprites pre-drawn to offscreen canvases)
- Road drawing is ~300 `fillRect` calls per frame — negligible
- Scenery is ~50-100 `drawImage` calls per frame — fast
- Target: 60fps on all devices including mobile
- Three.js removal reduces bundle size significantly (~500KB less)
