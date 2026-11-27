import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original, code-authored production model. One rig and material palette in both modes.
// Front is +Z; the helmet, hull and articulated pod assemblies remain identical.
export function createNovi() {
  const root = new THREE.Group(); root.name = 'Novi / Adaptive explorer';
  const palette = {
    pearl: new THREE.MeshStandardMaterial({ color: '#edf3f4', roughness: 0.29, metalness: 0.26 }),
    teal: new THREE.MeshStandardMaterial({ color: '#24bdb4', roughness: 0.32, metalness: 0.45 }),
    orange: new THREE.MeshStandardMaterial({ color: '#ff994f', roughness: 0.4, metalness: 0.2 }),
    dark: new THREE.MeshStandardMaterial({ color: '#122738', roughness: 0.27, metalness: 0.58 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#253342', roughness: 0.7 }),
    glow: new THREE.MeshBasicMaterial({ color: '#7ffff0' }),
    warm: new THREE.MeshBasicMaterial({ color: '#ffc58a' }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#8be6ee', roughness: 0.05, metalness: 0.12, transparent: true, opacity: 0.11, depthWrite: false, side: THREE.DoubleSide }),
  };
  const sphere = new THREE.SphereGeometry(1, 36, 24);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 24);
  const box = new RoundedBoxGeometry(1, 1, 1, 3, 0.12);
  function part(parent, geometry, material, position, scale) {
    const mesh = new THREE.Mesh(geometry, palette[material] || material);
    mesh.position.set(...position); mesh.scale.set(...scale); parent.add(mesh); return mesh;
  }
  const ball = (parent, material, position, scale) => part(parent, sphere, material, position, scale);
  const block = (parent, material, position, scale) => part(parent, box, material, position, scale);
  const tube = (parent, material, position, scale, rotation = 0) => {
    const p = part(parent, cylinder, material, position, scale); p.rotation.x = rotation; return p;
  };
  const ring = (parent, material, position, radius, thickness, rotation = 0) => {
    const p = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 8, 48), palette[material]);
    p.position.set(...position); p.rotation.x = rotation; parent.add(p); return p;
  };

  const hull = new THREE.Group(); root.add(hull);
  ball(hull, 'dark', [0, 0, 0], [1.22, 0.38, 1.48]);
  ball(hull, 'pearl', [0, 0.13, 0.06], [1.2, 0.38, 1.42]);
  ball(hull, 'teal', [0, -0.1, 0.03], [1.18, 0.19, 1.37]);
  block(hull, 'orange', [0, 0.34, 1.11], [0.22, 0.09, 0.45]);
  block(hull, 'dark', [0, 0.22, 1.36], [0.58, 0.18, 0.12]);
  for (const x of [-0.32, 0.32]) block(hull, 'glow', [x, 0.29, 1.33], [0.23, 0.06, 0.07]);
  // Cockpit collar, seat and transparent dome, with a visible rim and seam.
  ring(hull, 'dark', [0, 0.38, -0.08], 0.81, 0.065, Math.PI / 2);
  ring(hull, 'teal', [0, 0.41, -0.08], 0.81, 0.025, Math.PI / 2);
  block(hull, 'dark', [0, 0.49, -0.38], [0.62, 0.5, 0.2]);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.88, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), palette.glass);
  canopy.position.set(0, 0.4, -0.08); canopy.scale.y = 1.35; hull.add(canopy);
  const canopyArc = ring(hull, 'pearl', [0, 0.4, -0.08], 0.88, 0.016);
  canopyArc.scale.y = 1.35; canopyArc.rotation.y = Math.PI / 2;

  const character = new THREE.Group(); character.position.set(0, 0.54, 0); hull.add(character);
  ball(character, 'pearl', [0, 0.15, 0], [0.32, 0.36, 0.25]);
  block(character, 'teal', [0, 0.18, 0.225], [0.26, 0.23, 0.06]);
  block(character, 'warm', [0, 0.19, 0.266], [0.06, 0.1, 0.025]);
  block(character, 'dark', [0, 0.06, 0.24], [0.18, 0.025, 0.02]);
  block(character, 'orange', [0, 0.26, -0.27], [0.36, 0.38, 0.18]);
  for (const x of [-0.11, 0.11]) block(character, 'glow', [x, 0.3, -0.37], [0.025, 0.2, 0.025]);
  const head = new THREE.Group(); head.position.y = 0.66; character.add(head);
  ball(head, 'pearl', [0, 0, 0], [0.49, 0.44, 0.43]);
  ball(head, 'teal', [0, 0, 0.04], [0.46, 0.35, 0.43]);
  ball(head, 'dark', [0, 0, 0.13], [0.424, 0.30, 0.36]);
  const eyes = new THREE.Group(); head.add(eyes);
  for (const x of [-0.16, 0.16]) {
    block(eyes, 'glow', [x, 0.025, 0.465], [0.088, 0.16, 0.035]);
    ball(head, 'orange', [x * 1.67, -0.1, 0.408], [0.044, 0.019, 0.016]);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.012, 6, 18, Math.PI * 0.72), palette.glow);
  smile.rotation.z = Math.PI * 1.14; smile.position.set(0.04, -0.095, 0.47); head.add(smile);
  const arms = [], seatedFeet = [];
  for (const sign of [-1, 1]) {
    tube(head, 'dark', [sign * 0.465, 0, 0], [0.13, 0.11, 0.13], 0).rotation.z = Math.PI / 2;
    ball(head, 'orange', [sign * 0.52, 0, 0], [0.065, 0.11, 0.11]);
    const arm = new THREE.Group(); arm.position.set(sign * 0.32, 0.34, 0); character.add(arm); arms.push(arm);
    ball(arm, 'teal', [0, 0, 0], [0.1, 0.1, 0.1]);
    const limb = block(arm, 'pearl', [sign * 0.08, -0.14, 0.08], [0.12, 0.29, 0.13]); limb.rotation.z = sign * 0.45;
    ball(arm, 'dark', [sign * 0.12, -0.26, 0.16], [0.09, 0.09, 0.1]);
    block(arm, 'orange', [sign * 0.12, -0.22, 0.18], [0.12, 0.06, 0.12]);
    seatedFeet.push(block(character, 'dark', [sign * 0.16, -0.1, 0.13], [0.15, 0.19, 0.25]));
    seatedFeet.push(block(character, 'pearl', [sign * 0.16, -0.16, 0.19], [0.17, 0.1, 0.29]));
  }
  tube(head, 'teal', [0.29, 0.49, -0.04], [0.015, 0.23, 0.015]);
  ball(head, 'warm', [0.29, 0.61, -0.04], [0.055, 0.055, 0.055]);
  block(head, 'orange', [0, 0.405, 0.1], [0.09, 0.06, 0.16]);

  const pods = [], flames = [], fins = [];
  for (const sign of [-1, 1]) {
    const joint = new THREE.Group(); joint.name = sign < 0 ? 'Port engine pivot' : 'Starboard engine pivot'; joint.position.set(sign * 1.22, -0.01, -0.2); hull.add(joint); pods.push(joint);
    block(joint, 'dark', [sign * 0.07, 0, 0], [0.58, 0.2, 0.3]);
    const pod = new THREE.Group(); pod.position.x = sign * 0.26; joint.add(pod);
    tube(pod, 'pearl', [0, 0, 0], [0.255, 1.3, 0.255], Math.PI / 2);
    tube(pod, 'teal', [0, 0, 0.35], [0.267, 0.16, 0.267], Math.PI / 2);
    ring(pod, 'orange', [0, 0, -0.47], 0.25, 0.035);
    tube(pod, 'dark', [0, 0, -0.68], [0.22, 0.17, 0.22], Math.PI / 2);
    ring(pod, 'glow', [0, 0, -0.77], 0.17, 0.027);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.7, 16), new THREE.MeshBasicMaterial({ color: '#7fffe8', transparent: true, opacity: 0.65, depthWrite: false }));
    flame.rotation.x = -Math.PI / 2; flame.position.z = -1.08; pod.add(flame); flames.push(flame);
    for (let j = 0; j < 4; j++) block(pod, 'dark', [sign * 0.248, 0, -0.28 + j * 0.13], [0.026, 0.11, 0.055]);
    // Swept wings, inset colored panels and structural fasteners.
    const shape = new THREE.Shape(); shape.moveTo(0, 0.4); shape.lineTo(sign * 0.9, -0.5); shape.lineTo(sign * 0.94, -0.92); shape.lineTo(0, -0.67); shape.closePath();
    const wing = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.03, bevelSegments: 2, steps: 1 }), palette.pearl);
    wing.rotation.x = Math.PI / 2; wing.position.set(sign * 0.75, -0.05, 0); hull.add(wing); fins.push(wing);
    block(hull, 'orange', [sign * 1.4, 0.03, 0.63], [0.12, 0.055, 0.48]);
    for (let j = 0; j < 3; j++) ball(hull, 'dark', [sign * (0.88 + j * 0.16), 0.19 - j * 0.04, 0.5], [0.023, 0.02, 0.023]);
  }
  const scanner = new THREE.Group(); scanner.position.set(-0.67, 0.42, 0.8); hull.add(scanner);
  tube(scanner, 'dark', [0, 0.13, 0], [0.035, 0.24, 0.035]);
  ball(scanner, 'pearl', [0, 0.26, 0], [0.15, 0.1, 0.12]);
  ball(scanner, 'glow', [0, 0.26, 0.11], [0.08, 0.06, 0.03]);
  // The same pilot and face unfold into a walking field explorer. Ship parts
  // fold into the backpack while articulated legs and treaded boots deploy.
  const groundRig = new THREE.Group(); groundRig.name = 'Earth walking rig'; character.add(groundRig);
  const legs = [];
  for (const sign of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(sign * .17, -.05, 0); groundRig.add(leg); legs.push(leg);
    ball(leg, 'teal', [0, 0, 0], [.11, .11, .11]);
    block(leg, 'pearl', [0, -.15, 0], [.17, .25, .18]);
    ball(leg, 'dark', [0, -.28, .02], [.10, .10, .10]);
    block(leg, 'orange', [0, -.29, .10], [.13, .09, .06]);
    block(leg, 'pearl', [0, -.42, .03], [.16, .24, .17]);
    for (const x of [-.065, .065]) tube(leg, 'dark', [x, -.42, .12], [.012, .19, .012]);
    block(leg, 'dark', [0, -.58, .08], [.23, .13, .36]);
    block(leg, 'teal', [0, -.52, .08], [.21, .10, .32]);
    for (let i = 0; i < 4; i++) block(leg, 'rubber', [0, -.635, -.04 + i * .08], [.24, .025, .035]);
    block(leg, 'glow', [0, -.51, .25], [.12, .025, .018]);
  }
  const foldedShipParts = hull.children.filter(part => part !== character).map(part => ({ part, position: part.position.clone(), scale: part.scale.clone() }));
  const scanRing = ring(root, 'glow', [0, -0.4, 0], 1.1, 0.013, Math.PI / 2); scanRing.visible = false;
  let mode = 0, earthMode = 0, moving = false, scanning = false, idleBlend = 1;
  function setEarthMode(value) {
    earthMode = Math.max(0, Math.min(1, value));
    groundRig.visible = earthMode > 0; groundRig.scale.y = Math.max(.001, earthMode);
    character.position.y = .54 + .91 * earthMode; character.scale.setScalar(1 + 1.1 * earthMode);
    for (const { part, position, scale } of foldedShipParts) {
      part.visible = earthMode < 1;
      part.position.copy(position).lerp(new THREE.Vector3(0, .4, -.3), earthMode);
      part.scale.copy(scale).multiplyScalar(Math.max(.001, (1 - earthMode) ** 2));
    }
    seatedFeet.forEach(foot => { foot.visible = earthMode < .35; });
    flames.forEach(flame => { flame.visible = earthMode === 0; });
  }
  setEarthMode(0);
  return {
    root,
    setEarthMode,
    get earthMode() { return earthMode; },
    setTransform(t) { mode = t; pods.forEach(p => { p.rotation.x = -t * Math.PI / 2; }); fins.forEach((f, i) => { f.rotation.y = (i ? 1 : -1) * t * 0.35; }); },
    setMoving(value) { moving = value; },
    setScanning(value) { scanning = value; scanRing.visible = value; },
    update(time, reduced = false, dt = 1 / 60) {
      const animate = !reduced;
      // Animate the local hull so cinematic navigation keeps ownership of the root.
      idleBlend += ((!moving && mode === 0 ? 1 : 0) - idleBlend) * (1 - Math.exp(-5 * dt));
      const groundWalk = moving && earthMode > .8;
      hull.position.y = animate ? Math.sin(time * 1.5) * (0.035 + idleBlend * 0.185) * (1 - earthMode) + (groundWalk ? Math.abs(Math.sin(time * 7)) * .035 : 0) : 0;
      hull.position.x = animate ? Math.sin(time * 0.7) * idleBlend * 0.045 * (1 - earthMode) : 0;
      hull.rotation.x = animate ? Math.sin(time * 0.6) * idleBlend * 0.018 * (1 - earthMode) : 0;
      hull.rotation.z = animate ? Math.sin(time * 0.8) * (moving ? 0.07 : 0.022 + idleBlend * 0.018) * (1 - earthMode) : 0;
      legs.forEach((leg, i) => { leg.rotation.x = animate && groundWalk ? Math.sin(time * 7 + i * Math.PI) * .38 : 0; });
      arms.forEach((arm, i) => { arm.rotation.x = animate && groundWalk ? -Math.sin(time * 7 + i * Math.PI) * .32 : 0; });
      head.rotation.y = scanning ? Math.sin(time * 2) * 0.22 : animate ? Math.sin(time * 0.7) * 0.12 : 0;
      eyes.scale.y = animate && Math.sin(time * 1.1) > 0.993 ? 0.1 : 1;
      flames.forEach((f, i) => { f.scale.y = (moving ? 1.6 : mode ? 0.6 : 0.4) + (animate ? Math.sin(time * 12 + i) * 0.1 : 0); });
      scanRing.scale.setScalar(1 + (animate ? (time % 1.8) * 0.5 : 0));
    },
  };
}
