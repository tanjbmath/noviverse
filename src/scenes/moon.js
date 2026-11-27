import * as THREE from 'three';
import { makeGrain, loadTexture } from '../core/assets.js';
import { createNovi } from '../models/novi.js';
import { seededRandom } from '../core/math.js';
import { starfield, atmosphere, beacon } from './shared.js';
import { discoveries, moonPoiIds } from '../data/discoveries.js';

// Local artistic diorama: the named craters are not positioned at survey scale.
export const craterShapes = [{ x: 0, z: 0, radius: 5.6, depth: 1.9, rim: 0.8 }, { x: -10, z: -9, radius: 2.45, depth: 0.8, rim: 0.4 }];
export function terrainHeight(x, z) {
  let h = Math.sin(x * 0.47 + z * 0.13) * 0.09 + Math.cos(z * 0.71) * 0.08;
  for (const c of craterShapes) {
    const d = Math.hypot(x - c.x, z - c.z), r = d / c.radius;
    h += -c.depth * Math.max(0, 1 - r ** 2) + c.rim * Math.exp(-(((r - 1) / 0.12) ** 2));
    if (c.radius > 4) {
      h += 1.75 * Math.exp(-((d / 0.95) ** 2));
      // Artistic slump terraces, deliberately non-surveyed and vertically exaggerated.
      h += 0.11 * Math.sin(r * 55) * Math.exp(-(((r - 0.83) / 0.15) ** 2));
    }
  }
  return h;
}

export function overviewPosition(width, height) {
  const mobile = width < 760;
  // Keep the outer discovery nodes in view when the viewport is tall and narrow.
  const distance = mobile ? Math.max(1, 0.75 * height / width) : 1;
  return new THREE.Vector3(mobile ? 24 : 22, mobile ? 24 : 17, mobile ? 35 : 27).multiplyScalar(distance);
}

export async function createMoon(engine) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#080d19'); scene.fog = new THREE.FogExp2('#111726', 0.012); scene.add(starfield(800));
  const grain = makeGrain(42); grain.repeat.set(24, 24);
  const terrain = new THREE.PlaneGeometry(95, 95, 190, 190); terrain.rotateX(-Math.PI / 2);
  const positions = terrain.attributes.position, colors = [];
  const random = seededRandom(53);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i), height = terrainHeight(x, z);
    positions.setY(i, height);
    const noise = random() * 0.06, shade = 0.52 + Math.max(-0.12, height * 0.07) + noise;
    const c = new THREE.Color().setRGB(shade * 0.98, shade, shade * 1.04); colors.push(c.r, c.g, c.b);
  }
  terrain.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); terrain.computeVertexNormals();
  const ground = new THREE.Mesh(terrain, new THREE.MeshStandardMaterial({ map: grain, bumpMap: grain, bumpScale: 0.075, roughness: 1, vertexColors: true })); scene.add(ground);
  const sunlight = new THREE.DirectionalLight('#fff1dc', 3.4); sunlight.position.set(-13, 10, 7); scene.add(sunlight);
  scene.add(new THREE.HemisphereLight('#a3bcdb', '#23212a', 0.55));

  // Hand-shaped scattered debris with per-face variation; shared geometry/materials.
  const rockGeometry = new THREE.DodecahedronGeometry(1, 1);
  const rp = rockGeometry.attributes.position;
  for (let i = 0; i < rp.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(rp, i); v.multiplyScalar(0.88 + Math.sin(v.x * 14 + v.z * 8) * 0.13); rp.setXYZ(i, v.x, v.y, v.z); }
  rockGeometry.computeVertexNormals();
  const rockTexture = makeGrain(710, 128, 130); rockTexture.repeat.set(2, 2);
  const rockMat = new THREE.MeshStandardMaterial({ color: '#8c8d95', map: rockTexture, bumpMap: rockTexture, bumpScale: 0.12, roughness: 1, flatShading: true });
  const debris = new THREE.InstancedMesh(rockGeometry, rockMat, 200); const dummy = new THREE.Object3D();
  for (let i = 0; i < 200; i++) {
    const angle = random() * Math.PI * 2, radius = 6.8 + random() * 24;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius, s = 0.07 + random() ** 3 * 0.45;
    dummy.position.set(x, terrainHeight(x, z) + s * 0.25, z); dummy.rotation.set(random() * 3, random() * 6, random() * 3); dummy.scale.set(s * 1.4, s, s); dummy.updateMatrix(); debris.setMatrixAt(i, dummy.matrix);
  }
  scene.add(debris);
  const earthMap = await loadTexture('earth.jpg', engine.renderer);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1.15, 40, 24), new THREE.MeshStandardMaterial({ map: earthMap, roughness: 0.8 })); earth.position.set(12, 12, -42); earth.rotation.z = -0.25; scene.add(earth);
  const air = atmosphere(1.19); air.position.copy(earth.position); scene.add(air);
  const labels = [], targets = [], beacons = [];
  for (const id of moonPoiIds) {
    const data = discoveries[id], position = new THREE.Vector3(...data.position); position.y = terrainHeight(position.x, position.z);
    const group = new THREE.Group(); group.position.copy(position); group.userData.poi = id; scene.add(group);
    if (data.icon === 'rock') {
      const boulderMat = rockMat.clone(); boulderMat.color.set(id === 'anorthosite' ? '#e4dfd1' : '#797b87');
      const boulder = new THREE.Mesh(rockGeometry, boulderMat); boulder.scale.set(0.9, 0.65, 0.7); boulder.position.y = 0.4; boulder.rotation.set(0.2, 0.5, 0.1); group.add(boulder);
      const chips = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.055, 0), new THREE.MeshStandardMaterial({ color: id === 'breccia' ? '#d7d3c9' : '#f6eee0', roughness: 1 }), 34);
      for (let j = 0; j < 34; j++) {
        const theta = random() * Math.PI * 2, y = random() * 1.5 - 0.7, r = Math.sqrt(1 - y * y);
        dummy.position.set(Math.cos(theta) * r * 0.79, 0.4 + y * 0.58, Math.sin(theta) * r * 0.65); dummy.scale.setScalar(0.5 + random()); dummy.rotation.set(random(), random(), random()); dummy.updateMatrix(); chips.setMatrixAt(j, dummy.matrix);
      } group.add(chips);
    } else if (id === 'gravity') {
      const metal = new THREE.MeshStandardMaterial({ color: '#d9e2e4', metalness: 0.45, roughness: 0.3 });
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.9, 0.15, 32), metal); group.add(foot);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 1.7, 12), metal); mast.position.y = 0.9; group.add(mast);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.7), new THREE.MeshStandardMaterial({ color: '#18647b', metalness: 0.4, roughness: 0.3 })); panel.position.set(0, 1.6, 0); panel.rotation.z = -0.25; group.add(panel);
      for (let i = -2; i <= 2; i++) { const line = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.69), metal); line.position.x = i * 0.18; panel.add(line); }
    } else {
      // Large invisible selection volume makes the actual crater clickable via raycasting.
      const volume = new THREE.Mesh(new THREE.CylinderGeometry(id === 'tycho' ? 5.7 : 2.5, id === 'tycho' ? 5.7 : 2.5, 1, 40), new THREE.MeshBasicMaterial({ visible: false }));
      group.add(volume);
    }
    const marker = beacon(position.clone().add(new THREE.Vector3(0, id === 'tycho' ? 1.8 : 0.9, 0))); scene.add(marker); beacons.push(marker);
    labels.push({ id, text: data.short, sub: data.icon === 'crater' ? 'Real lunar feature' : data.icon === 'rock' ? 'Representative sample' : 'Try an experiment', object: group, offset: new THREE.Vector3(0, id === 'tycho' ? 2.2 : 1.3, 0) });
    targets.push(group);
  }
  const novi = createNovi(); novi.root.scale.setScalar(0.72); novi.root.position.set(0, 3, 12); scene.add(novi.root);
  const fill = new THREE.PointLight('#89f8e6', 5, 8); fill.position.set(0, 2, 1); novi.root.add(fill);
  return {
    kind: 'moon', scene, novi, labels, targets, terrainHeight,
    overviewPosition() { return overviewPosition(innerWidth, innerHeight); },
    overview(engine) {
      engine.camera.position.copy(this.overviewPosition());
      engine.look.set(0, 0, -0.5);
    },
    resize(engine) { if (!this.visiting) this.overview(engine); },
    update(dt, time, engine) {
      novi.update(time, engine.paused, dt);
      beacons.forEach((b, i) => { b.children[0].scale.setScalar(1 + (engine.paused ? 0 : Math.sin(time * 2 + i) * 0.13)); });
    },
  };
}
