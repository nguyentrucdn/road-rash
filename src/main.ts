import * as THREE from 'three';
import { GameLoop } from '@/core/GameLoop';
import { InputManager } from '@/core/InputManager';
import { Road } from '@/world/Road';
import { PlayerBike } from '@/entities/PlayerBike';
import { desertTrack } from '@/tracks/desert';
import { AiBike, AiPersonality } from '@/entities/AiBike';
import { randomRange } from '@/utils/MathUtils';
import { TrafficManager } from '@/world/TrafficManager';
import { CombatSystem } from '@/combat/CombatSystem';

const container = document.getElementById('game')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(desertTrack.skyColor);
scene.fog = new THREE.FogExp2(desertTrack.fogColor, desertTrack.fogDensity);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0x404040, 0.5));

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 5000),
  new THREE.MeshStandardMaterial({ color: desertTrack.groundColor })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
scene.add(ground);

const input = new InputManager();
input.bindDom();

const road = new Road(desertTrack);
scene.add(road.getGroup());

const traffic = new TrafficManager(scene, road, desertTrack.trafficDensity);
const combat = new CombatSystem();

const player = new PlayerBike(input, road, 0, 0);
scene.add(player.bike.mesh);

const personalities = [
  AiPersonality.Aggressive, AiPersonality.Defensive, AiPersonality.Racer,
  AiPersonality.Aggressive, AiPersonality.Racer,
];
const aiBikes: AiBike[] = personalities.map((p, i) => {
  const ai = new AiBike(randomRange(-3, 3), 20 + i * 5, p);
  scene.add(ai.bike.mesh);
  return ai;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function update(dt: number): void {
  player.update(dt);
  for (const ai of aiBikes) {
    ai.applyRubberBanding(player.bike.z, ai.bike.z);
    const roadWidth = road.getWidth(ai.bike.z);
    const roadX = road.getRoadXOffset(ai.bike.z);
    ai.updateSteering(roadX, roadWidth, dt);
    ai.updateRacing(dt);
    const seg = road.getSegmentAt(ai.bike.z);
    ai.bike.x -= seg.curve * ai.bike.speed * dt * 0.02;
    ai.updateMesh(road, player.bike.z);
  }
  // Traffic
  traffic.update(dt, player.bike.z);

  // Player-traffic collision
  const trafficDmg = traffic.checkCollision(player.bike.x, player.bike.z, player.bike.speed);
  if (trafficDmg > 0) {
    player.bike.takeDamage(trafficDmg);
    if (trafficDmg >= 100) player.bike.crash();
    else player.bike.speed *= 0.3;
  }

  // Combat
  const allBikes = [player.bike, ...aiBikes.map(a => a.bike)];
  player.resolveAttacks(aiBikes.map(a => a.bike), combat);
  for (const ai of aiBikes) {
    ai.updateCombat(allBikes, combat, dt);
  }

  // AI-traffic collisions
  for (const ai of aiBikes) {
    const aiDmg = traffic.checkCollision(ai.bike.x, ai.bike.z, ai.bike.speed);
    if (aiDmg >= 100) ai.bike.crash();
    else if (aiDmg > 0) ai.bike.speed *= 0.3;
  }

  road.buildMesh(player.bike.z);
  const roadX = road.getRoadXOffset(player.bike.z);
  const roadY = road.getElevation(player.bike.z);
  const targetCamPos = new THREE.Vector3(player.bike.x + roadX, roadY + 3, 5);
  camera.position.lerp(targetCamPos, 0.1);
  const lookTarget = new THREE.Vector3(player.bike.x + roadX, roadY + 1.5, -30);
  camera.lookAt(lookTarget);
  camera.fov = 75 + (player.bike.speed / player.bike.maxSpeed) * 15;
  camera.updateProjectionMatrix();
  input.endFrame();
}

function render(): void {
  renderer.render(scene, camera);
}

const gameLoop = new GameLoop(update, render);
gameLoop.start();
