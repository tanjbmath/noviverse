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
  const ringGeo = Array.from({ length: 160 }, (_, i) => orbitOffset(i / 160 * Math.PI * 2));
  const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringGeo), new THREE.LineBasicMaterial({ color: '#527089', transparent: true, opacity: 0.16 })); scene.add(orbit);
  return {
    kind: 'space', scene, novi, earth, moon, sun, targets: [earth, moon, sun],
    labels: [
      { id: 'earth', text: 'Earth', sub: 'Our blue home', object: earth, offset: new THREE.Vector3(0, -3.45, 0) },
      { id: 'moon', text: 'The Moon', sub: 'Land & explore', object: moon, offset: new THREE.Vector3(0, -1.1, 0) },
      { id: 'sun', text: 'The Sun', sub: 'Meet our star', object: sun, offset: new THREE.Vector3(0, -0.8, 0) },
    ],
    ...createSpaceMotion({ earth, air, moon, sun, novi, orbit }),
  };
}

// An artistic inclined orbit, independent of Earth's axial spin (150 seconds per lap).
function orbitOffset(phase) {
  return new THREE.Vector3(Math.cos(phase), Math.sin(phase) * Math.cos(0.45), -Math.sin(phase) * Math.sin(0.45));
}

export function createSpaceMotion({ earth, air, moon, sun, novi, orbit }) {
  let phase = 0.65, idle = true, radius = 5.05;
  const placeMoon = () => moon.position.copy(earth.position).addScaledVector(orbitOffset(phase), radius);
  return {
    setIdle(value) { idle = value; },
    resize(engine, width = innerWidth, height = innerHeight) {
      const mobile = width < 760;
      radius = mobile ? 3.8 : 5.05;
      earth.position.set(mobile ? 0.8 : 2.6, mobile ? -1.5 : 0.2, 0); earth.scale.setScalar(mobile ? 0.8 : 1);
      air.position.copy(earth.position); air.scale.copy(earth.scale);
      moon.scale.setScalar(mobile ? 0.8 : 1); placeMoon();
      orbit.position.copy(earth.position); orbit.scale.setScalar(radius);
      const lookX = 0.8;
      // Fit the whole orbit, including the Moon and its node, on narrow screens.
      const halfWidth = radius + 0.85 * moon.scale.x + 0.7 + Math.abs(earth.position.x - lookX);
      const fitDistance = halfWidth / (Math.tan(engine.camera.fov * Math.PI / 360) * engine.camera.aspect) + radius * Math.sin(0.45);
      const lookY = mobile ? -0.5 : 0.4;
      const halfHeight = radius * Math.cos(0.45) + 0.85 * moon.scale.x + (mobile ? 0.83 : 1.1) + Math.abs(earth.position.y - lookY);
      const verticalFit = halfHeight / (Math.tan(engine.camera.fov * Math.PI / 360) * Math.max(0.2, 1 - 200 / height)) + radius * Math.sin(0.45);
      engine.camera.position.set(0, 1.4, Math.max(mobile ? 30 : 19, fitDistance, verticalFit));
      engine.look.set(lookX, lookY, 0);
      sun.position.set(mobile ? 4.8 : 10, mobile ? 6.5 : 6, -5);
      novi.root.position.set(mobile ? -2 : -2.9, mobile ? -3 : -1.7, 4.6); novi.root.scale.setScalar(mobile ? 0.6 : 0.9);
      this.labels[0].offset.y = mobile ? -2.9 : -3.45;
      this.labels[1].offset.y = mobile ? -0.83 : -1.1;
    },
    update(dt, time, engine) {
      if (!engine.paused) {
        earth.rotation.y += dt * 0.055;
        if (idle) { phase = (phase + dt * Math.PI * 2 / 150) % (Math.PI * 2); placeMoon(); }
      }
      novi.update(time, engine.paused, dt);
    },
  };
}
