import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSpaceMotion, SOLAR_PLANETS, SolarControls } from '../src/scenes/space.js';
import { createNovi } from '../src/models/novi.js';
import { disposeScene } from '../src/core/dispose.js';

function setup(width = 1280, height = 720) {
  const objects = Object.fromEntries(['earth', 'air', 'moon', 'sun', 'orbit'].map(id => [id, new THREE.Object3D()]));
  const novi = { root: new THREE.Object3D(), update() {} };
  const motion = { labels: [{ offset: new THREE.Vector3() }, { offset: new THREE.Vector3() }], ...createSpaceMotion({ ...objects, novi }) };
  const engine = { camera: new THREE.PerspectiveCamera(43, width / height, 0.1, 1200), look: new THREE.Vector3(), paused: false };
  motion.resize(engine, width, height); engine.camera.lookAt(engine.look); engine.camera.updateMatrixWorld();
  return { ...objects, motion, engine };
}

function setupSolarSystem(width = 1280, height = 720) {
  const sun = new THREE.Object3D();
  const air = new THREE.Object3D();
  const moon = new THREE.Object3D();
  const orbit = new THREE.Object3D();
  const novi = { root: new THREE.Object3D(), update() {} };
  const controls = new SolarControls();
  const planets = {};
  const labels = [];
  for (const spec of SOLAR_PLANETS) {
    const mesh = new THREE.Object3D();
    const ring = new THREE.Object3D();
    planets[spec.id] = { ...spec, mesh, spinMesh: mesh, ring };
    labels.push({ id: spec.id, offset: new THREE.Vector3(0, -(spec.radius + 0.38), 0), object: mesh });
  }
  labels.push({ id: 'moon', offset: new THREE.Vector3(0, -0.45, 0), object: moon });
  labels.push({ id: 'sun', offset: new THREE.Vector3(0, -2.25, 0), object: sun });
  const earth = planets.earth.mesh;
  const motion = {
    labels,
    ...createSpaceMotion({ earth, air, moon, sun, novi, orbit, planets, controls }),
  };
  const engine = { camera: new THREE.PerspectiveCamera(43, width / height, 0.1, 1200), look: new THREE.Vector3(), paused: false };
  motion.resize(engine, width, height);
  engine.camera.lookAt(engine.look);
  engine.camera.updateMatrixWorld();
  return { sun, earth, moon, novi, planets, controls, motion, engine };
}

test('Moon completes a clear orbit with its node reachable throughout on desktop and phones', () => {
  for (const [width, height] of [[1280, 720], [390, 844], [390, 650], [760, 844], [844, 390]]) {
    const { earth, moon, motion, engine } = setup(width, height);
    const start = moon.position.clone(), radius = moon.position.distanceTo(earth.position);
    for (let i = 1; i <= 600; i++) {
      motion.update(0.25, i * 0.25, engine);
      assert.ok(Math.abs(moon.position.distanceTo(earth.position) - radius) < 1e-10);
      assert.ok(radius > 3.25 * earth.scale.x + 0.85 * moon.scale.x);
      const node = moon.position.clone().add(motion.labels[1].offset).project(engine.camera);
      const x = (node.x + 1) * width / 2, y = (-node.y + 1) * height / 2;
      assert.ok(x >= 25 && x <= width - 25 && y >= 88 && y <= height - 60, `${width}x${height}, step ${i}`);
    }
    assert.ok(moon.position.distanceTo(start) < 1e-10);
  }
});

test('all 8 solar system planets orbit the Sun with reachable nodes on desktop and phones', () => {
  assert.equal(SOLAR_PLANETS.length, 8);
  for (const [width, height] of [[1280, 720], [390, 844], [844, 390]]) {
    const { sun, planets, motion, engine } = setupSolarSystem(width, height);
    const initialPositions = Object.fromEntries(SOLAR_PLANETS.map(p => [p.id, planets[p.id].mesh.position.clone()]));
    motion.update(2, 2, engine);
    for (const spec of SOLAR_PLANETS) {
      const p = planets[spec.id];
      assert.ok(p.mesh.position.distanceTo(initialPositions[spec.id]) > 0.01, `${spec.id} should orbit`);
      assert.ok(p.mesh.position.distanceTo(sun.position) > 2, `${spec.id} clear of Sun`);
    }
    for (const label of motion.labels) {
      const node = label.object.position.clone().add(label.offset).project(engine.camera);
      const x = (node.x + 1) * width / 2, y = (-node.y + 1) * height / 2;
      assert.ok(x >= 25 && x <= width - 25 && y >= 88 && y <= height - 60, `${label.id} @ ${width}x${height}: (${x.toFixed(1)}, ${y.toFixed(1)})`);
    }
    engine.paused = true;
    const pausedPos = planets.mercury.mesh.position.clone();
    motion.update(5, 7, engine);
    assert.ok(planets.mercury.mesh.position.equals(pausedPos));
  }
});

test('Novi circles smoothly around a zoomed-in planet outside its radius and rings', () => {
  const { novi, planets, motion, engine } = setupSolarSystem(1280, 720);
  for (const id of ['mars', 'saturn']) {
    motion.setIdle(false);
    motion.resetVisitOrbit();
    motion.visitingPlanet = id;
    const focus = motion.planetFocusView(id, 1280);
    novi.root.position.copy(focus.noviPos);
    const p0 = novi.root.position.clone();
    motion.update(1.2, 1.2, engine);
    const p1 = novi.root.position.clone();
    assert.ok(p1.distanceTo(p0) > 0.5, `Novi should circle ${id}`);
    const center = planets[id].mesh.position;
    const minClearance = id === 'saturn' ? planets[id].radius * 2.25 : planets[id].radius;
    assert.ok(p1.distanceTo(center) > minClearance, `Novi stays clear of ${id}`);
  }
  engine.paused = true;
  const frozen = novi.root.position.clone();
  motion.update(2, 3.2, engine);
  assert.ok(novi.root.position.equals(frozen));
});

test('rotation and orbit respect reduced motion; navigation locks the Moon and home resumes it', () => {
  const { earth, moon, motion, engine } = setup();
  const start = moon.position.clone();
  motion.update(1, 1, engine); assert.ok(moon.position.distanceTo(start) > 0.1); assert.ok(earth.rotation.y > 0);
  const locked = moon.position.clone(), rotation = earth.rotation.y;
  engine.paused = true; motion.update(10, 11, engine);
  assert.ok(moon.position.equals(locked)); assert.equal(earth.rotation.y, rotation);
  engine.paused = false; motion.setIdle(false); motion.update(3, 14, engine);
  assert.ok(moon.position.equals(locked)); assert.ok(earth.rotation.y > rotation);
  motion.setIdle(true); motion.update(0, 14, engine); assert.ok(moon.position.equals(locked));
  motion.update(1, 15, engine); assert.ok(moon.position.distanceTo(locked) > 0.1);
  const slow = setup(), fast = setup();
  for (let i = 0; i < 900; i++) slow.motion.update(1 / 30, i / 30, slow.engine);
  for (let i = 0; i < 3600; i++) fast.motion.update(1 / 120, i / 120, fast.engine);
  assert.ok(slow.moon.position.distanceTo(fast.moon.position) < 1e-9);
});

test('visible Novi hover leaves navigation coordinates intact and eases out during travel', () => {
  const novi = createNovi(), hull = novi.root.children[0], scene = new THREE.Scene(); scene.add(novi.root);
  novi.root.position.set(2, 3, 4); const root = novi.root.position.clone();
  novi.update(Math.PI / 3); assert.ok(hull.position.y > 0.2); assert.ok(novi.root.position.equals(root));
  novi.setMoving(true);
  for (let i = 0; i < 120; i++) novi.update(2 + i / 60, false, 1 / 60);
  assert.ok(Math.abs(hull.position.y) <= 0.036); assert.ok(novi.root.position.equals(root));
  novi.update(5, true, 0); assert.equal(hull.position.y, 0); assert.equal(hull.position.x, 0); assert.equal(hull.rotation.x, 0);
  disposeScene(scene);
});

test('Novi banks inward toward orbited planet and responds with inertial spring banking during turns', () => {
  const { novi, planets, motion, engine } = setupSolarSystem(1280, 720);
  motion.setIdle(false);
  motion.resetVisitOrbit();
  motion.visitingPlanet = 'mars';
  const focus = motion.planetFocusView('mars', 1280);
  assert.ok(focus.noviQuaternion && focus.noviTangent);
  motion.update(0.1, 0.1, engine);
  const upWorld = new THREE.Vector3(0, 1, 0).applyQuaternion(novi.root.quaternion);
  const inward = planets.mars.mesh.position.clone().sub(novi.root.position).normalize();
  assert.ok(upWorld.dot(inward) > 0.15, 'Novi roof/up axis tilts inward into the orbital turn');

  const craft = createNovi(), hull = craft.root.children[0], scene = new THREE.Scene(); scene.add(craft.root);
  craft.setMoving(true);
  for (let i = 0; i < 20; i++) {
    craft.root.position.set(Math.sin(i * 0.08) * 5, 0, Math.cos(i * 0.08) * 5);
    craft.root.rotation.y = i * 0.08 + Math.PI / 2;
    craft.update(i / 60, false, 1 / 60);
  }
  assert.ok(Math.abs(hull.rotation.z) > 0.04, 'Hull banks smoothly during turning flight');
  disposeScene(scene);
});
