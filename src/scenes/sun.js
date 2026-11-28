import * as THREE from 'three';
import { createSun, SUNSPOT_DIRECTION } from '../models/sun.js';
import { createNovi } from '../models/novi.js';
import { starfield } from './shared.js';

export const solarStops = {
  photosphere: new THREE.Vector3(.5, -1.15, 3.8),
  sunspots: SUNSPOT_DIRECTION.clone().multiplyScalar(4.02),
  prominence: new THREE.Vector3(4.72, 3.52, .65),
  corona: new THREE.Vector3(-4.65, -1.9, .4),
};

export function solarView(width, height, discovery = false) {
  const mobile = width < 760, aspect = width / height;
  const tan = Math.tan(43 * Math.PI / 360);
  // In discovery mode, keep the star in the free region above/beside the panel.
  const top = mobile ? (discovery ? 82 : 220) : 100;
  const bottom = mobile && discovery ? 60 + height * (height <= 730 ? .46 : .45) : 65;
  const usableHeight = Math.max(125, height - top - bottom);
  const availableWidth = width - (discovery && !mobile ? 430 : 40);
  const distance = Math.max(19, 6.4 / (tan * aspect * availableWidth / width), 6.4 / (tan * usableHeight / height));
  const look = new THREE.Vector3(
    discovery && !mobile ? distance * tan * aspect * 410 / width : mobile ? 0 : -1.3,
    distance * tan * (top - bottom) / height, 0,
  );
  // Parallel z view makes framing predictable at every viewport shape.
  return { position: look.clone().add(new THREE.Vector3(0, 0, distance)), look };
}

export function createSolarScene() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#100b13');
  const stars = starfield(600); scene.add(stars);
  const solar = createSun(); scene.add(solar.root);
  solar.surface.userData.poi = 'photosphere';
  const novi = createNovi(); novi.root.position.set(-5, -3.7, 5); novi.root.rotation.set(.04, .35, -.08); novi.root.scale.setScalar(.65); scene.add(novi.root);
  const light = new THREE.PointLight('#ffc18b', 90, 35, 1); light.position.set(0, 0, 5); scene.add(light);
  const fill = new THREE.DirectionalLight('#b5e9ee', 2); fill.position.set(-5, 4, 10); scene.add(fill);
  scene.add(new THREE.AmbientLight('#e3c7b2', .6));
  const labels = Object.entries(solarStops).map(([id, point]) => {
    const anchor = new THREE.Object3D(); anchor.position.copy(point); scene.add(anchor);
    return { id, text: ({ photosphere: 'The photosphere', sunspots: 'Sunspots', prominence: 'A solar prominence', corona: 'The corona' })[id], object: anchor, offset: new THREE.Vector3() };
  });
  // Invisible pick volumes cover the spot and the off-limb corona; other points
  // can be selected on the surface or actual prominence strands as well as nodes.
  const targets = [solar.surface, ...solar.loops];
  for (const id of ['sunspots', 'corona']) {
    const pick = new THREE.Mesh(new THREE.SphereGeometry(id === 'corona' ? .45 : .48, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    pick.position.copy(solarStops[id]); pick.userData.poi = id; scene.add(pick); targets.push(pick);
  }
  return {
    kind: 'sun', scene, novi, solar, targets, labels, visiting: false,
    view(discovery = false, width = innerWidth, height = innerHeight) { return solarView(width, height, discovery); },
    resize(engine, width = innerWidth, height = innerHeight) {
      const view = this.view(this.visiting, width, height);
      engine.camera.position.copy(view.position); engine.look.copy(view.look);
      novi.root.scale.setScalar(width < 760 ? .48 : .65);
    },
    update(dt, time, engine) { solar.update(time, engine.camera); novi.update(time, engine.paused, dt); stars.update(time, engine.paused, dt); },
  };
}
