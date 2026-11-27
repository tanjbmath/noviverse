import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSpaceMotion } from '../src/scenes/space.js';
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
