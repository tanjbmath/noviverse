import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original, code-authored mini rocket character rig. Novi IS the rocket ship.
// Front is +Z; the rocket body, expressive visor face, fins and booster pods animate together.
export function createNovi() {
  const root = new THREE.Group();
  root.name = 'Novi / Mini Rocket Explorer';

  const palette = {
    pearl: new THREE.MeshStandardMaterial({ color: '#f4f7f9', roughness: 0.26, metalness: 0.18 }),
    teal: new THREE.MeshStandardMaterial({ color: '#24c8be', roughness: 0.3, metalness: 0.35 }),
    coral: new THREE.MeshStandardMaterial({ color: '#ff7a45', roughness: 0.34, metalness: 0.14 }),
    sunny: new THREE.MeshStandardMaterial({ color: '#ffd166', roughness: 0.32, metalness: 0.2 }),
    dark: new THREE.MeshStandardMaterial({ color: '#14293d', roughness: 0.28, metalness: 0.56 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#243446', roughness: 0.72 }),
    glow: new THREE.MeshBasicMaterial({ color: '#7ffff0' }),
    warm: new THREE.MeshBasicMaterial({ color: '#ffd984' }),
    whiteGlow: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
  };

  const sphere = new THREE.SphereGeometry(1, 32, 22);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 24);
  const box = new RoundedBoxGeometry(1, 1, 1, 3, 0.14);

  function part(parent, geometry, material, position, scale) {
    const mesh = new THREE.Mesh(geometry, palette[material] || material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  const ball = (parent, material, position, scale) => part(parent, sphere, material, position, scale);
  const block = (parent, material, position, scale) => part(parent, box, material, position, scale);
  const tube = (parent, material, position, scale, rotation = 0) => {
    const p = part(parent, cylinder, material, position, scale);
    p.rotation.x = rotation;
    return p;
  };
  const ring = (parent, material, position, radius, thickness, rotation = 0) => {
    const p = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 10, 48), palette[material]);
    p.position.set(...position);
    p.rotation.x = rotation;
    parent.add(p);
    return p;
  };

  // hull is root.children[0] — keeps hover/idle motion local to the rig.
  const hull = new THREE.Group();
  root.add(hull);

  // Chubby, kid-friendly LatheGeometry rocket fuselage oriented along +Z (nose at +Z, nozzle at -Z).
  const bodyProfile = [
    new THREE.Vector2(0.0, -1.2),
    new THREE.Vector2(0.56, -1.2),
    new THREE.Vector2(0.78, -0.88),
    new THREE.Vector2(0.95, -0.32),
    new THREE.Vector2(0.98, 0.25),
    new THREE.Vector2(0.86, 0.78),
    new THREE.Vector2(0.68, 1.06),
    new THREE.Vector2(0.0, 1.06),
  ];
  const fuselageGeo = new THREE.LatheGeometry(bodyProfile, 36);
  fuselageGeo.rotateX(Math.PI / 2);
  const fuselage = new THREE.Mesh(fuselageGeo, palette.pearl);
  fuselage.scale.set(1, 0.9, 1);
  hull.add(fuselage);

  // Rounded coral-orange rocket nose cone (+Z tip)
  const noseProfile = [
    new THREE.Vector2(0.69, 1.03),
    new THREE.Vector2(0.58, 1.25),
    new THREE.Vector2(0.38, 1.5),
    new THREE.Vector2(0.16, 1.67),
    new THREE.Vector2(0.0, 1.72),
  ];
  const noseGeo = new THREE.LatheGeometry(noseProfile, 32);
  noseGeo.rotateX(Math.PI / 2);
  const noseCone = new THREE.Mesh(noseGeo, palette.coral);
  noseCone.scale.set(1, 0.9, 1);
  hull.add(noseCone);

  // Teal & sunny trim rings around the rocket hull
  ring(hull, 'teal', [0, 0, 1.03], 0.67, 0.048, 0);
  ring(hull, 'sunny', [0, 0, -0.82], 0.8, 0.042, 0);
  ring(hull, 'dark', [0, 0, -1.2], 0.56, 0.06, 0);
  ball(hull, 'sunny', [0, 0, 1.73], [0.095, 0.09, 0.09]);

  // Novi's expressive face integrated directly onto the rocket ship's front visor panel!
  const rocketFace = new THREE.Group();
  rocketFace.position.set(0, 0.48, 0.64);
  rocketFace.rotation.x = -0.34;
  hull.add(rocketFace);

  // Framed rounded visor screen built into the rocket hull
  ball(rocketFace, 'teal', [0, 0, -0.02], [0.62, 0.44, 0.24]);
  ball(rocketFace, 'dark', [0, 0, 0.06], [0.56, 0.37, 0.2]);

  // Big bright blinking eyes with catchlight sparkles, rosy cheeks & cheerful smile
  const rocketEyes = new THREE.Group();
  rocketFace.add(rocketEyes);
  for (const x of [-0.18, 0.18]) {
    block(rocketEyes, 'glow', [x, 0.05, 0.245], [0.115, 0.19, 0.04]);
    ball(rocketEyes, 'whiteGlow', [x + 0.026, 0.1, 0.27], [0.028, 0.03, 0.016]);
    ball(rocketFace, 'coral', [x * 1.72, -0.09, 0.21], [0.06, 0.032, 0.022]);
  }
  const rocketSmile = new THREE.Mesh(
    new THREE.TorusGeometry(0.115, 0.016, 6, 18, Math.PI * 0.72),
    palette.glow,
  );
  rocketSmile.rotation.z = Math.PI * 1.14;
  rocketSmile.position.set(0.045, -0.09, 0.255);
  rocketFace.add(rocketSmile);

  // Cute twin glowing antennae on top of the rocket hull
  for (const sign of [-1, 1]) {
    const ant = tube(hull, 'teal', [sign * 0.28, 0.92, 0.16], [0.022, 0.26, 0.022]);
    ant.rotation.z = -sign * 0.22;
    ball(hull, 'warm', [sign * 0.34, 1.07, 0.16], [0.065, 0.065, 0.065]);
  }

  // Cute lower front headlights on the nose belly
  for (const x of [-0.34, 0.34]) {
    ball(hull, 'dark', [x, -0.22, 1.13], [0.12, 0.095, 0.08]);
    ball(hull, 'glow', [x, -0.22, 1.19], [0.075, 0.06, 0.04]);
  }

  // Central main rocket thruster bell + glowing twin-layer plume at tail (-Z)
  tube(hull, 'dark', [0, 0, -1.34], [0.45, 0.28, 0.45], Math.PI / 2);
  ring(hull, 'coral', [0, 0, -1.46], 0.43, 0.055, 0);
  ring(hull, 'glow', [0, 0, -1.5], 0.33, 0.035, 0);

  const flames = [];
  const mainOuterFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 1.18, 20),
    new THREE.MeshBasicMaterial({ color: '#ff8e53', transparent: true, opacity: 0.78, depthWrite: false }),
  );
  mainOuterFlame.rotation.x = -Math.PI / 2;
  mainOuterFlame.position.z = -2.02;
  hull.add(mainOuterFlame);
  flames.push(mainOuterFlame);

  const mainInnerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.84, 16),
    new THREE.MeshBasicMaterial({ color: '#fff3a8', transparent: true, opacity: 0.92, depthWrite: false }),
  );
  mainInnerFlame.rotation.x = -Math.PI / 2;
  mainInnerFlame.position.z = -1.86;
  hull.add(mainInnerFlame);
  flames.push(mainInnerFlame);

  // Dorsal tail fin for classic toy-rocket silhouette
  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(0, 0);
  dorsalShape.quadraticCurveTo(0.2, 0.68, 0.74, 0.88);
  dorsalShape.quadraticCurveTo(0.8, 0.44, 0.56, 0);
  dorsalShape.closePath();
  const dorsalFin = new THREE.Mesh(
    new THREE.ExtrudeGeometry(dorsalShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.025, bevelSegments: 2 }),
    palette.coral,
  );
  dorsalFin.rotation.y = -Math.PI / 2;
  dorsalFin.position.set(0.04, 0.46, -1.14);
  hull.add(dorsalFin);

  // Twin side rocket booster pods + chunky swept fins (preserving Port/Starboard engine pivot names)
  const pods = [];
  const podBodies = [];
  const fins = [];
  for (const sign of [-1, 1]) {
    const joint = new THREE.Group();
    joint.name = sign < 0 ? 'Port engine pivot' : 'Starboard engine pivot';
    joint.position.set(sign * 0.94, -0.08, -0.36);
    hull.add(joint);
    pods.push(joint);

    block(joint, 'dark', [sign * 0.08, 0, 0], [0.34, 0.15, 0.24]);
    const pod = new THREE.Group();
    pod.position.x = sign * 0.24;
    joint.add(pod);
    podBodies.push(pod);

    tube(pod, 'pearl', [0, 0, 0], [0.22, 0.95, 0.22], Math.PI / 2);
    ball(pod, 'coral', [0, 0, 0.46], [0.22, 0.22, 0.28]);
    tube(pod, 'teal', [0, 0, 0.14], [0.23, 0.14, 0.23], Math.PI / 2);
    ring(pod, 'sunny', [0, 0, -0.36], 0.21, 0.032);
    tube(pod, 'dark', [0, 0, -0.52], [0.19, 0.16, 0.19], Math.PI / 2);
    ring(pod, 'glow', [0, 0, -0.6], 0.15, 0.025);

    const podFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.68, 16),
      new THREE.MeshBasicMaterial({ color: '#7fffe8', transparent: true, opacity: 0.72, depthWrite: false }),
    );
    podFlame.rotation.x = -Math.PI / 2;
    podFlame.position.z = -0.92;
    pod.add(podFlame);
    flames.push(podFlame);

    // Chunky swept rocket fins
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.35);
    shape.quadraticCurveTo(sign * 0.66, 0.02, sign * 0.8, -0.64);
    shape.lineTo(sign * 0.64, -0.84);
    shape.lineTo(0, -0.58);
    shape.closePath();
    const wing = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.075, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.03, bevelSegments: 2, steps: 1 }),
      palette.coral,
    );
    wing.rotation.x = Math.PI / 2;
    wing.position.set(sign * 0.68, -0.1, -0.25);
    hull.add(wing);
    fins.push(wing);
  }

  const scanner = new THREE.Group();
  scanner.position.set(-0.56, 0.44, 0.74);
  hull.add(scanner);
  tube(scanner, 'dark', [0, 0.12, 0], [0.032, 0.22, 0.032]);
  ball(scanner, 'pearl', [0, 0.24, 0], [0.14, 0.095, 0.11]);
  ball(scanner, 'glow', [0, 0.24, 0.1], [0.075, 0.055, 0.03]);

  // Walking explorer rig (hidden unless earthMode > 0 on Earth wonder close-ups).
  const character = new THREE.Group();
  character.position.set(0, 0.54, 0);
  hull.add(character);
  ball(character, 'pearl', [0, 0.15, 0], [0.3, 0.34, 0.24]);
  block(character, 'teal', [0, 0.18, 0.215], [0.25, 0.21, 0.06]);
  block(character, 'warm', [0, 0.19, 0.255], [0.075, 0.09, 0.025]);
  block(character, 'coral', [0, 0.25, -0.25], [0.34, 0.36, 0.17]);
  for (const x of [-0.1, 0.1]) block(character, 'glow', [x, 0.29, -0.34], [0.026, 0.18, 0.026]);

  const head = new THREE.Group();
  head.position.y = 0.62;
  character.add(head);
  ball(head, 'pearl', [0, 0, 0], [0.49, 0.45, 0.44]);
  ball(head, 'teal', [0, 0, 0.04], [0.46, 0.35, 0.44]);
  ball(head, 'dark', [0, 0, 0.14], [0.425, 0.31, 0.36]);
  const eyes = new THREE.Group();
  head.add(eyes);
  for (const x of [-0.155, 0.155]) {
    block(eyes, 'glow', [x, 0.03, 0.47], [0.1, 0.165, 0.036]);
    ball(eyes, 'whiteGlow', [x + 0.022, 0.075, 0.492], [0.024, 0.026, 0.015]);
    ball(head, 'coral', [x * 1.68, -0.095, 0.415], [0.052, 0.026, 0.02]);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 18, Math.PI * 0.72), palette.glow);
  smile.rotation.z = Math.PI * 1.14;
  smile.position.set(0.04, -0.09, 0.475);
  head.add(smile);

  const arms = [];
  for (const sign of [-1, 1]) {
    tube(head, 'teal', [sign * 0.46, 0, 0], [0.12, 0.11, 0.12], 0).rotation.z = Math.PI / 2;
    ball(head, 'coral', [sign * 0.52, 0, 0], [0.07, 0.115, 0.115]);
    tube(head, 'teal', [sign * 0.24, 0.46, -0.02], [0.016, 0.2, 0.016]);
    ball(head, 'warm', [sign * 0.27, 0.57, -0.02], [0.055, 0.055, 0.055]);

    const arm = new THREE.Group();
    arm.position.set(sign * 0.3, 0.32, 0);
    character.add(arm);
    arms.push(arm);
    ball(arm, 'teal', [0, 0, 0], [0.095, 0.095, 0.095]);
    const limb = block(arm, 'pearl', [sign * 0.08, -0.13, 0.08], [0.11, 0.27, 0.12]);
    limb.rotation.z = sign * 0.45;
    ball(arm, 'coral', [sign * 0.12, -0.24, 0.15], [0.09, 0.09, 0.1]);
  }
  block(head, 'sunny', [0, 0.41, 0.1], [0.1, 0.06, 0.16]);

  const groundRig = new THREE.Group();
  groundRig.name = 'Earth walking rig';
  character.add(groundRig);
  const legs = [];
  for (const sign of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sign * 0.17, -0.05, 0);
    groundRig.add(leg);
    legs.push(leg);
    ball(leg, 'teal', [0, 0, 0], [0.11, 0.11, 0.11]);
    block(leg, 'pearl', [0, -0.15, 0], [0.17, 0.25, 0.18]);
    ball(leg, 'dark', [0, -0.28, 0.02], [0.1, 0.1, 0.1]);
    block(leg, 'coral', [0, -0.29, 0.1], [0.13, 0.09, 0.06]);
    block(leg, 'pearl', [0, -0.42, 0.03], [0.16, 0.24, 0.17]);
    for (const x of [-0.065, 0.065]) tube(leg, 'dark', [x, -0.42, 0.12], [0.012, 0.19, 0.012]);
    block(leg, 'dark', [0, -0.58, 0.08], [0.23, 0.13, 0.36]);
    block(leg, 'teal', [0, -0.52, 0.08], [0.21, 0.1, 0.32]);
    for (let i = 0; i < 4; i++) block(leg, 'rubber', [0, -0.635, -0.04 + i * 0.08], [0.24, 0.025, 0.035]);
    block(leg, 'glow', [0, -0.51, 0.25], [0.12, 0.025, 0.018]);
  }

  const foldedShipParts = hull.children
    .filter(p => p !== character)
    .map(p => ({ part: p, position: p.position.clone(), scale: p.scale.clone() }));

  const scanRing = ring(root, 'glow', [0, -0.45, 0], 1.15, 0.015, Math.PI / 2);
  scanRing.visible = false;

  let mode = 0;
  let earthMode = 0;
  let moving = false;
  let scanning = false;
  let idleBlend = 1;
  let thrustBlend = 0;
  let bankSpring = 0;
  let bankVel = 0;
  let pitchSpring = 0;
  let pitchVel = 0;
  let lastSpeed = 0;
  let hasPrevKinematics = false;
  const prevPos = new THREE.Vector3();
  const prevForward = new THREE.Vector3(0, 0, 1);
  const curForward = new THREE.Vector3();
  const curRight = new THREE.Vector3();
  const deltaPos = new THREE.Vector3();
  const dForward = new THREE.Vector3();

  function setEarthMode(value) {
    earthMode = Math.max(0, Math.min(1, value));
    // Pure rocket ship at earthMode === 0 (no human/pilot figure visible on rocket).
    character.visible = earthMode > 0;
    groundRig.visible = earthMode > 0;
    groundRig.scale.y = Math.max(0.001, earthMode);
    character.position.y = 0.54 + 0.91 * earthMode;
    character.scale.setScalar(1 + 1.1 * earthMode);
    for (const { part: p, position, scale } of foldedShipParts) {
      p.visible = earthMode < 1;
      p.position.copy(position).lerp(new THREE.Vector3(0, 0.4, -0.3), earthMode);
      p.scale.copy(scale).multiplyScalar(Math.max(0.001, (1 - earthMode) ** 2));
    }
    flames.forEach(flame => { flame.visible = earthMode === 0; });
  }
  setEarthMode(0);

  function resetMotion() {
    hasPrevKinematics = false;
    bankSpring = 0;
    bankVel = 0;
    pitchSpring = 0;
    pitchVel = 0;
    lastSpeed = 0;
    thrustBlend = moving ? 1 : 0;
  }

  return {
    root,
    setEarthMode,
    get earthMode() { return earthMode; },
    resetMotion,
    setTransform(t) {
      mode = t;
      pods.forEach(p => { p.rotation.x = -t * Math.PI / 2; });
      fins.forEach((f, i) => { f.rotation.y = (i ? 1 : -1) * t * 0.35; });
    },
    setMoving(value) { moving = value; },
    setScanning(value) { scanning = value; scanRing.visible = value; },
    update(time, reduced = false, dt = 1 / 60) {
      const animate = !reduced;
      const safeDt = Math.min(Math.max(dt, 0), 0.05);
      idleBlend += ((!moving && mode === 0 ? 1 : 0) - idleBlend) * (1 - Math.exp(-5 * safeDt));

      // Measure real root kinematics (speed, acceleration, heading turn) for inertial spring response.
      let targetBank = 0;
      let targetPitch = 0;
      let measuredSpeed = 0;
      if (animate && safeDt > 1e-4) {
        curForward.set(0, 0, 1).applyQuaternion(root.quaternion).normalize();
        curRight.set(1, 0, 0).applyQuaternion(root.quaternion).normalize();
        if (!hasPrevKinematics) {
          prevPos.copy(root.position);
          prevForward.copy(curForward);
          hasPrevKinematics = true;
        } else {
          deltaPos.copy(root.position).sub(prevPos);
          const dist = deltaPos.length();
          const speed = dist / safeDt;
          // Ignore instantaneous scene-swap teleports.
          if (speed < 80) {
            measuredSpeed = speed;
            const accel = Math.max(-18, Math.min(18, (speed - lastSpeed) / safeDt));
            lastSpeed += (speed - lastSpeed) * (1 - Math.exp(-10 * safeDt));
            const turnLat = curRight.dot(dForward.copy(curForward).sub(prevForward)) / safeDt;
            const climbRatio = dist > 1e-4 ? deltaPos.y / dist : 0;
            targetBank = Math.max(-0.26, Math.min(0.26, -turnLat * 0.095));
            targetPitch = Math.max(-0.18, Math.min(0.18, -accel * 0.008 - climbRatio * 0.04));
          } else {
            lastSpeed = 0;
          }
          prevPos.copy(root.position);
          prevForward.copy(curForward);
        }
      } else if (!animate) {
        hasPrevKinematics = false;
        bankSpring = 0;
        bankVel = 0;
        pitchSpring = 0;
        pitchVel = 0;
        lastSpeed = 0;
        thrustBlend = 0;
      }

      // Second-order damped spring physics for secondary attitude inertia & recovery.
      if (animate && safeDt > 0) {
        const k = 42;
        const c = 9.5;
        bankVel += ((targetBank - bankSpring) * k - bankVel * c) * safeDt;
        bankSpring += bankVel * safeDt;
        pitchVel += ((targetPitch - pitchSpring) * k - pitchVel * c) * safeDt;
        pitchSpring += pitchVel * safeDt;
      }

      const activeThrust = moving ? Math.min(1.25, 0.85 + Math.min(measuredSpeed, 14) * 0.03) : 0;
      if (animate) thrustBlend += (activeThrust - thrustBlend) * (1 - Math.exp(-6.5 * safeDt));

      const groundWalk = moving && earthMode > 0.8;
      const airFactor = 1 - earthMode;

      // Multi-harmonic organic zero-G float when idle; micro flight trim when cruising.
      const floatY = Math.sin(time * 1.5) * (0.035 + idleBlend * 0.185)
        + Math.sin(time * 0.72 + 0.35) * idleBlend * 0.022;
      hull.position.y = animate
        ? floatY * airFactor + (groundWalk ? Math.abs(Math.sin(time * 7)) * 0.035 : 0)
        : 0;
      hull.position.x = animate
        ? (Math.sin(time * 0.7) * 0.045 + Math.sin(time * 1.13 + 1.1) * 0.018) * idleBlend * airFactor
        : 0;
      hull.position.z = animate
        ? Math.cos(time * 0.58) * idleBlend * 0.032 * airFactor
        : 0;

      const idlePitch = (Math.sin(time * 0.6) * 0.022 + Math.cos(time * 1.07) * 0.01) * idleBlend;
      const idleRoll = Math.sin(time * 0.8) * (moving ? 0.035 : 0.02 + idleBlend * 0.02)
        + Math.cos(time * 1.25) * idleBlend * 0.012;
      hull.rotation.x = animate ? (idlePitch + pitchSpring) * airFactor : 0;
      hull.rotation.y = animate ? Math.sin(time * 0.45) * idleBlend * 0.035 * airFactor : 0;
      hull.rotation.z = animate ? (idleRoll + bankSpring) * airFactor : 0;

      // Subtle thrust-vectoring gimbal on inner pod bodies when in flight mode (never touches pivot joint).
      const gimbal = animate && mode === 0 ? (pitchSpring * 0.65 - thrustBlend * 0.08) * airFactor : 0;
      podBodies.forEach((pod, i) => {
        pod.rotation.x = gimbal + (animate && mode === 0 ? Math.sin(time * 1.9 + i * Math.PI) * thrustBlend * 0.025 * airFactor : 0);
      });

      legs.forEach((leg, i) => { leg.rotation.x = animate && groundWalk ? Math.sin(time * 7 + i * Math.PI) * 0.38 : 0; });
      arms.forEach((arm, i) => { arm.rotation.x = animate && groundWalk ? -Math.sin(time * 7 + i * Math.PI) * 0.32 : 0; });
      head.rotation.y = scanning ? Math.sin(time * 2) * 0.22 : animate ? Math.sin(time * 0.8) * 0.14 : 0;
      const blink = animate && Math.sin(time * 1.1) > 0.993 ? 0.1 : 1;
      eyes.scale.y = blink;
      rocketEyes.scale.y = blink;
      rocketFace.rotation.y = scanning ? Math.sin(time * 2) * 0.12 : animate ? Math.sin(time * 0.8) * 0.06 : 0;

      const effThrust = animate ? thrustBlend : 0;
      flames.forEach((f, i) => {
        const base = (mode ? 0.62 : 0.52) + effThrust * 1.05;
        const flicker = animate ? Math.sin(time * 17 + i * 1.9) * (0.07 + effThrust * 0.08) + Math.sin(time * 29 + i) * 0.04 : 0;
        const len = Math.max(0.25, base + flicker);
        const width = 0.88 + effThrust * 0.22 + (animate ? Math.cos(time * 21 + i) * 0.05 : 0);
        f.scale.set(width, len, width);
        f.material.opacity = Math.min(0.96, (i === 1 ? 0.86 : 0.62) + effThrust * 0.18);
      });
      scanRing.scale.setScalar(1 + (animate ? (time % 1.8) * 0.5 : 0));
    },
  };
}
