import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createNovi } from '../src/models/novi.js';
import { disposeScene } from '../src/core/dispose.js';

test('Novi remains a living rocket with visible cockpit, fins, thruster and scanning equipment', () => {
  const novi = createNovi();
  const scene = new THREE.Scene(); scene.add(novi.root);
  const port = novi.root.getObjectByName('Port engine pivot');
  const starboard = novi.root.getObjectByName('Starboard engine pivot');
  assert.ok(port && starboard);
  for (const name of ['Rounded ivory fuselage', 'Expressive blue cockpit', 'Novi eyes', 'Coral swept fin', 'Ignited thruster', 'Exhaust particles']) assert.ok(novi.root.getObjectByName(name), name);
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    novi.setTransform(t); novi.setMoving(true); novi.setScanning(true); novi.update(3);
    assert.equal(port.rotation.x, 0);
    assert.equal(starboard.rotation.x, 0);
    assert.equal(novi.root.getObjectByName('Scanning ring').visible, true);
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
