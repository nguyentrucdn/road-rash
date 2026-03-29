import * as THREE from 'three';

export class BikeModelFactory {
  createPlayerBike(bodyColor = 0xff2200, riderColor = 0x2244cc): THREE.Group {
    return this.buildBike(bodyColor, riderColor, 'normal');
  }

  createAiBike(personality: string, bodyColor: number, riderColor = 0x444466): THREE.Group {
    return this.buildBike(bodyColor, riderColor, personality);
  }

  private buildBike(bodyColor: number, riderColor: number, personality: string): THREE.Group {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, flatShading: true });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, flatShading: true });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2, flatShading: true });

    // Frame (tapered — wider rear, narrower front)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 1.4), bodyMat);
    frame.position.y = 0.55;
    frame.scale.set(1, 1, 1);
    g.add(frame);

    // Engine block
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.4), darkMat);
    engine.position.set(0, 0.35, 0);
    g.add(engine);

    // Exhaust pipe
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.8, 5), chromeMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0.25, 0.35, 0.3);
    g.add(exhaust);

    // Exhaust tip (emissive orange)
    const exhaustTip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 5),
      new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.5, flatShading: true }));
    exhaustTip.rotation.x = Math.PI / 2;
    exhaustTip.position.set(0.25, 0.35, 0.7);
    g.add(exhaustTip);

    // Handlebars
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), chromeMat);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 0.85, -0.55);
    g.add(handlebar);

    // Grips
    for (const side of [-1, 1]) {
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 4), darkMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(side * 0.3, 0.85, -0.55);
      g.add(grip);
    }

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.5), darkMat);
    seat.position.set(0, 0.78, 0.15);
    g.add(seat);

    // Wheels with hub
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 10);
    const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 8);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, flatShading: true });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, flatShading: true });

    for (const zPos of [-0.6, 0.6]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(0, 0.25, zPos);
      g.add(wheel);

      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(0, 0.25, zPos);
      g.add(hub);
    }

    // Headlight
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffaa, emissiveIntensity: 0.8, flatShading: true }));
    headlight.position.set(0, 0.7, -0.7);
    g.add(headlight);

    // Taillight
    const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6, flatShading: true }));
    taillight.position.set(0, 0.6, 0.72);
    g.add(taillight);

    // --- Rider ---
    const riderMat = new THREE.MeshStandardMaterial({ color: riderColor, flatShading: true });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffcc88, flatShading: true });

    // Torso (slightly tapered)
    const torsoW = personality === 'defensive' ? 0.5 : 0.4;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW, 0.55, 0.35), riderMat);
    const torsoLean = personality === 'racer' ? -0.3 : -0.1;
    torso.position.set(0, 1.15, 0.05);
    torso.rotation.x = torsoLean;
    g.add(torso);

    // Head (sphere with helmet)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), skinMat);
    head.position.set(0, 1.55, -0.05);
    g.add(head);

    // Helmet
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 6, 6), riderMat);
    helmet.position.set(0, 1.58, -0.05);
    g.add(helmet);

    // Personality-specific helmet detail
    if (personality === 'aggressive') {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 4),
        new THREE.MeshStandardMaterial({ color: 0xff4400, flatShading: true }));
      spike.position.set(0, 1.78, -0.05);
      g.add(spike);
    }

    // Arms
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.45, 5), riderMat);
      arm.position.set(side * 0.25, 1.1, -0.15);
      arm.rotation.x = -0.5;
      arm.rotation.z = side * 0.3;
      g.add(arm);
    }

    // Legs
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.5, 5), riderMat);
      leg.position.set(side * 0.15, 0.8, 0.2);
      leg.rotation.x = 0.3;
      g.add(leg);
    }

    return g;
  }
}
