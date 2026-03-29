import * as THREE from 'three';
import { GameLoop } from '@/core/GameLoop';
import { Road } from '@/world/Road';
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
camera.position.set(0, 3, 5);

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

const road = new Road(desertTrack);
scene.add(road.getGroup());

let playerZ = 0;
const speed = 40;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function update(dt: number): void {
  playerZ += speed * dt;
  if (playerZ >= road.trackLength - 100) playerZ = 0;
  road.buildMesh(playerZ);
  const roadX = road.getRoadXOffset(playerZ);
  const roadY = road.getElevation(playerZ);
  camera.position.set(roadX, roadY + 3, 0);
  camera.lookAt(roadX + road.getRoadXOffset(playerZ + 50) - roadX, roadY + road.getElevation(playerZ + 50) - roadY + 2, -50);
}

function render(): void {
  renderer.render(scene, camera);
}

const gameLoop = new GameLoop(update, render);
gameLoop.start();
