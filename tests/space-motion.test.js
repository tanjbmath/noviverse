import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  compressedOrbitPeriod,
  createSpaceMotion,
  EARTH_ORBIT_SECONDS,
  SOLAR_PLANETS,
  SolarControls,
} from '../src/scenes/space.js';
import { starfield } from '../src/scenes/shared.js';
import { createNovi } from '../src/models/novi.js';
import { disposeScene } from '../src/core/dispose.js';
import { discoveries } from '../src/data/discoveries.js';

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

test('Novi enters planet orbit along its incoming flight direction without reversing', () => {
  const { novi, planets, motion, engine } = setupSolarSystem(1280, 720);
  motion.setIdle(false);
  const shipFrom = new THREE.Vector3(-12.5, -2.5, 19.5);
  for (const id of ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']) {
    const focus = motion.planetFocusView(id, 1280, shipFrom);
    motion.setVisitOrbit(focus.orbitAngle, focus.orbitDir);
    motion.visitingPlanet = id;
    const incoming = planets[id].mesh.position.clone().sub(shipFrom);
    incoming.y = 0;
    incoming.normalize();
    const orbitTan = focus.noviTangent.clone();
    orbitTan.y = 0;
    orbitTan.normalize();
    assert.ok(incoming.dot(orbitTan) > 0.75, `${id} entry tangent aligns forward with incoming flight (${incoming.dot(orbitTan).toFixed(2)})`);
    const p0 = focus.noviPos.clone();
    motion.update(0.25, 0.25, engine);
    const step = novi.root.position.clone().sub(p0).normalize();
    assert.ok(step.dot(focus.noviTangent) > 0.85, `${id} continues forward along entry tangent`);
  }
});

test('dynamic starfield creates layered GPU particles, animates when unpaused, ignores raycasts, and disposes cleanly', () => {
  const scene = new THREE.Scene();
  const stars = starfield(1200);
  scene.add(stars);

  const layers = stars.children.filter(c => c.isPoints);
  assert.equal(layers.length, 3);
  const totalParticles = layers.reduce((sum, l) => sum + l.geometry.getAttribute('position').count, 0);
  assert.equal(totalParticles, 1200);

  for (const layer of layers) {
    assert.equal(layer.material.isShaderMaterial, true);
    assert.equal(layer.material.uniforms.uTime.value, 0);
  }

  const raycaster = new THREE.Raycaster();
  raycaster.set(new THREE.Vector3(0, 0, 100), new THREE.Vector3(0, 0, -1));
  assert.equal(raycaster.intersectObject(stars, true).length, 0);

  stars.update(1.5, false, 0.04);
  for (const layer of layers) {
    assert.equal(layer.material.uniforms.uTime.value, 1.5);
  }
  assert.ok(layers[0].rotation.y > 0);
  assert.ok(layers[2].rotation.y < 0);

  const frozenRotY = layers[2].rotation.y;
  stars.update(4.0, true, 0.05);
  assert.equal(layers[2].material.uniforms.uTime.value, 1.5);
  assert.equal(layers[2].rotation.y, frozenRotY);

  disposeScene(scene);
});

test('planet orbit periods follow gently compressed real astronomical proportions anchored at Earth = 30s', () => {
  assert.equal(EARTH_ORBIT_SECONDS, 30);
  const earthSpec = SOLAR_PLANETS.find(p => p.id === 'earth');
  assert.equal(earthSpec.period, 30);

  for (let i = 0; i < SOLAR_PLANETS.length; i++) {
    const p = SOLAR_PLANETS[i];
    assert.ok(Math.abs(p.period - compressedOrbitPeriod(p.realPeriodYears)) < 1e-12);
    if (i > 0) {
      const prev = SOLAR_PLANETS[i - 1];
      assert.ok(p.realPeriodYears > prev.realPeriodYears, `${p.id} real period slower than ${prev.id}`);
      assert.ok(p.period > prev.period, `${p.id} display period (${p.period.toFixed(1)}s) slower than ${prev.id} (${prev.period.toFixed(1)}s)`);
    }
  }

  const { planets, motion, engine } = setupSolarSystem(1280, 720);
  const startAngles = Object.fromEntries(
    SOLAR_PLANETS.map(p => [p.id, Math.atan2(planets[p.id].mesh.position.z, planets[p.id].mesh.position.x)]),
  );
  motion.update(2, 2, engine);
  const angularDeltas = SOLAR_PLANETS.map(p => {
    const end = Math.atan2(planets[p.id].mesh.position.z, planets[p.id].mesh.position.x);
    return ((end - startAngles[p.id]) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  });
  for (let i = 1; i < angularDeltas.length; i++) {
    assert.ok(
      angularDeltas[i] > 0 && angularDeltas[i] < angularDeltas[i - 1],
      `${SOLAR_PLANETS[i].id} angular rate (${angularDeltas[i].toFixed(4)}) should be slower than ${SOLAR_PLANETS[i - 1].id} (${angularDeltas[i - 1].toFixed(4)})`,
    );
  }
});

test('all 7 visited planets expose surface close-up data and closer camera/Novi framing', () => {
  const visitIds = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

  for (const id of visitIds) {
    const entry = discoveries[id];
    assert.ok(entry?.surface, `${id} should define surface close-up metadata`);
    assert.ok(typeof entry.surface.heading === 'string' && entry.surface.heading.length > 8, `${id} surface heading`);
    assert.ok(Array.isArray(entry.surface.stats) && entry.surface.stats.length >= 2, `${id} surface stats`);
    assert.ok(typeof entry.surface.explanation === 'string' && entry.surface.explanation.length > 40, `${id} surface explanation`);
    assert.ok(typeof entry.surface.clues === 'string' && entry.surface.clues.length > 20, `${id} surface clues`);
  }

  for (const [width, height] of [[1280, 720], [390, 844]]) {
    const { novi, planets, motion, engine } = setupSolarSystem(width, height);
    motion.setIdle(false);
    for (const id of visitIds) {
      const visitFocus = motion.planetFocusView(id, width);
      const surfFocus = motion.surfaceFocusView(id, width, { angle: visitFocus.orbitAngle, dir: visitFocus.orbitDir });
      const center = planets[id].mesh.position;
      const r = planets[id].radius * (width < 760 ? 1.25 : 1);

      const visitDist = visitFocus.position.distanceTo(center);
      const surfDist = surfFocus.position.distanceTo(center);
      assert.ok(surfDist < visitDist, `${id} @ ${width}: surface camera (${surfDist.toFixed(2)}) closer than orbit camera (${visitDist.toFixed(2)})`);
      assert.ok(surfDist > r * 1.4, `${id} @ ${width}: surface camera clears planet radius`);
      assert.ok(surfFocus.noviScale < visitFocus.noviScale, `${id} @ ${width}: Novi shrinks slightly for surface close-up`);
      if (id === 'saturn') {
        assert.ok(surfFocus.position.y > center.y + r * 0.5, `saturn @ ${width}: camera stays elevated above ring plane`);
      }

      motion.visitingPlanet = id;
      motion.visitingSurface = true;
      motion.setVisitOrbit(surfFocus.orbitAngle, surfFocus.orbitDir);
      novi.root.position.copy(surfFocus.noviPos);
      const p0 = novi.root.position.clone();
      motion.update(0.6, 0.6, engine);
      const p1 = novi.root.position.clone();
      assert.ok(p1.distanceTo(p0) > 0.05, `${id} @ ${width}: Novi glides smoothly during surface close-up`);
      assert.ok(p1.distanceTo(center) > r, `${id} @ ${width}: Novi stays outside planet surface`);
    }
  }
});

test('SolarControls allows tap picking when overview orbit is locked during planet visit', () => {
  const listeners = {};
  const fakeElement = {
    addEventListener(name, fn) { listeners[name] = fn; },
    removeEventListener(name) { delete listeners[name]; },
    setPointerCapture() {},
    releasePointerCapture() {},
  };
  let poseChanges = 0;
  const controls = new SolarControls(() => { poseChanges += 1; });
  controls.attach(fakeElement);
  controls.setEnabled(true);
  controls.setOrbitEnabled(false);

  const initialPose = { ...controls.pose };
  listeners.pointerdown({ pointerId: 1, button: 0, clientX: 200, clientY: 300 });
  assert.equal(controls.canPick({ pointerId: 1 }), true);

  // Small jitter inside drag threshold does not prevent click picking and does not orbit overview
  listeners.pointermove({ pointerId: 1, clientX: 202, clientY: 302 });
  assert.equal(controls.canPick({ pointerId: 1 }), true);

  // Larger drag still does not move locked overview pose
  listeners.pointermove({ pointerId: 1, clientX: 240, clientY: 340 });
  listeners.wheel({ deltaMode: 0, deltaY: 120, preventDefault() {} });
  assert.equal(poseChanges, 0);
  assert.deepEqual(controls.pose, initialPose);
  assert.equal(controls.canPick({ pointerId: 1 }), false);

  listeners.pointerup({ pointerId: 1 });
  controls.dispose();
});



