import test from 'node:test';
import assert from 'node:assert/strict';
import { GRAVITY, fallTime, fallDistance, impactEnergy, seededRandom } from '../src/core/math.js';
import { discoveries, moonPoiIds, sources } from '../src/data/discoveries.js';
import { terrainHeight } from '../src/scenes/moon.js';

test('ideal drops use physical time and land together independent of mass', () => {
  assert.ok(Math.abs(fallTime(5, GRAVITY.earth) - 1.00963755) < 1e-6);
  assert.ok(Math.abs(fallTime(5, GRAVITY.moon) - 2.48451997) < 1e-6);
  assert.ok(Math.abs(fallTime(20, GRAVITY.earth) / fallTime(5, GRAVITY.earth) - 2) < 1e-12);
  assert.equal(fallDistance(20, GRAVITY.moon, 5), 5);
  assert.equal(fallDistance(-1, GRAVITY.moon, 5), 0);
  assert.throws(() => fallTime(0, 9.81), RangeError);
  assert.throws(() => fallTime(5, -1), RangeError);
});
test('energy uses SI units and the square of velocity', () => {
  assert.equal(impactEnergy(1000, 5000), 12.5e9);
  assert.equal(impactEnergy(1000, 10000) / impactEnergy(1000, 5000), 4);
  assert.equal(impactEnergy(1000, 20000), 200e9);
});
test('every implemented discovery has primary sources and every Moon target has a stop', () => {
  for (const [id, d] of Object.entries(discoveries)) {
    assert.ok(d.explanation && d.fact && d.detail, id);
    for (const source of d.sourceIds) assert.match(sources[source][1], /^https:\/\//);
  }
  for (const id of moonPoiIds) {
    const d = discoveries[id];
    assert.equal(d.position.length, 3); assert.equal(d.stop.length, 3);
    assert.ok(Number.isFinite(terrainHeight(d.stop[0], d.stop[2])));
  }
  assert.equal(discoveries.tycho.stats[0][0], '85.29 km');
  assert.equal(discoveries.tychoA.stats[0][0], '28.96 km');
});
test('terrain has an excavated bowl, raised rim, finite traversable surface', () => {
  assert.ok(terrainHeight(3, 0) < -1);
  assert.ok(terrainHeight(5.6, 0) > 0.4);
  for (let x = -30; x <= 30; x += 2) for (let z = -30; z <= 30; z += 2) assert.ok(Number.isFinite(terrainHeight(x, z)));
});
test('procedural artwork is deterministic', () => {
  const a = seededRandom(9), b = seededRandom(9);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});
