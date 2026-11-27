import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSun } from '../src/models/sun.js';
import { createSolarScene, solarView } from '../src/scenes/sun.js';
import { disposeScene } from '../src/core/dispose.js';
import { sunPoiIds, discoveries } from '../src/data/discoveries.js';

test('solar nodes stay reachable and above/alongside discovery panels at different screen sizes', () => {
  const world = createSolarScene();
  for (const [width, height] of [[1280, 720], [1920, 1080], [390, 844], [390, 650], [360, 640], [760, 844], [844, 390]]) {
    const camera = new THREE.PerspectiveCamera(43, width / height, .1, 1200);
    for (const discovery of [false, true]) {
      const view = solarView(width, height, discovery);
      camera.position.copy(view.position); camera.lookAt(view.look); camera.updateMatrixWorld();
      for (const { object, id } of world.labels) {
        const p = object.position.clone().project(camera);
        const x = (p.x + 1) * width / 2, y = (1 - p.y) * height / 2;
        assert.ok(x >= 25 && x <= width - 25 && y >= 88 && y <= height - 60, `${id}: ${width}x${height} ${discovery} (${x},${y})`);
        if (discovery && width < 760) assert.ok(y + 22 < height - 60 - height * (height <= 730 ? .46 : .45), `${id} behind phone panel`);
        if (discovery && width >= 760) assert.ok(x + 22 < width - 424, `${id} behind desktop panel`);
      }
    }
  }
  disposeScene(world.scene);
});

test('Sun pick targets agree with science nodes and the glare never intercepts picking', () => {
  const world = createSolarScene(); world.scene.updateMatrixWorld(true);
  assert.deepEqual(world.labels.map(x => x.id), sunPoiIds);
  for (const { object, id } of world.labels) {
    assert.ok(discoveries[id].sourceIds.includes('sun'));
    const origin = object.position.clone(); origin.z = 20;
    const ray = new THREE.Raycaster(origin, new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObjects(world.targets, true)[0];
    assert.equal(hit?.object.userData.poi, id, `direct pick for ${id}`);
  }
  const ray = new THREE.Raycaster(new THREE.Vector3(7, 0, 20), new THREE.Vector3(0, 0, -1));
  assert.equal(ray.intersectObject(world.solar.root, true).length, 0);
  disposeScene(world.scene);
});

test('solar animation uses engine time, preserves the craft coordinates, and frees GPU resources', () => {
  const world = createSolarScene(), camera = new THREE.PerspectiveCamera();
  const engine = { camera, paused: false }, origin = world.novi.root.position.clone();
  world.update(.016, 8, engine);
  assert.equal(world.solar.surface.material.uniforms.time.value, 8);
  engine.paused = true; world.update(0, 8, engine);
  assert.equal(world.solar.glare.material.uniforms.time.value, 8);
  assert.ok(world.novi.root.position.equals(origin));
  world.scene.updateMatrixWorld(true);
  world.novi.root.traverse(part => assert.ok(part.matrixWorld.elements.every(Number.isFinite)));
  let geometryDisposals = 0, materialDisposals = 0;
  world.solar.surface.geometry.addEventListener('dispose', () => geometryDisposals++);
  world.solar.glare.material.addEventListener('dispose', () => materialDisposals++);
  disposeScene(world.scene);
  assert.equal(geometryDisposals, 1); assert.equal(materialDisposals, 1); assert.equal(world.scene.children.length, 0);
  const small = createSun(.55, { detail: false });
  assert.equal(small.loops.length, 0); assert.equal(small.surface.material.uniforms.spots.value, 0);
  const scene = new THREE.Scene(); scene.add(small.root); disposeScene(scene);
});
