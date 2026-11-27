import * as THREE from 'three';
import { loadTexture } from '../core/assets.js';
import { createNovi } from '../models/novi.js';
import { atmosphere, starfield } from './shared.js';

export async function createSpace(engine) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#070d1c'); scene.add(starfield());
  const [earthMap, moonMap] = await Promise.all([loadTexture('earth.jpg', engine.renderer), loadTexture('moon.jpg', engine.renderer)]);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(3.25, 80, 56), new THREE.MeshStandardMaterial({ map: earthMap, roughness: 0.83, metalness: 0.02 }));
  earth.position.set(2.6, 0.2, 0); earth.rotation.set(0.08, 3.2, -0.12); earth.userData.poi = 'earth'; scene.add(earth);
  const air = atmosphere(3.34); air.position.copy(earth.position); scene.add(air);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.85, 48, 32), new THREE.MeshStandardMaterial({ map: moonMap, roughness: 1 }));
  moon.position.set(6.65, 2.65, -1.4); moon.rotation.y = -0.6; moon.userData.poi = 'moon'; scene.add(moon);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.55, 40, 24), new THREE.MeshBasicMaterial({ color: '#ffe4a3' }));
  sun.position.set(10, 6, -5); sun.userData.poi = 'sun'; scene.add(sun);
  for (let i = 0; i < 5; i++) { const glow = atmosphere(0.62 + i * 0.14, '#ffa353', 0.28 / (i + 1)); sun.add(glow); }
  const key = new THREE.DirectionalLight('#fff3d6', 3.2); key.position.set(-6.5, 6.5, 8); scene.add(key);
  const fill = new THREE.DirectionalLight('#78c9f9', 0.9); fill.position.set(3, 2, 12); scene.add(fill);
  scene.add(new THREE.AmbientLight('#9eafc8', 0.14));
  const shipLight = new THREE.PointLight('#a4f9ed', 7, 7); shipLight.position.set(-3, 2, 8); scene.add(shipLight);
  const novi = createNovi(); novi.root.position.set(-2.9, -1.7, 4.6); novi.root.rotation.set(0.06, -0.33, -0.08); novi.root.scale.setScalar(0.9); scene.add(novi.root);
  const ringGeo = new THREE.EllipseCurve(2.6, 0.2, 5.15, 1.5, 0, Math.PI * 2).getPoints(160).map(p => new THREE.Vector3(p.x, -2.4, p.y - 1));
  const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringGeo), new THREE.LineBasicMaterial({ color: '#527089', transparent: true, opacity: 0.16 })); scene.add(orbit);
  return {
    kind: 'space', scene, novi, earth, moon, sun, targets: [earth, moon, sun],
    labels: [
      { id: 'earth', text: 'Earth', sub: 'Our blue home', object: earth, offset: new THREE.Vector3(0, -3.45, 0) },
      { id: 'moon', text: 'The Moon', sub: 'Land & explore', object: moon, offset: new THREE.Vector3(0, -1.1, 0) },
      { id: 'sun', text: 'The Sun', sub: 'Meet our star', object: sun, offset: new THREE.Vector3(0, -0.8, 0) },
    ],
    resize(engine) {
      const mobile = innerWidth < 760;
      engine.camera.position.set(0, 1.4, mobile ? 24.5 : 19);
      engine.look.set(mobile ? 0 : 0.8, 0.4, 0);
      earth.position.set(mobile ? 0.8 : 2.6, mobile ? -1.5 : 0.2, 0); earth.scale.setScalar(mobile ? 0.8 : 1);
      air.position.copy(earth.position); air.scale.copy(earth.scale);
      moon.position.set(mobile ? -2.1 : 6.65, mobile ? 0.1 : 2.65, -1.4); moon.scale.setScalar(mobile ? 0.8 : 1);
      sun.position.set(mobile ? 3.3 : 10, mobile ? 1.2 : 6, -5);
      novi.root.position.set(mobile ? -2 : -2.9, mobile ? -3 : -1.7, 4.6); novi.root.scale.setScalar(mobile ? 0.6 : 0.9);
      this.labels[0].offset.y = mobile ? -2.9 : -3.45;
      this.labels[1].offset.y = mobile ? -0.83 : -1.1;
    },
    update(dt, time, engine) {
      if (!engine.paused) earth.rotation.y += dt * 0.028;
      novi.update(time, engine.paused);
    },
  };
}
