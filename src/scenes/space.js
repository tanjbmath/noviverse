import * as THREE from 'three';
import { loadTexture } from '../core/assets.js';
import { clamp } from '../core/globe-controls.js';
import { createNovi } from '../models/novi.js';
import { createAsteroidBelt, createPlanetBody } from '../models/planets.js';
import { createSun } from '../models/sun.js';
import { atmosphere, starfield } from './shared.js';

export const EARTH_ORBIT_SECONDS = 30;
export const ORBIT_COMPRESSION = 0.55;

export function compressedOrbitPeriod(realPeriodYears) {
  return EARTH_ORBIT_SECONDS * (realPeriodYears ** ORBIT_COMPRESSION);
}

export const SOLAR_PLANETS = [
  { id: 'mercury', name: 'Mercury', sub: 'Closest rocky world', orbit: 3.3, radius: 0.32, realPeriodYears: 0.2408, period: compressedOrbitPeriod(0.2408), phase: 0.65, spin: 0.04 },
  { id: 'venus', name: 'Venus', sub: 'Cloud-wrapped twin', orbit: 4.7, radius: 0.50, realPeriodYears: 0.6152, period: compressedOrbitPeriod(0.6152), phase: 2.38, spin: -0.02 },
  { id: 'earth', name: 'Earth', sub: 'Our blue home', orbit: 6.7, radius: 0.62, realPeriodYears: 1.0, period: compressedOrbitPeriod(1.0), phase: -0.45, spin: 0.055 },
  { id: 'mars', name: 'Mars', sub: 'The red planet', orbit: 8.8, radius: 0.42, realPeriodYears: 1.8809, period: compressedOrbitPeriod(1.8809), phase: 1.2, spin: 0.055 },
  { id: 'jupiter', name: 'Jupiter', sub: 'Largest gas giant', orbit: 12.6, radius: 1.15, realPeriodYears: 11.862, period: compressedOrbitPeriod(11.862), phase: -1.38, spin: 0.12 },
  { id: 'saturn', name: 'Saturn', sub: 'Rings of ice & rock', orbit: 15.8, radius: 0.94, realPeriodYears: 29.457, period: compressedOrbitPeriod(29.457), phase: 0.34, spin: 0.11 },
  { id: 'uranus', name: 'Uranus', sub: 'Tilted ice giant', orbit: 18.8, radius: 0.66, realPeriodYears: 84.021, period: compressedOrbitPeriod(84.021), phase: 2.82, spin: -0.07 },
  { id: 'neptune', name: 'Neptune', sub: 'Windy blue giant', orbit: 21.4, radius: 0.64, realPeriodYears: 164.79, period: compressedOrbitPeriod(164.79), phase: -2.35, spin: 0.08 },
];

export class SolarControls {
  constructor(onChange = () => {}) {
    this.onChange = onChange;
    this.pose = { pitch: 27, yaw: 0, zoom: 1 };
    this.enabled = true;
    this.orbitEnabled = true;
    this.pointers = new Map();
    this.moved = false;
    this.listeners = [];
  }
  setPose(pose) {
    const next = { ...this.pose, ...pose };
    if (![next.pitch, next.yaw, next.zoom].every(Number.isFinite)) return;
    this.pose = {
      pitch: clamp(next.pitch, 8, 78),
      yaw: ((next.yaw + 180) % 360 + 360) % 360 - 180,
      zoom: clamp(next.zoom, 0.42, 1.45),
    };
    this.onChange(this.pose);
  }
  reset() { this.setPose({ pitch: 27, yaw: 0, zoom: 1 }); }
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.clear();
  }
  setOrbitEnabled(enabled) {
    this.orbitEnabled = enabled;
  }
  clear() {
    for (const id of this.pointers.keys()) {
      try { this.element?.releasePointerCapture(id); } catch {}
    }
    this.pointers.clear();
    this.moved = true;
  }
  canPick(event) { return this.enabled && !this.moved && this.pointers.size === 1 && this.pointers.has(event.pointerId); }
  attach(element) {
    this.dispose();
    this.element = element;
    const listen = (name, handler, options) => {
      element.addEventListener(name, handler, options);
      this.listeners.push(() => element.removeEventListener(name, handler, options));
    };
    const pair = () => {
      const [a, b] = [...this.pointers.values()];
      return { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };
    listen('pointerdown', e => {
      if (!this.enabled || (e.button !== undefined && e.button !== 0)) return;
      if (!this.pointers.size) this.moved = false;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY });
      if (this.pointers.size > 1) this.moved = true;
      try { element.setPointerCapture(e.pointerId); } catch {}
    });
    listen('pointermove', e => {
      const p = this.pointers.get(e.pointerId);
      if (!this.enabled || !p) return;
      const previous = this.pointers.size === 2 ? pair() : null;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (Math.hypot(p.x - p.startX, p.y - p.startY) > 6) this.moved = true;
      if (!this.orbitEnabled) return;
      if (this.pointers.size === 1 && this.moved) {
        this.setPose({ yaw: this.pose.yaw - dx * 0.22, pitch: this.pose.pitch + dy * 0.18 });
      } else if (this.pointers.size === 2) {
        const next = pair();
        this.moved = true;
        this.setPose({ yaw: this.pose.yaw - (next.x - previous.x) * 0.22, pitch: this.pose.pitch + (next.y - previous.y) * 0.18 });
        if (previous.distance > 2 && next.distance > 2) this.setPose({ zoom: this.pose.zoom * (previous.distance / next.distance) });
      }
    });
    const release = e => {
      this.pointers.delete(e.pointerId);
      try { element.releasePointerCapture(e.pointerId); } catch {}
    };
    listen('pointerup', release);
    listen('pointercancel', e => { this.moved = true; release(e); });
    listen('lostpointercapture', e => { this.pointers.delete(e.pointerId); });
    listen('wheel', e => {
      if (!this.enabled || !this.orbitEnabled) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 300 : 1;
      const dy = clamp(e.deltaY * unit, -120, 120);
      this.setPose({ zoom: this.pose.zoom * Math.exp(dy * 0.0018) });
    }, { passive: false });
  }
  dispose() { this.clear(); this.listeners.forEach(remove => remove()); this.listeners = []; this.element = null; }
}

function makeOrbitRing(radius, color = '#587b9e', opacity = 0.22) {
  const pts = Array.from({ length: 160 }, (_, i) => {
    const a = i / 160 * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  });
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

export async function createSpace(engine) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#070d1c');
  const stars = starfield(1500);
  scene.add(stars);

  const [earthMap, moonMap] = await Promise.all([
    loadTexture('earth.jpg', engine.renderer),
    loadTexture('moon.jpg', engine.renderer),
  ]);

  const solar = createSun(1.85, { detail: false });
  const sun = solar.root;
  sun.position.set(0, 0, 0);
  sun.userData.poi = 'sun';
  scene.add(sun);

  // Warm central sunlight illuminates all planets naturally, plus soft cosmic fill.
  const sunLight = new THREE.PointLight('#fff1d4', 4.6, 0, 0);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);
  scene.add(new THREE.HemisphereLight('#8cb8f5', '#151e34', 0.48));
  const rimLight = new THREE.DirectionalLight('#6fa6e8', 0.34);
  rimLight.position.set(-14, 18, 22);
  scene.add(rimLight);
  const shipLight = new THREE.PointLight('#a4f9ed', 5.5, 10);
  scene.add(shipLight);
  const inspectLight = new THREE.DirectionalLight('#fff2df', 0);
  scene.add(inspectLight);
  scene.add(inspectLight.target);

  const belt = createAsteroidBelt(9.9, 11.1, 220);
  scene.add(belt);

  const planets = {};
  const targets = [sun];
  const labels = [];

  let earth, air, moon;

  for (const spec of SOLAR_PLANETS) {
    const ring = makeOrbitRing(spec.orbit, spec.id === 'earth' ? '#70b2dc' : '#56789c', spec.id === 'earth' ? 0.34 : 0.2);
    scene.add(ring);

    if (spec.id === 'earth') {
      earth = new THREE.Mesh(
        new THREE.SphereGeometry(spec.radius, 64, 48),
        new THREE.MeshStandardMaterial({ map: earthMap, roughness: 0.8, metalness: 0.03 }),
      );
      earth.rotation.set(0.08, 3.2, -0.12);
      earth.userData.poi = 'earth';
      scene.add(earth);

      air = atmosphere(spec.radius * 1.045);
      air.raycast = () => {};
      scene.add(air);

      planets.earth = { ...spec, mesh: earth, spinMesh: earth, ring };
      targets.push(earth);
      labels.push({ id: 'earth', text: 'Earth', sub: 'Our blue home', object: earth, offset: new THREE.Vector3(0, -(spec.radius + 0.38), 0) });
    } else {
      const { group, sphere } = createPlanetBody(spec.id, spec.radius, engine.renderer);
      scene.add(group);
      planets[spec.id] = { ...spec, mesh: group, spinMesh: sphere, ring };
      targets.push(group);
      labels.push({
        id: spec.id,
        text: spec.name,
        sub: spec.sub,
        object: group,
        offset: new THREE.Vector3(0, -(spec.radius + 0.38), 0),
      });
    }
  }

  // Earth's Moon orbiting Earth
  moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 36, 24),
    new THREE.MeshStandardMaterial({ map: moonMap, roughness: 1 }),
  );
  moon.rotation.y = -0.6;
  moon.userData.poi = 'moon';
  scene.add(moon);
  targets.push(moon);

  const ringGeo = Array.from({ length: 160 }, (_, i) => orbitOffset(i / 160 * Math.PI * 2));
  const orbit = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(ringGeo),
    new THREE.LineBasicMaterial({ color: '#7094b4', transparent: true, opacity: 0.28 }),
  );
  scene.add(orbit);

  labels.push({ id: 'moon', text: 'The Moon', sub: 'Land & explore', object: moon, offset: new THREE.Vector3(0, -0.45, 0) });
  labels.push({ id: 'sun', text: 'The Sun', sub: 'Meet our star', object: sun, offset: new THREE.Vector3(0, -2.25, 0) });

  const novi = createNovi();
  scene.add(novi.root);

  let activeEngine = engine;
  const controls = new SolarControls(() => {
    if (activeEngine && !motion.visitingPlanet) motion.applyCamera(activeEngine);
  });

  const motion = createSpaceMotion({ earth, air, moon, sun, novi, orbit, solar, planets, belt, controls, shipLight, inspectLight, stars });

  return {
    kind: 'space',
    scene,
    novi,
    earth,
    moon,
    sun,
    planets,
    controls,
    targets,
    labels,
    activate(eng) {
      activeEngine = eng;
      controls.attach(eng.renderer.domElement);
      controls.setEnabled(true);
      controls.setOrbitEnabled(!motion.visitingPlanet);
    },
    deactivate() { controls.dispose(); },
    setInteractive(value) {
      controls.setEnabled(value);
      controls.setOrbitEnabled(value && !motion.visitingPlanet);
    },
    ...motion,
  };
}

// An artistic inclined orbit, independent of Earth's axial spin (150 seconds per lap).
function orbitOffset(phase) {
  return new THREE.Vector3(Math.cos(phase), Math.sin(phase) * Math.cos(0.45), -Math.sin(phase) * Math.sin(0.45));
}

export function createSpaceMotion({ earth, air, moon, sun, novi, orbit, solar, planets, belt, controls, shipLight, inspectLight, stars }) {
  let moonPhase = 0.65;
  let visitOrbitAngle = 0.9;
  let visitOrbitDir = -1;
  let idle = true;
  let moonRadius = 5.05;
  let orbitScale = 1;
  let planetScale = 1;
  let lastWidth = 1280;
  let lastHeight = 720;
  const _ahead = new THREE.Vector3();
  const _inward = new THREE.Vector3();
  const _up = new THREE.Vector3();
  const _worldUp = new THREE.Vector3(0, 1, 0);
  const _lookMat = new THREE.Matrix4();
  const _posA = new THREE.Vector3();
  const _posB = new THREE.Vector3();
  const _lightOffset = new THREE.Vector3(-3.2, 3.8, 4.2);

  const planetPhases = {};
  if (planets) {
    for (const [id, p] of Object.entries(planets)) planetPhases[id] = p.phase;
  }

  const placeMoon = () => moon.position.copy(earth.position).addScaledVector(orbitOffset(moonPhase), moonRadius);

  const placePlanets = () => {
    if (!planets) return;
    for (const [id, p] of Object.entries(planets)) {
      const a = planetPhases[id];
      const r = p.orbit * orbitScale;
      p.mesh.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    }
    air.position.copy(earth.position);
    orbit.position.copy(earth.position);
  };

  const sampleOrbitPoint = (center, orbitR, angle, out, surface = false, id = '') => out.set(
    center.x + Math.cos(angle) * orbitR,
    center.y + (surface && id === 'saturn' ? orbitR * 0.34 : 0) + Math.sin(angle + 0.35) * (orbitR * (surface ? 0.14 : 0.22)),
    center.z + Math.sin(angle) * orbitR,
  );

  const planetOrbitPose = (id, angle, dir = visitOrbitDir, surface = motion.visitingSurface) => {
    const p = planets?.[id];
    if (!p) return null;
    const r = p.radius * planetScale;
    const orbitR = surface
      ? (id === 'saturn' ? r * 1.32 : Math.max(r * 1.26, r + 0.24))
      : (id === 'saturn' ? r * 2.62 : Math.max(r * 1.9, r + 0.58));
    const center = p.mesh.position;
    const position = sampleOrbitPoint(center, orbitR, angle, new THREE.Vector3(), surface, id);
    const eps = 0.01 * (dir < 0 ? -1 : 1);
    sampleOrbitPoint(center, orbitR, angle - eps, _posA, surface, id);
    sampleOrbitPoint(center, orbitR, angle + eps, _posB, surface, id);
    const tangent = _posB.clone().sub(_posA).normalize();
    _inward.copy(center).sub(position).normalize();
    _up.copy(_worldUp).addScaledVector(_inward, 0.36).normalize();
    _ahead.copy(position).add(tangent);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(_lookMat.lookAt(_ahead, position, _up));
    return { position, tangent, quaternion, orbitR, r, center };
  };

  const placeNoviOnPlanetOrbit = id => {
    const pose = planetOrbitPose(id, visitOrbitAngle, visitOrbitDir, motion.visitingSurface);
    if (!pose) return;
    novi.root.position.copy(pose.position);
    novi.root.quaternion.copy(pose.quaternion);
    if (shipLight) shipLight.position.copy(pose.position).add(new THREE.Vector3(0.4, 1.5, 1.8));
  };

  const computeOverview = (width = lastWidth, height = lastHeight) => {
    const mobile = width < 760;
    const aspect = width / Math.max(1, height);
    if (!planets) {
      // Compatibility framing when invoked directly without full solar-system planets
      const lookX = 0.8;
      const halfWidth = moonRadius + 0.85 * moon.scale.x + 0.7 + Math.abs(earth.position.x - lookX);
      const fitDistance = halfWidth / (Math.tan(43 * Math.PI / 360) * aspect) + moonRadius * Math.sin(0.45);
      const lookY = mobile ? -0.5 : 0.4;
      const halfHeight = moonRadius * Math.cos(0.45) + 0.85 * moon.scale.x + (mobile ? 0.83 : 1.1) + Math.abs(earth.position.y - lookY);
      const verticalFit = halfHeight / (Math.tan(43 * Math.PI / 360) * Math.max(0.2, 1 - 200 / height)) + moonRadius * Math.sin(0.45);
      return {
        position: new THREE.Vector3(0, 1.4, Math.max(mobile ? 30 : 19, fitDistance, verticalFit)),
        look: new THREE.Vector3(lookX, lookY, 0),
      };
    }

    const maxOrbit = 21.4 * orbitScale;
    const look = mobile ? new THREE.Vector3(0, 1.4, 0) : new THREE.Vector3(-1.4, -0.35, 0);
    const halfSpan = maxOrbit + 1.4 + Math.abs(look.x);
    const tanHalf = Math.tan(43 * Math.PI / 360);
    const fitH = halfSpan / (tanHalf * Math.max(0.35, aspect));
    const fitV = (maxOrbit * 0.56 + 3.5) / tanHalf;
    const baseDist = Math.max(mobile ? 56 : 42, fitH * (mobile ? 1.02 : 0.94), fitV);

    const pose = controls ? controls.pose : { pitch: 27, yaw: 0, zoom: 1 };
    const dist = baseDist * pose.zoom;
    const pitchRad = THREE.MathUtils.degToRad(pose.pitch);
    const yawRad = THREE.MathUtils.degToRad(pose.yaw);

    const offset = new THREE.Vector3(
      Math.cos(pitchRad) * Math.sin(yawRad),
      Math.sin(pitchRad),
      Math.cos(pitchRad) * Math.cos(yawRad),
    ).multiplyScalar(dist);

    return { position: look.clone().add(offset), look };
  };

  const noviOverviewPose = (width = lastWidth) => {
    const mobile = width < 760;
    return {
      position: mobile ? new THREE.Vector3(-5.8, -4.6, 17) : new THREE.Vector3(-12.5, -2.5, 19.5),
      rotation: new THREE.Euler(0.06, 0.52, -0.06),
      scale: mobile ? 0.85 : 1.08,
    };
  };

  const motion = {
    visitingPlanet: null,
    visitingSurface: false,
    setIdle(value) { idle = value; },
    resetVisitOrbit() { visitOrbitAngle = 0.9; visitOrbitDir = -1; },
    setVisitOrbit(angle, dir = -1) {
      visitOrbitAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      visitOrbitDir = dir < 0 ? -1 : 1;
    },
    getVisitOrbit() {
      return { angle: visitOrbitAngle, dir: visitOrbitDir };
    },
    applyCamera(engine) {
      const view = computeOverview(lastWidth, lastHeight);
      engine.camera.position.copy(view.position);
      engine.look.copy(view.look);
    },
    overviewPose(width = lastWidth, height = lastHeight) {
      const view = computeOverview(width, height);
      const noviPose = noviOverviewPose(width);
      return { ...view, noviPose };
    },
    planetFocusView(id, width = lastWidth, fromPos = null, keepOrbit = null) {
      const p = planets?.[id];
      if (!p) return null;
      const mobile = width < 760;
      const center = p.mesh.position;
      const camDir = new THREE.Vector3(0.36, 0.34, 0.87).normalize();
      let orbitAngle = keepOrbit ? keepOrbit.angle : 0.9;
      let orbitDir = keepOrbit ? (keepOrbit.dir < 0 ? -1 : 1) : -1;
      if (!keepOrbit && fromPos) {
        const dx = center.x - fromPos.x;
        const dz = center.z - fromPos.z;
        const len = Math.hypot(dx, dz);
        const ix = len > 1e-3 ? dx / len : 1;
        const iz = len > 1e-3 ? dz / len : 0;
        const camLen = Math.hypot(camDir.x, camDir.z);
        const cx = camDir.x / camLen;
        const cz = camDir.z / camLen;
        // Pick CCW (-1) vs CW (+1) tangential capture point with best front-side sweep visibility.
        const aCcw = Math.atan2(ix, -iz) + 0.32;
        const aCw = Math.atan2(-ix, iz) - 0.32;
        const vis = (a, dir) => (Math.cos(a) * cx + Math.sin(a) * cz)
          + 0.55 * (Math.cos(a + dir * 0.55) * cx + Math.sin(a + dir * 0.55) * cz);
        if (vis(aCw, 1) > vis(aCcw, -1)) {
          orbitAngle = aCw;
          orbitDir = 1;
        } else {
          orbitAngle = aCcw;
          orbitDir = -1;
        }
      }
      const entry = planetOrbitPose(id, orbitAngle, orbitDir, false);
      const { r } = entry;
      const dist = Math.max(4.4, r * (id === 'saturn' ? 7.2 : 5.8)) * (mobile ? 1.18 : 1);
      const position = center.clone().addScaledVector(camDir, dist);
      // Frame planet and Novi's orbit clearly alongside the discovery panel
      const look = center.clone().add(mobile ? new THREE.Vector3(0, -r * 1.25, 0) : new THREE.Vector3(r * 1.45, 0.08, 0));
      const noviPos = entry.position.clone();
      const noviLookAt = entry.position.clone().add(entry.tangent);
      const noviQuaternion = entry.quaternion.clone();
      const noviTangent = entry.tangent.clone();
      const noviScale = clamp(r * 0.16, 0.11, 0.25);
      return { position, look, noviPos, noviLookAt, noviQuaternion, noviTangent, noviScale, orbitAngle, orbitDir, target: center.clone() };
    },
    surfaceFocusView(id, width = lastWidth, fromOrbit = null) {
      const p = planets?.[id];
      if (!p) return null;
      const mobile = width < 760;
      const orbitDir = fromOrbit ? (fromOrbit.dir < 0 ? -1 : 1) : visitOrbitDir;
      const baseAngle = fromOrbit ? fromOrbit.angle : visitOrbitAngle;
      const orbitAngle = ((baseAngle + orbitDir * (fromOrbit ? 0.55 : 0)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const entry = planetOrbitPose(id, orbitAngle, orbitDir, true);
      const { r, center } = entry;
      const camDir = new THREE.Vector3(0.28, id === 'saturn' ? 0.44 : 0.24, 0.88).normalize();
      const dist = r * (id === 'saturn' ? 2.55 : 2.15) * (mobile ? 1.18 : 1);
      const position = center.clone().addScaledVector(camDir, dist);
      const look = center.clone().add(mobile ? new THREE.Vector3(0, -r * 0.44, 0) : new THREE.Vector3(r * 0.58, -r * 0.06, 0));
      const noviPos = entry.position.clone();
      const noviLookAt = entry.position.clone().add(entry.tangent);
      const noviQuaternion = entry.quaternion.clone();
      const noviTangent = entry.tangent.clone();
      const noviScale = clamp(r * 0.115, 0.08, 0.16);
      return { position, look, noviPos, noviLookAt, noviQuaternion, noviTangent, noviScale, orbitAngle, orbitDir, target: center.clone() };
    },
    currentVisitPose() {
      return this.visitingPlanet ? planetOrbitPose(this.visitingPlanet, visitOrbitAngle, visitOrbitDir, this.visitingSurface) : null;
    },
    resize(engine, width = innerWidth, height = innerHeight) {
      lastWidth = width;
      lastHeight = height;
      const mobile = width < 760;

      if (!planets) {
        moonRadius = mobile ? 3.8 : 5.05;
        earth.position.set(mobile ? 0.8 : 2.6, mobile ? -1.5 : 0.2, 0);
        earth.scale.setScalar(mobile ? 0.8 : 1);
        air.position.copy(earth.position);
        air.scale.copy(earth.scale);
        moon.scale.setScalar(mobile ? 0.8 : 1);
        placeMoon();
        orbit.position.copy(earth.position);
        orbit.scale.setScalar(moonRadius);
        const view = computeOverview(width, height);
        engine.camera.position.copy(view.position);
        engine.look.copy(view.look);
        sun.position.set(mobile ? 4.8 : 10, mobile ? 6.5 : 6, -5);
        novi.root.position.set(mobile ? -2 : -2.9, mobile ? -3 : -1.7, 4.6);
        novi.root.scale.setScalar(mobile ? 0.6 : 0.9);
        this.labels[0].offset.y = mobile ? -2.9 : -3.45;
        this.labels[1].offset.y = mobile ? -0.83 : -1.1;
        return;
      }

      orbitScale = mobile ? 0.68 : 1;
      planetScale = mobile ? 1.25 : 1;
      sun.scale.setScalar(mobile ? 1.1 : 1);
      moonRadius = 1.48 * planetScale;

      for (const p of Object.values(planets)) {
        p.mesh.scale.setScalar(planetScale);
        p.ring.scale.setScalar(orbitScale);
      }
      air.scale.setScalar(planetScale);
      moon.scale.setScalar(planetScale);
      orbit.scale.setScalar(moonRadius);
      if (belt) belt.scale.set(orbitScale, 1, orbitScale);

      placePlanets();
      placeMoon();

      if (this.labels?.length) {
        for (const label of this.labels) {
          if (label.id === 'sun') label.offset.y = -(1.85 * sun.scale.x + 0.42);
          else if (label.id === 'moon') label.offset.y = -(0.19 * planetScale + 0.28);
          else if (planets[label.id]) label.offset.y = -(planets[label.id].radius * planetScale + 0.36);
        }
      }

      if (this.visitingPlanet) {
        const focus = this.visitingSurface
          ? this.surfaceFocusView(this.visitingPlanet, width)
          : this.planetFocusView(this.visitingPlanet, width);
        if (focus) {
          engine.camera.position.copy(focus.position);
          engine.look.copy(focus.look);
          novi.root.scale.setScalar(focus.noviScale);
          placeNoviOnPlanetOrbit(this.visitingPlanet);
        }
      } else {
        this.applyCamera(engine);
        const noviPose = noviOverviewPose(width);
        novi.root.position.copy(noviPose.position);
        novi.root.rotation.copy(noviPose.rotation);
        novi.root.scale.setScalar(noviPose.scale);
      }

      if (shipLight && !this.visitingPlanet) {
        shipLight.position.copy(novi.root.position).add(new THREE.Vector3(0.4, 2.2, 2.4));
      }
    },
    update(dt, time, engine) {
      if (!engine.paused) {
        if (planets) {
          for (const [id, p] of Object.entries(planets)) {
            const spinFactor = this.visitingSurface && id === this.visitingPlanet ? 0.55 : 1;
            p.spinMesh.rotation.y += dt * p.spin * spinFactor;
            if (idle) {
              planetPhases[id] = (planetPhases[id] + dt * Math.PI * 2 / p.period) % (Math.PI * 2);
            }
          }
          if (idle) {
            placePlanets();
            if (belt) belt.rotation.y += dt * 0.075;
          }
        } else {
          earth.rotation.y += dt * 0.055;
        }
        if (idle) {
          moonPhase = (moonPhase + dt * Math.PI * 2 / 150) % (Math.PI * 2);
          placeMoon();
        }
        if (this.visitingPlanet && planets) {
          const rate = this.visitingSurface ? 0.52 : 0.85;
          visitOrbitAngle = (visitOrbitAngle + visitOrbitDir * dt * rate + Math.PI * 2) % (Math.PI * 2);
          placeNoviOnPlanetOrbit(this.visitingPlanet);
        } else if (shipLight) {
          shipLight.position.copy(novi.root.position).add(_ahead.set(0.4, 2.2, 2.4));
        }
      }
      if (inspectLight) {
        if (this.visitingPlanet && planets?.[this.visitingPlanet]) {
          const center = planets[this.visitingPlanet].mesh.position;
          inspectLight.position.copy(center).add(_lightOffset);
          inspectLight.target.position.copy(center);
          inspectLight.intensity = this.visitingSurface ? 1.15 : 0.78;
        } else {
          inspectLight.intensity = 0;
        }
      }
      novi.update(time, engine.paused, dt);
      solar?.update(time, engine.camera);
      stars?.update(time, engine.paused, dt);
    },
  };

  return motion;
}
