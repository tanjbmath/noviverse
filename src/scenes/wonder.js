import * as THREE from 'three';
import { createNovi } from '../models/novi.js';
import { wonders } from '../data/wonders.js';

export const ART_WIDTH = 36, ART_HEIGHT = 24;
export const artworkPoint = ([u, v]) => new THREE.Vector3((u - .5) * ART_WIDTH, (.5 - v) * ART_HEIGHT, -5);
// A scenic illustration with a volumetric animated character: intentionally 2.5D.
export function wonderView(width, height, feature = null) {
  const mobile = width < 760, tan = Math.tan(43 * Math.PI / 360), aspect = width / height;
  if (!feature) {
    const look = new THREE.Vector3(0, mobile ? 2.5 : 1, 0);
    return { look, position: look.clone().add(new THREE.Vector3(0, 0, 25)) };
  }
  const depth = 22; // closer to the selected depicted feature than the 30-unit overview.
  const top = 90, bottom = mobile ? 60 + height * (height <= 730 ? .46 : .45) : 60;
  const look = artworkPoint(feature.uv);
  look.y += depth * tan * (top - bottom) / height;
  if (!mobile) look.x += depth * tan * aspect * 410 / width;
  return { look, position: look.clone().add(new THREE.Vector3(0, 0, depth)) };
}

export async function createWonder(siteId, engine, options = {}) {
  const data = wonders[siteId];
  if (!data) throw new RangeError('Unknown Earth wonder');
  const texture = options.texture || await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}wonders/${data.image}`);
  texture.colorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0c1d23');
  const art = new THREE.Mesh(new THREE.PlaneGeometry(ART_WIDTH, ART_HEIGHT), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
  art.position.z = -5; scene.add(art);
  scene.add(new THREE.HemisphereLight('#eef8ff', data.color, 2.3));
  const key = new THREE.DirectionalLight('#fff2d9', 3); key.position.set(-5, 8, 12); scene.add(key);
  const novi = createNovi(); novi.root.scale.setScalar(.62); scene.add(novi.root);
  const labels = data.features.map(feature => {
    const pick = new THREE.Mesh(new THREE.SphereGeometry(.32, 16, 12), new THREE.MeshBasicMaterial({ visible: false }));
    pick.position.copy(artworkPoint(feature.uv)); pick.position.z += .1; pick.userData.poi = feature.id; scene.add(pick);
    return { id: feature.id, text: feature.title, object: pick, offset: new THREE.Vector3() };
  });
  const world = {
    kind: 'wonder', siteId, data, region: data.region, scene, art, novi, labels, targets: labels.map(l => l.object), visiting: null,
    view(width = innerWidth, height = innerHeight) { return wonderView(width, height, this.visiting); },
    overviewPose(width = innerWidth, height = innerHeight) { return new THREE.Vector3(width < 760 ? -1.7 : -3.5, width < 760 || height < 500 ? -3 : -4, 4); },
    resize(e, width = innerWidth, height = innerHeight) {
      const view = this.view(width, height); e.camera.position.copy(view.position); e.look.copy(view.look);
      if (!this.visiting) novi.root.position.copy(this.overviewPose(width, height));
    },
    async focus(id, e, seconds, signal) {
      if (signal?.aborted) return false;
      const feature = id ? data.features.find(f => f.id === id) : null;
      if (id && !feature) return false;
      this.visiting = feature;
      const view = this.view(), from = novi.root.position.clone(), to = this.overviewPose();
      if (feature) to.x = Math.max(-3.7, Math.min(3.7, artworkPoint(feature.uv).x * .65));
      novi.setMoving(true);
      const walk = e.animate(seconds, t => {
        novi.root.position.lerpVectors(from, to, t);
        novi.root.rotation.y = t < .9 && Math.abs(to.x - from.x) > .1 ? Math.sign(to.x - from.x) * Math.PI / 2 : .12;
      }, signal);
      const camera = e.view(view.position, view.look, seconds, signal);
      await Promise.all([walk, camera]);
      return !signal?.aborted;
    },
    update(dt, time, e) { novi.update(time, e.paused, dt); },
  };
  // Construction never writes to the active camera, even after interrupted loading.
  return world;
}
