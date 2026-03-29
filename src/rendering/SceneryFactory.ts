import * as THREE from 'three';

export class SceneryFactory {
  createDetailed(type: string, scale: number, color: number): THREE.Group {
    switch (type) {
      case 'cactus': return this.buildCactus(scale, color);
      case 'palm_tree': return this.buildPalmTree(scale, color);
      case 'pine_tree': return this.buildPineTree(scale, color);
      case 'rock': return this.buildRock(scale, color);
      case 'building': return this.buildBuilding(scale, color);
      case 'mesa': return this.buildMesa(scale, color);
      case 'sign': return this.buildSign(scale, color);
      case 'light_post': return this.buildLightPost(scale, color);
      default: return this.buildRock(scale, color);
    }
  }

  private buildCactus(scale: number, color: number): THREE.Group {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });

    // Main trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.25 * scale, 2.5 * scale, 6), mat);
    trunk.position.y = 1.25 * scale;
    g.add(trunk);

    // Arms (1-2 randomly)
    const armCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < armCount; i++) {
      const armMat = mat.clone();
      const side = i === 0 ? 1 : -1;

      // Horizontal part
      const hArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.6 * scale, 5), armMat);
      hArm.rotation.z = Math.PI / 2 * side;
      hArm.position.set(side * 0.4 * scale, (1.2 + i * 0.5) * scale, 0);
      g.add(hArm);

      // Vertical part
      const vArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.12 * scale, 0.8 * scale, 5), armMat);
      vArm.position.set(side * 0.7 * scale, (1.6 + i * 0.5) * scale, 0);
      g.add(vArm);
    }

    return g;
  }

  private buildPalmTree(scale: number, color: number): THREE.Group {
    const g = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, flatShading: true });
    const frondMat = new THREE.MeshStandardMaterial({ color, flatShading: true, side: THREE.DoubleSide });

    // Curved trunk (leaning slightly)
    const trunkHeight = 3.5 * scale;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.2 * scale, trunkHeight, 6), trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.rotation.z = 0.1;
    g.add(trunk);

    // Fronds (5-6 flat planes radiating from top)
    const frondCount = 5 + Math.floor(Math.random() * 2);
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.8 * scale, 2.0 * scale), frondMat);
      frond.position.set(
        Math.cos(angle) * 0.5 * scale,
        trunkHeight - 0.2 * scale,
        Math.sin(angle) * 0.5 * scale
      );
      frond.rotation.y = angle;
      frond.rotation.x = -0.6;
      g.add(frond);
    }

    return g;
  }

  private buildPineTree(scale: number, color: number): THREE.Group {
    const g = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, flatShading: true });
    const needleMat = new THREE.MeshStandardMaterial({ color, flatShading: true });

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.15 * scale, 2.0 * scale, 5), trunkMat);
    trunk.position.y = 1.0 * scale;
    g.add(trunk);

    // 3 stacked cones
    const cones = [
      { r: 0.9, h: 1.2, y: 2.8 },
      { r: 0.7, h: 1.0, y: 3.5 },
      { r: 0.5, h: 0.8, y: 4.0 },
    ];
    for (const c of cones) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(c.r * scale, c.h * scale, 6), needleMat);
      cone.position.y = c.y * scale;
      g.add(cone);
    }

    return g;
  }

  private buildRock(scale: number, color: number): THREE.Group {
    const g = new THREE.Group();
    const geo = new THREE.DodecahedronGeometry(0.5 * scale, 0);

    // Vertex displacement for natural shape
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.15 * scale);
      positions.setY(i, positions.getY(i) + (Math.random() - 0.5) * 0.15 * scale);
      positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.15 * scale);
    }
    geo.computeVertexNormals();

    const rock = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, flatShading: true }));
    rock.position.y = 0.3 * scale;
    g.add(rock);

    // Secondary smaller rock
    if (Math.random() > 0.5) {
      const smallGeo = new THREE.DodecahedronGeometry(0.25 * scale, 0);
      const small = new THREE.Mesh(smallGeo, new THREE.MeshStandardMaterial({ color, flatShading: true }));
      small.position.set((Math.random() - 0.5) * scale, 0.15 * scale, (Math.random() - 0.5) * scale);
      g.add(small);
    }

    return g;
  }

  private buildBuilding(scale: number, color: number): THREE.Group {
    const g = new THREE.Group();
    const w = 2 * scale * (0.5 + Math.random() * 0.5);
    const h = scale * (1 + Math.random() * 2);
    const d = 2 * scale * (0.5 + Math.random() * 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x4477aa, flatShading: true, transparent: true, opacity: 0.6 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
    body.position.y = h / 2;
    g.add(body);

    // Windows (darker inset planes on front/back faces)
    const winRows = Math.max(1, Math.floor(h / (0.6 * scale)));
    const winCols = Math.max(1, Math.floor(w / (0.8 * scale)));
    for (let row = 0; row < winRows; row++) {
      for (let col = 0; col < winCols; col++) {
        const winGeo = new THREE.PlaneGeometry(0.4 * scale, 0.35 * scale);
        const winMesh = new THREE.Mesh(winGeo, glassMat);
        const wx = -w / 2 + (col + 0.5) * (w / winCols);
        const wy = 0.4 * scale + row * 0.6 * scale;
        winMesh.position.set(wx, wy, d / 2 + 0.01);
        g.add(winMesh);
      }
    }

    // Rooftop details
    const ac = new THREE.Mesh(new THREE.BoxGeometry(0.4 * scale, 0.3 * scale, 0.4 * scale),
      new THREE.MeshStandardMaterial({ color: 0x666666, flatShading: true }));
    ac.position.set(w * 0.2, h + 0.15 * scale, 0);
    g.add(ac);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, 0.5 * scale, 4),
      new THREE.MeshStandardMaterial({ color: 0x444444, flatShading: true }));
    antenna.position.set(-w * 0.2, h + 0.25 * scale, 0);
    g.add(antenna);

    return g;
  }

  private buildMesa(scale: number, color: number): THREE.Group {
    const g = new THREE.Group();
    const geo = new THREE.CylinderGeometry(2 * scale, 3 * scale, 2 * scale, 8);

    // Vertex jitter for irregular sides
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (Math.abs(y) < scale * 0.9) { // don't jitter top/bottom too much
        positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.5 * scale);
        positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.5 * scale);
      }
    }
    geo.computeVertexNormals();

    const mesa = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, flatShading: true }));
    mesa.position.y = scale;
    g.add(mesa);

    return g;
  }

  private buildSign(scale: number, color: number): THREE.Group {
    const g = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x666666, flatShading: true });

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 2.0 * scale, 4), postMat);
    post.position.y = 1.0 * scale;
    g.add(post);

    const face = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.5 * scale, 0.05),
      new THREE.MeshStandardMaterial({ color, flatShading: true, emissive: color, emissiveIntensity: 0.2 }));
    face.position.y = 2.1 * scale;
    g.add(face);

    return g;
  }

  private buildLightPost(scale: number, color: number): THREE.Group {
    const g = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x444444, flatShading: true });

    // Post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.06 * scale, 4.0 * scale, 4), postMat);
    post.position.y = 2.0 * scale;
    g.add(post);

    // Horizontal arm
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 1.0 * scale, 4), postMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(0.5 * scale, 3.8 * scale, 0);
    g.add(arm);

    // Light fixture
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 0.1 * scale, 0.3 * scale),
      new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffdd88, emissiveIntensity: 0.8, flatShading: true }));
    light.position.set(0.9 * scale, 3.7 * scale, 0);
    g.add(light);

    return g;
  }
}
