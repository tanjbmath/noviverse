import * as THREE from 'three';
import { loadTexture } from '../core/assets.js';
import { GlobeControls, longitudeDelta } from '../core/globe-controls.js';
import { createNovi } from '../models/novi.js';
import { atmosphere, starfield } from './shared.js';
import { continents, earthRegions, earthSites, globePose } from '../data/earth.js';

export const EARTH_RADIUS = 4.2;
export function geographicPoint(lat, lon, radius = EARTH_RADIUS) {
  const phi = lat * Math.PI / 180, theta = lon * Math.PI / 180;
  return new THREE.Vector3(radius * Math.cos(phi) * Math.cos(theta), radius * Math.sin(phi), -radius * Math.cos(phi) * Math.sin(theta));
}
export function globeFrame(pose, width, height, discovery = false) {
  const mobile = width < 760, tan = Math.tan(43 * Math.PI / 360), aspect = width / height;
  const top = mobile ? (discovery ? 90 : 235) : 100;
  const bottom = discovery && mobile ? 60 + height * (height <= 730 ? .46 : .45) : 135;
  const usableHeight = Math.max(135, height - top - bottom);
  const usableWidth = width - (discovery && !mobile ? 430 : 40);
  const fit = Math.max(16, 5.3 / (tan * aspect * usableWidth / width), 5.3 / (tan * usableHeight / height));
  // In a short landscape window, a continent view can crop the globe while keeping its stops large enough to tap.
  const detail = width >= 760 && height < 500 && !discovery ? Math.max(.55, 1 - (1 - pose.zoom) * 1.2) : 1;
  const distance = Math.max(EARTH_RADIUS + 5, fit * pose.zoom * detail);
  const normal = geographicPoint(pose.lat, pose.lon, 1);
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), normal).normalize();
  const up = new THREE.Vector3().crossVectors(normal, right).normalize();
  const look = up.clone().multiplyScalar(distance * tan * (top - bottom) / height);
  if (discovery && !mobile) look.addScaledVector(right, distance * tan * aspect * 410 / width);
  return { position: look.clone().addScaledVector(normal, distance), look, normal, right, up };
}
export function anchorVisible(point, cameraPosition) {
  return point.dot(cameraPosition.clone().sub(point)) > 0;
}

export async function createEarth(engine, options = {}) {
  const map = options.map || await loadTexture('earth.jpg', engine.renderer);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#06141f'); scene.add(starfield(700));
  const globe = new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS, 96, 64), new THREE.MeshStandardMaterial({ map, roughness: .88 }));
  scene.add(globe);
  const air = atmosphere(EARTH_RADIUS + .10, '#60c8ff', .6); scene.add(air);
  const key = new THREE.DirectionalLight('#fff3dc', 2.5); scene.add(key);
  scene.add(new THREE.AmbientLight('#c4e5f7', 1.5));
  const fill = new THREE.DirectionalLight('#a4d8ff', .6); scene.add(fill);
  const novi = createNovi(); novi.root.scale.setScalar(.48); scene.add(novi.root);
  const anchors = {};
  for (const data of [...continents.filter(c => c.available), ...Object.entries(earthSites).map(([id, d]) => ({ id, ...d }))]) {
    const object = new THREE.Object3D(); object.position.copy(geographicPoint(data.lat, data.lon, EARTH_RADIUS + .10)); scene.add(object);
    const pick = new THREE.Mesh(new THREE.SphereGeometry(.17, 16, 10), new THREE.MeshBasicMaterial({ visible: false }));
    pick.position.copy(object.position); pick.userData.poi = data.id; scene.add(pick);
    anchors[data.id] = { id: data.id, text: data.name || data.title, object, pick, offset: new THREE.Vector3(), visible: e => anchorVisible(object.position, e.camera.position) };
  }
  const controls = new GlobeControls(() => world.applyView(engine));
  const world = {
    kind: 'earth', scene, globe, novi, controls, region: null, visiting: false, labels: [], targets: [],
    setLevel(region) {
      this.region = region;
      const ids = region ? earthRegions[region].sites : continents.filter(c => c.available).map(c => c.id);
      this.labels = ids.map(id => anchors[id]);
      this.targets = [globe, ...this.labels.map(label => label.pick)];
    },
    setInteractive(value) { controls.setEnabled(value && !this.visiting); },
    activate() { controls.attach(engine.renderer.domElement); },
    deactivate() { controls.dispose(); },
    applyView(e, width = innerWidth, height = innerHeight) {
      const view = globeFrame(controls.pose, width, height, this.visiting);
      e.camera.position.copy(view.position); e.look.copy(view.look);
      // Headlight-style fill keeps geography readable while the user turns the globe.
      key.position.copy(view.normal).multiplyScalar(12).addScaledVector(view.up, 6).addScaledVector(view.right, -8);
      fill.position.copy(view.normal).multiplyScalar(8).addScaledVector(view.right, 10);
      novi.root.position.copy(view.normal).multiplyScalar(EARTH_RADIUS + 2.3).addScaledVector(view.right, -3.8).addScaledVector(view.up, -2.5);
      novi.root.lookAt(new THREE.Vector3());
    },
    resize(e, width = innerWidth, height = innerHeight) {
      this.applyView(e, width, height); novi.root.scale.setScalar(width < 760 ? .34 : .48);
    },
    async focus(id, e, seconds, signal) {
      const site = earthSites[id], region = earthRegions[id];
      const goal = site || region || globePose;
      this.visiting = !!site;
      this.setLevel(site ? site.region : region ? id : null);
      const from = { ...controls.pose }, turn = longitudeDelta(from.lon, goal.lon);
      const completed = await e.animate(seconds, t => controls.setPose({
        lat: from.lat + (goal.lat - from.lat) * t,
        lon: from.lon + turn * t,
        zoom: from.zoom + (goal.zoom - from.zoom) * t,
      }), signal);
      return completed && !signal?.aborted;
    },
    navigateControl(action) {
      const [dx, dy] = ({ left: [80, 0], right: [-80, 0], up: [0, 70], down: [0, -70] })[action] || [0, 0];
      if (action === 'reset') controls.setPose(this.region ? earthRegions[this.region] : globePose);
      else if (action === 'in' || action === 'out') controls.zoom(action === 'in' ? .88 : 1.12);
      else controls.rotate(dx, dy);
    },
    update(dt, time, e) { novi.update(time, e.paused, dt); },
  };
  controls.setPose(globePose); world.setLevel(null);
  return world;
}
