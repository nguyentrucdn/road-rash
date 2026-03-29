import * as THREE from 'three';
import { GameLoop } from '@/core/GameLoop';
import { InputManager } from '@/core/InputManager';
import { Road } from '@/world/Road';
import { PlayerBike } from '@/entities/PlayerBike';
import { desertTrack } from '@/tracks/desert';

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

const player = new PlayerBike(input, road, 0, 0);
scene.add(player.bike.mesh);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function update(dt: number): void {
  player.update(dt);
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
