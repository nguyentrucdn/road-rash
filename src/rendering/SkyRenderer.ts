import * as THREE from 'three';

/**
 * Creates a procedural sky dome with gradient blue sky and scattered clouds.
 * Rendered onto a large sphere that surrounds the scene.
 */
export class SkyRenderer {
  private skyMesh: THREE.Mesh;
  private cloudGroup = new THREE.Group();
  private clouds: { mesh: THREE.Mesh; baseX: number; speed: number }[] = [];

  constructor(private skyColor: number = 0x87ceeb) {
    // Sky dome — large inverted sphere with vertical gradient
    const skyGeo = new THREE.SphereGeometry(800, 32, 16);
    const skyMat = this.createSkyMaterial(skyColor);
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyMesh.renderOrder = -1; // render first (behind everything)

    // Generate clouds
    this.generateClouds(skyColor);
  }

  private createSkyMaterial(baseColor: number): THREE.ShaderMaterial {
    const color = new THREE.Color(baseColor);
    // Lighten for zenith, keep base for horizon
    const zenith = color.clone().lerp(new THREE.Color(0x3366cc), 0.4);
    const horizon = color.clone().lerp(new THREE.Color(0xddeeff), 0.3);

    return new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: zenith },
        bottomColor: { value: horizon },
        horizonColor: { value: new THREE.Color(0xeef4ff) },
        offset: { value: 20 },
        exponent: { value: 0.4 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 horizonColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          // Three-band gradient: horizon -> mid sky -> zenith
          if (h < 0.0) {
            gl_FragColor = vec4(horizonColor, 1.0);
          } else if (h < 0.3) {
            float t = h / 0.3;
            gl_FragColor = vec4(mix(horizonColor, bottomColor, t), 1.0);
          } else {
            float t = pow((h - 0.3) / 0.7, exponent);
            gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
          }
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }

  private generateClouds(skyColor: number): void {
    const isNight = (skyColor & 0xff) < 0x30 && ((skyColor >> 8) & 0xff) < 0x30;
    const cloudCount = isNight ? 5 : 15 + Math.floor(Math.random() * 10);
    const cloudColor = isNight ? 0x334455 : 0xffffff;

    for (let i = 0; i < cloudCount; i++) {
      const cloud = this.createCloud(cloudColor, isNight);
      const x = (Math.random() - 0.5) * 1200;
      const z = -100 - Math.random() * 600; // spread in the distance
      const y = 80 + Math.random() * 120;

      cloud.position.set(x, y, z);
      cloud.rotation.y = Math.random() * Math.PI;

      const speed = 0.5 + Math.random() * 1.5;
      this.clouds.push({ mesh: cloud, baseX: x, speed });
      this.cloudGroup.add(cloud);
    }
  }

  private createCloud(color: number, isNight: boolean): THREE.Mesh {
    // Cloud = merged spheres for a puffy look
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      transparent: true,
      opacity: isNight ? 0.3 : 0.85,
      roughness: 1.0,
      metalness: 0.0,
    });

    // Main puffs — 4-7 overlapping spheres
    const puffCount = 4 + Math.floor(Math.random() * 4);
    const baseWidth = 15 + Math.random() * 25;

    for (let i = 0; i < puffCount; i++) {
      const radius = 5 + Math.random() * 8;
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 7, 5),
        mat,
      );
      puff.position.set(
        (i - puffCount / 2) * (baseWidth / puffCount) + (Math.random() - 0.5) * 5,
        (Math.random() - 0.3) * 4,
        (Math.random() - 0.5) * 6,
      );
      // Squash vertically for flat-bottomed cloud look
      puff.scale.set(1, 0.5 + Math.random() * 0.3, 0.8 + Math.random() * 0.2);
      group.add(puff);
    }

    // Bottom flat layer (slightly darker, wider)
    const baseMat = mat.clone();
    baseMat.color = new THREE.Color(color).multiplyScalar(0.9);
    baseMat.opacity = isNight ? 0.2 : 0.6;
    const base = new THREE.Mesh(
      new THREE.SphereGeometry(baseWidth * 0.4, 6, 4),
      baseMat,
    );
    base.scale.set(1.2, 0.2, 0.8);
    base.position.y = -3;
    group.add(base);

    // Merge into single mesh for performance via a simple parent
    // (Using group as a mesh stand-in — Three.js handles this fine)
    const container = new THREE.Mesh();
    container.add(...group.children);
    return container;
  }

  /** Slowly drift clouds. Call each frame. */
  update(dt: number): void {
    for (const cloud of this.clouds) {
      cloud.mesh.position.x = cloud.baseX + Math.sin(Date.now() * 0.0001 * cloud.speed) * 30;
      // Very subtle y bob
      cloud.mesh.position.y += Math.sin(Date.now() * 0.0002 + cloud.baseX) * 0.003;
    }
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.skyMesh);
    scene.add(this.cloudGroup);
    // Remove flat background color so sky dome shows through
    scene.background = null;
  }

  destroy(scene: THREE.Scene): void {
    scene.remove(this.skyMesh);
    scene.remove(this.cloudGroup);
  }
}
