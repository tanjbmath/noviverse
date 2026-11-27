import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createNovi } from '../src/models/novi.js';
import { disposeScene } from '../src/core/dispose.js';

test('one detailed Novi rig transforms continuously into hover mode', () => {
  const novi = createNovi();
  const scene = new THREE.Scene(); scene.add(novi.root);
  const port = novi.root.getObjectByName('Port engine pivot');
  const starboard = novi.root.getObjectByName('Starboard engine pivot');
  assert.ok(port && starboard);
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    novi.setTransform(t); novi.setMoving(true); novi.setScanning(true); novi.update(3);
    assert.equal(port.rotation.x, -t * Math.PI / 2);
    assert.equal(starboard.rotation.x, -t * Math.PI / 2);
    scene.updateMatrixWorld(true);
    scene.traverse(object => assert.ok(object.matrixWorld.elements.every(Number.isFinite)));
  }
  disposeScene(scene); assert.equal(scene.children.length, 0);
});

test('shared geometry, material and texture are disposed once per scene', () => {
  const scene = new THREE.Scene(), geometry = new THREE.BoxGeometry(), texture = new THREE.Texture();
  const material = new THREE.MeshStandardMaterial({ map: texture, bumpMap: texture });
  scene.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));
  let g = 0, m = 0, t = 0;
  geometry.addEventListener('dispose', () => g++); material.addEventListener('dispose', () => m++); texture.addEventListener('dispose', () => t++);
  disposeScene(scene); assert.deepEqual([g, m, t], [1, 1, 1]);
});
