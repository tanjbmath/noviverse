import * as THREE from 'three';
import './style.css';
import { Engine } from './core/engine.js';
import { disposeScene } from './core/dispose.js';
import { Interface } from './ui/interface.js';
import { discoveries } from './data/discoveries.js';
import { earthSites, earthRegions } from './data/earth.js';

const app = document.querySelector('#app');
let engine, world, operation = new AbortController(), busy = true, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ui = new Interface(app, {
  destination: id => destination(id), poi: id => inspect(id), home: () => home(), back: () => back(),
  motion: () => { reduced = !reduced; applyMotion(); },
  earthControl: action => { if (!busy && world?.kind === 'earth' && !ui.activeDiscovery) world.navigateControl(action); },
  activity: id => runActivity(id),
  wonderActivity: () => { if (!busy && world?.kind === 'wonder') runActivity(`wonder:${world.siteId}`); },
});
async function runActivity(id) {
  const signal = operation.signal;
  try {
    if (id.startsWith('wonder:')) {
      const module = await import('./ui/wonder-activity.js');
      if (!signal.aborted) module.wonderActivity(ui, id.slice(7));
      return;
    }
    const module = await import('./ui/activities.js');
    if (signal.aborted) return;
    if (id === 'gravity') module.gravityActivity(ui);
    else if (id === 'solar') module.solarActivity(ui);
    else module.impactActivity(ui);
  } catch (error) { if (!signal.aborted) report(error); }
}
document.querySelector('#boot-status')?.remove();
function applyMotion() {
  if (engine) engine.paused = reduced;
  document.body.classList.toggle('reduced-motion', reduced);
  const button = document.querySelector('[data-action="motion"]');
  button.setAttribute('aria-pressed', String(reduced));
  button.setAttribute('aria-label', reduced ? 'Enable cinematic motion' : 'Reduce motion');
}
const duration = seconds => reduced ? 0.08 : seconds;
function begin(text) {
  operation.abort(); operation = new AbortController(); busy = true;
  ui.closeModal(); ui.hideDiscovery(); ui.setBusy(true, text);
  if (world) { world.novi.setScanning(false); world.setIdle?.(false); world.setInteractive?.(false); }
  return operation.signal;
}
function settle() { busy = false; ui.setBusy(false); world?.novi.setMoving(false); world?.setInteractive?.(true); }
function swap(next) {
  const old = world;
  world = next; engine.use(next); ui.world(next.kind, next.labels);
  if (old) disposeScene(old.scene);
}
function report(error) {
  console.error(error); settle();
  ui.error('A scene or asset could not load. The browser console has the technical details. Your Home button can restart the journey.');
}

const _flightMat = new THREE.Matrix4();
const _flightUp = new THREE.Vector3();
const _flightAhead = new THREE.Vector3();
const _flightTan = new THREE.Vector3();
const _flightTanA = new THREE.Vector3();
const _flightTanB = new THREE.Vector3();
const _flightTurn = new THREE.Vector3();
const _flightQuat = new THREE.Quaternion();
const _worldUp = new THREE.Vector3(0, 1, 0);

function makeFlightCurve(from, to, startDir, endDir, lift = 0) {
  const dist = Math.max(1, from.distanceTo(to));
  const p1 = from.clone().addScaledVector(startDir, dist * 0.32);
  const p2 = to.clone().addScaledVector(endDir, -dist * 0.32);
  if (lift) p1.y += dist * lift;
  return new THREE.CubicBezierCurve3(from.clone(), p1, p2, to.clone());
}

// Smooth takeoff from rest (s'(0)=0) easing into steady forward momentum at arrival (s'(1)=endSlope).
function cruiseProgress(rawT, endSlope = 0.32) {
  const u = Math.max(0, Math.min(1, rawT));
  return u * u * ((3 - endSlope) + (endSlope - 2) * u);
}

function applyFlightPose(novi, curve, { fromQuat, toQuat, scaleFrom, scaleTo, endBlendStart = 0.65, bankGain = 2.4 }, t) {
  const pos = curve.getPoint(t);
  novi.root.position.copy(pos);
  if (scaleFrom !== undefined && scaleTo !== undefined) {
    novi.root.scale.setScalar(scaleFrom + (scaleTo - scaleFrom) * t);
  }
  _flightTan.copy(curve.getTangent(t)).normalize();
  _flightTanA.copy(curve.getTangent(Math.max(0, t - 0.03)));
  _flightTanB.copy(curve.getTangent(Math.min(1, t + 0.03)));
  _flightTurn.copy(_flightTanB).sub(_flightTanA);
  _flightUp.copy(_worldUp).addScaledVector(_flightTurn, bankGain);
  if (_flightUp.lengthSq() < 1e-4) _flightUp.copy(_worldUp);
  _flightUp.normalize();
  if (Math.abs(_flightUp.dot(_flightTan)) > 0.96) {
    _flightUp.set(0, 0, 1).cross(_flightTan);
    if (_flightUp.lengthSq() < 1e-4) _flightUp.set(1, 0, 0);
    _flightUp.normalize();
  }
  _flightAhead.copy(pos).add(_flightTan);
  _flightQuat.setFromRotationMatrix(_flightMat.lookAt(_flightAhead, pos, _flightUp));

  const startBlend = THREE.MathUtils.smoothstep(t, 0, 0.28);
  novi.root.quaternion.copy(fromQuat).slerp(_flightQuat, startBlend);
  if (toQuat) {
    const endBlend = THREE.MathUtils.smoothstep(t, endBlendStart, 1);
    novi.root.quaternion.slerp(toQuat, endBlend);
  }
}

async function home(initial = false) {
  if (!engine) return;
  const signal = begin(initial ? 'Preparing a universe of discoveries…' : 'Heading home to our blue planet…');
  try {
    if (world?.kind === 'space') {
      world.controls?.reset();
      world.visitingPlanet = null;
      world.setIdle(true);
      world.resize(engine);
      world.novi.resetMotion?.();
      ui.world('space', world.labels);
      settle();
      return;
    }
    // Start the lazy module/assets while the ascent plays. Result wrappers prevent unhandled rejections.
    const nextPromise = import('./scenes/space.js').then(m => m.createSpace(engine)).then(value => ({ value }), error => ({ error }));
    if (world) {
      world.novi.setMoving(true);
      const from = world.novi.root.position.clone(), earthMode = world.novi.earthMode;
      const qFrom = world.novi.root.quaternion.clone();
      const climbRot = new THREE.Euler(-0.42, world.novi.root.rotation.y, 0.08);
      const qClimb = new THREE.Quaternion().setFromEuler(climbRot);
      await engine.animate(duration(1.4), t => {
        const climb = t * (0.35 + 0.65 * t);
        world.novi.root.position.copy(from).add(new THREE.Vector3(0, climb * 12, -climb * 5));
        world.novi.root.quaternion.copy(qFrom).slerp(qClimb, THREE.MathUtils.smoothstep(t, 0, 0.55));
        if (world.kind === 'moon') world.novi.setTransform(1 - t);
        if (world.kind === 'wonder') world.novi.setEarthMode(earthMode * (1 - t));
      }, signal);
    }
    const result = await nextPromise;
    if (signal.aborted) { if (result.value) disposeScene(result.value.scene); return; }
    if (result.error) throw result.error;
    swap(result.value); world.novi.resetMotion?.(); settle(); ui.status('Welcome to space. All three destinations are open.');
  } catch (error) { if (!signal.aborted) report(error); }
}

const SOLAR_PLANET_IDS = new Set(['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']);

async function destination(id) {
  if (busy || !world || !['moon', 'earth', 'sun', ...SOLAR_PLANET_IDS].includes(id)) return;
  if (world.kind !== 'space') return;
  const signal = begin(
    id === 'moon'
      ? 'Course set for the Moon. Let’s follow our curiosity.'
      : SOLAR_PLANET_IDS.has(id)
        ? `Course set for ${discoveries[id].title}. Let’s take a closer look!`
        : `Flying to our ${id === 'earth' ? 'Earth' : 'Sun'} viewing point…`,
  );
  try {
    world.novi.setMoving(true);
    if (SOLAR_PLANET_IDS.has(id)) {
      world.resetVisitOrbit?.();
      const shipFrom = world.novi.root.position.clone();
      const focus = world.planetFocusView(id, innerWidth, shipFrom);
      world.setVisitOrbit?.(focus.orbitAngle, focus.orbitDir);
      const qFrom = world.novi.root.quaternion.clone();
      const scaleFrom = world.novi.root.scale.x;
      const toTarget = focus.noviPos.clone().sub(shipFrom).normalize();
      const noseDir = new THREE.Vector3(0, 0, 1).applyQuaternion(qFrom).normalize();
      // Only follow current nose when already aimed forward; otherwise sweep directly toward destination.
      const startDir = noseDir.dot(toTarget) > 0.2
        ? noseDir
        : toTarget.clone().lerp(focus.noviTangent, 0.2).normalize();
      const curve = makeFlightCurve(shipFrom, focus.noviPos, startDir, focus.noviTangent, 0.06);
      const flight = engine.animate(duration(1.75), (t, rawT) => {
        const u = cruiseProgress(rawT ?? t, 0.3);
        applyFlightPose(world.novi, curve, {
          fromQuat: qFrom,
          toQuat: focus.noviQuaternion,
          scaleFrom,
          scaleTo: focus.noviScale,
          endBlendStart: 0.65,
          bankGain: 2.2,
        }, u);
      }, signal);
      await engine.view(focus.position, focus.look, duration(1.75), signal);
      await flight;
      if (signal.aborted) return;
      world.visitingPlanet = id;
      settle();
      world.novi.setMoving(true);
      ui.showDiscovery(id);
      return;
    }
    if (id === 'sun') {
      const nextPromise = import('./scenes/sun.js').then(m => m.createSolarScene()).then(value => ({ value }), error => ({ error }));
      const shipFrom = world.novi.root.position.clone();
      const shipTo = world.sun.position.clone().add(new THREE.Vector3(-1.5, -1, 3));
      const qFrom = world.novi.root.quaternion.clone();
      const scaleFrom = world.novi.root.scale.x;
      const startDir = new THREE.Vector3(0, 0, 1).applyQuaternion(qFrom).normalize();
      const endDir = shipTo.clone().sub(shipFrom).normalize();
      const toQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.04, 0.35, -0.08));
      const curve = makeFlightCurve(shipFrom, shipTo, startDir, endDir, 0.09);
      const flight = engine.animate(duration(2.2), t => {
        applyFlightPose(world.novi, curve, {
          fromQuat: qFrom,
          toQuat,
          scaleFrom,
          scaleTo: 0.9,
          endBlendStart: 0.74,
          bankGain: 3.0,
        }, t);
      }, signal);
      await engine.view(world.sun.position.clone().add(new THREE.Vector3(0, 0, 6)), world.sun.position.clone(), duration(2.2), signal);
      await flight;
      const result = await nextPromise;
      if (signal.aborted) { if (result.value) disposeScene(result.value.scene); return; }
      if (result.error) throw result.error;
      swap(result.value); world.novi.resetMotion?.(); settle(); ui.status('Welcome to the solar observatory. Tap a glowing node to investigate our star.'); return;
    }
    if (id === 'earth') {
      const nextPromise = import('./scenes/earth.js').then(m => m.createEarth(engine)).then(value => ({ value }), error => ({ error }));
      const object = world.earth, from = world.novi.root.position.clone();
      const to = object.position.clone().add(new THREE.Vector3(-1.2, -0.5, 2.8));
      const qFrom = world.novi.root.quaternion.clone();
      const scaleFrom = world.novi.root.scale.x;
      const startDir = new THREE.Vector3(0, 0, 1).applyQuaternion(qFrom).normalize();
      const endDir = object.position.clone().sub(to).normalize();
      const toQuat = new THREE.Quaternion().setFromRotationMatrix(_flightMat.lookAt(object.position, to, _worldUp));
      const curve = makeFlightCurve(from, to, startDir, endDir, 0.1);
      const flight = engine.animate(duration(2.2), t => {
        applyFlightPose(world.novi, curve, {
          fromQuat: qFrom,
          toQuat,
          scaleFrom,
          scaleTo: 0.55,
          endBlendStart: 0.72,
          bankGain: 3.2,
        }, t);
      }, signal);
      await engine.view(object.position.clone().add(new THREE.Vector3(0, 0, 4.4)), object.position.clone(), duration(2.2), signal);
      await flight;
      const result = await nextPromise;
      if (signal.aborted) { if (result.value) disposeScene(result.value.scene); return; }
      if (result.error) throw result.error;
      swap(result.value); world.novi.resetMotion?.(); ui.earthRegion(null); settle();
      ui.status('Welcome to Earth. Drag, swipe or scroll to turn the globe. Tap a glowing node to explore the first continent.'); return;
    }
    const nextPromise = import('./scenes/moon.js').then(m => m.createMoon(engine)).then(value => ({ value }), error => ({ error }));
    const shipFrom = world.novi.root.position.clone(), shipTo = world.moon.position.clone().add(new THREE.Vector3(0, 0, 0.9));
    const qFrom = world.novi.root.quaternion.clone();
    const scaleFrom = world.novi.root.scale.x;
    const startDir = new THREE.Vector3(0, 0, 1).applyQuaternion(qFrom).normalize();
    const endDir = world.moon.position.clone().sub(shipTo).normalize();
    const curve = makeFlightCurve(shipFrom, shipTo, startDir, endDir, 0.14);
    const cameraFrom = engine.camera.position.clone(), lookFrom = engine.look.clone();
    const cameraTo = shipTo.clone().add(new THREE.Vector3(0.4, 0.5, 2.2));
    await engine.animate(duration(2.4), t => {
      applyFlightPose(world.novi, curve, {
        fromQuat: qFrom,
        scaleFrom,
        scaleTo: 0.45,
        bankGain: 3.2,
      }, t);
      engine.camera.position.lerpVectors(cameraFrom, cameraTo, t);
      engine.look.lerpVectors(lookFrom, shipTo, t);
    }, signal);
    const result = await nextPromise;
    if (signal.aborted) { if (result.value) disposeScene(result.value.scene); return; }
    if (result.error) throw result.error;
    swap(result.value); world.novi.resetMotion?.(); ui.setBusy(true, 'Engines pivoting. Wings folding. Hello, lunar hovercraft!');
    world.novi.setMoving(true);
    await engine.animate(duration(2.3), t => {
      world.novi.setTransform(t);
      const flare = (1 - t) ** 1.35;
      world.novi.root.position.set(Math.sin(t * Math.PI) * 0.45, 1.1 + flare * 6, 9 + flare * 4);
      world.novi.root.rotation.set(-0.08 * Math.sin(t * Math.PI), THREE.MathUtils.lerp(-0.85, -0.5, t), 0.06 * Math.sin(t * Math.PI));
    }, signal);
    if (signal.aborted) return;
    world.novi.root.rotation.set(0, -0.5, 0);
    settle(); ui.status('Welcome to the Tycho region. Tap a crater, rock, or the gravity lab. Novi’s hovercraft is fictional.');
  } catch (error) { if (!signal.aborted) report(error); }
}

async function inspect(id) {
  if (world?.kind === 'wonder') {
    if (busy || !world.labels.some(label => label.id === id)) return;
    const signal = begin(`Novi is investigating ${discoveries[id].title}…`);
    try {
      if (!await world.focus(id, engine, duration(1.6), signal)) return;
      world.resize(engine); settle(); world.novi.setScanning(true); ui.showDiscovery(id);
    } catch (error) { if (!signal.aborted) report(error); }
    return;
  }
  if (world?.kind === 'earth') {
    if (busy || !world.labels.some(label => label.id === id)) return;
    const signal = begin('Novi is following a new Earth discovery…');
    try {
      world.novi.setMoving(true);
      if (earthSites[id]) {
        const nextPromise = import('./scenes/wonder.js').then(m => m.createWonder(id, engine)).then(value => ({ value }), error => ({ error }));
        await world.focus(id, engine, duration(1.6), signal);
        const result = await nextPromise;
        if (signal.aborted) { if (result.value) disposeScene(result.value.scene); return; }
        if (result.error) throw result.error;
        swap(result.value); ui.wonder(world.siteId);
        ui.setBusy(true, 'Wings folding. Boots deploying. Novi’s Earth explorer is ready!');
        world.novi.setMoving(true); const landed = world.overviewPose();
        await engine.animate(duration(1.8), t => {
          world.novi.setEarthMode(t);
          world.novi.root.position.copy(landed).add(new THREE.Vector3(0, (1 - t) * 2.5, 0));
        }, signal);
        if (signal.aborted) return;
        world.resize(engine); settle(); ui.status('Boots deployed. Tap a glowing node for a closer look, or try the discovery challenge.'); return;
      }
      if (!await world.focus(id, engine, duration(1.7), signal)) return;
      ui.world('earth', world.labels); ui.earthRegion(world.region); settle();
      if (world.visiting) { world.novi.setScanning(true); ui.showDiscovery(id); }
      else ui.status('Our next continent is ready. Explore a glowing node, or turn the globe to look around.');
    } catch (error) { if (!signal.aborted) report(error); }
    return;
  }
  if (busy || !['moon', 'sun'].includes(world?.kind) || !world.labels.some(label => label.id === id)) return;
  const signal = begin(`Novi is heading to ${discoveries[id].title}…`);
  world.visiting = true; world.novi.setMoving(true);
  if (world.kind === 'sun') {
    const anchor = world.labels.find(label => label.id === id).object.position;
    const from = world.novi.root.position.clone(), to = anchor.clone();
    // Stay in front of the star: there is no solid surface to land on.
    to.z = 6; to.x -= .8; to.y -= .8;
    const qFrom = world.novi.root.quaternion.clone();
    const toQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.04, 0.35, -0.08));
    const mid = from.clone().lerp(to, 0.5);
    mid.z = Math.max(mid.z, 6.8);
    const arcCurve = new THREE.CatmullRomCurve3([from, mid, to]);
    const view = world.view(true);
    const flight = engine.animate(duration(1.6), t => {
      applyFlightPose(world.novi, arcCurve, { fromQuat: qFrom, toQuat, endBlendStart: 0.66, bankGain: 2.8 }, t);
    }, signal);
    await engine.view(view.position, view.look, duration(1.6), signal); await flight;
    if (signal.aborted) return;
    settle(); world.novi.setScanning(true); ui.showDiscovery(id); return;
  }
  const data = discoveries[id], target = new THREE.Vector3(...data.stop), from = world.novi.root.position.clone();
  target.y = world.terrainHeight(target.x, target.z) + 1;
  const center = new THREE.Vector3(...data.position); center.y = world.terrainHeight(center.x, center.z);
  const qFrom = world.novi.root.quaternion.clone();
  // Flight is lifted above the terrain and debris, with a soft automatic landing.
  const path = new THREE.CatmullRomCurve3([from, from.clone().lerp(target, 0.4).add(new THREE.Vector3(0, 2, 2)), target]);
  const sampleMoonPoint = u => {
    const pt = path.getPoint(u);
    pt.y = Math.max(pt.y, world.terrainHeight(pt.x, pt.z) + 1.25 + Math.sin(u * Math.PI) * 1.3);
    return pt;
  };
  const cameraFrom = engine.camera.position.clone(), lookFrom = engine.look.clone();
  const mobile = innerWidth < 760;
  const approach = target.clone().sub(center); approach.y = 0;
  approach.normalize().multiplyScalar(id === 'tycho' ? 25 : 14); approach.y = id === 'tycho' ? 13 : 8;
  const cameraTo = center.clone().add(mobile ? approach : id === 'tycho' ? new THREE.Vector3(12, 10, 16) : new THREE.Vector3(5.5, 4.8, 7.5));
  // On desktop the object sits to the left of the discovery panel.
  const lookTo = center.clone().add(new THREE.Vector3(mobile ? 0 : 2.5, mobile ? (id === 'tycho' ? -5.3 : -2.5) : 0.5, 0));
  const endAngle = Math.atan2(center.x - target.x, center.z - target.z);
  const qEnd = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, endAngle, 0));
  await engine.animate(duration(2.2), t => {
    const p = sampleMoonPoint(t);
    const pAhead = sampleMoonPoint(Math.min(1, t + 0.025));
    const pBehind = sampleMoonPoint(Math.max(0, t - 0.025));
    world.novi.root.position.copy(p);
    _flightTan.copy(pAhead).sub(pBehind);
    if (_flightTan.lengthSq() > 1e-6) {
      _flightTan.normalize();
      _flightTanA.copy(sampleMoonPoint(Math.min(1, t + 0.05))).sub(p).normalize();
      _flightTanB.copy(p).sub(sampleMoonPoint(Math.max(0, t - 0.05))).normalize();
      _flightTurn.copy(_flightTanA).sub(_flightTanB);
      _flightUp.copy(_worldUp).addScaledVector(_flightTurn, 2.2).normalize();
      _flightAhead.copy(p).add(_flightTan);
      _flightQuat.setFromRotationMatrix(_flightMat.lookAt(_flightAhead, p, _flightUp));
      const startBlend = THREE.MathUtils.smoothstep(t, 0, 0.22);
      const endBlend = THREE.MathUtils.smoothstep(t, 0.72, 1);
      world.novi.root.quaternion.copy(qFrom).slerp(_flightQuat, startBlend).slerp(qEnd, endBlend);
    }
    engine.camera.position.lerpVectors(cameraFrom, cameraTo, t); engine.look.lerpVectors(lookFrom, lookTo, t);
  }, signal);
  if (signal.aborted) return;
  settle(); world.novi.setScanning(true); ui.showDiscovery(id);
}

async function back() {
  if (busy) return;
  if (world?.kind === 'wonder') {
    const signal = begin(world.visiting ? 'Returning to our lookout…' : 'Folding our explorer boots. Returning to the continent…');
    try {
      if (world.visiting) {
        if (!await world.focus(null, engine, duration(1.2), signal)) return;
        world.resize(engine); settle(); return;
      }
      const region = world.region;
      const nextPromise = import('./scenes/earth.js').then(m => m.createEarth(engine)).then(value => ({ value }), error => ({ error }));
      const from = world.novi.root.position.clone(), earthMode = world.novi.earthMode;
      world.novi.setMoving(true);
      await engine.animate(duration(1.5), t => {
        world.novi.setEarthMode(earthMode * (1 - t));
        world.novi.root.position.copy(from).add(new THREE.Vector3(0, t * 4, 0));
      }, signal);
      const result = await nextPromise;
      if (signal.aborted) { if (result.value) disposeScene(result.value.scene); return; }
      if (result.error) throw result.error;
      result.value.setLevel(region); result.value.controls.setPose(earthRegions[region]);
      swap(result.value); ui.earthRegion(region); settle(); return;
    } catch (error) { if (!signal.aborted) report(error); }
    return;
  }
  if (world?.kind === 'earth') {
    if (!world.region) { await home(); return; }
    const target = world.visiting ? world.region : 'globe';
    const signal = begin(target === 'globe' ? 'Returning to our Earth overview…' : 'Returning to the continent overview…');
    try {
      if (!await world.focus(target, engine, duration(1.2), signal)) return;
      ui.world('earth', world.labels); ui.earthRegion(world.region); settle();
    } catch (error) { if (!signal.aborted) report(error); }
    return;
  }
  if (world?.kind === 'sun') {
    const signal = begin('Returning to our solar viewing point…');
    const view = world.view(), from = world.novi.root.position.clone();
    const to = new THREE.Vector3(-5, -3.7, 5);
    const qFrom = world.novi.root.quaternion.clone();
    const toQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.04, 0.35, -0.08));
    const mid = from.clone().lerp(to, 0.5);
    mid.z = Math.max(mid.z, 6.4);
    const arcCurve = new THREE.CatmullRomCurve3([from, mid, to]);
    world.novi.setMoving(true);
    const flight = engine.animate(duration(1.2), t => {
      applyFlightPose(world.novi, arcCurve, { fromQuat: qFrom, toQuat, endBlendStart: 0.65, bankGain: 2.6 }, t);
    }, signal);
    await engine.view(view.position, view.look, duration(1.2), signal); await flight;
    if (signal.aborted) return;
    world.visiting = false; settle(); return;
  }
  if (world?.kind === 'space' && world.visitingPlanet) {
    const signal = begin('Pulling back to the solar system overview…');
    try {
      const overview = world.overviewPose();
      const visitPose = world.currentVisitPose?.();
      const shipFrom = world.novi.root.position.clone();
      const scaleFrom = world.novi.root.scale.x;
      const qFrom = world.novi.root.quaternion.clone();
      const qTo = new THREE.Quaternion().setFromEuler(overview.noviPose.rotation);
      const startDir = (visitPose?.tangent || new THREE.Vector3(0, 0, 1).applyQuaternion(qFrom)).clone().normalize();
      const endDir = overview.noviPose.position.clone().sub(shipFrom).normalize();
      const curve = makeFlightCurve(shipFrom, overview.noviPose.position, startDir, endDir, 0.1);
      world.visitingPlanet = null;
      world.novi.setMoving(true);
      const flight = engine.animate(duration(1.35), t => {
        applyFlightPose(world.novi, curve, {
          fromQuat: qFrom,
          toQuat: qTo,
          scaleFrom,
          scaleTo: overview.noviPose.scale,
          endBlendStart: 0.68,
          bankGain: 3.0,
        }, t);
      }, signal);
      await engine.view(overview.position, overview.look, duration(1.35), signal);
      await flight;
      if (signal.aborted) return;
      world.novi.root.rotation.copy(overview.noviPose.rotation);
      world.setIdle(true);
      settle();
      ui.status('Returned to the solar system.');
    } catch (error) { if (!signal.aborted) report(error); }
    return;
  }
  if (world?.kind !== 'moon') { await home(); return; }
  const signal = begin('Pulling back for a little perspective…');
  const destination = world.overviewPosition();
  await engine.view(destination, new THREE.Vector3(0, 0, -0.5), duration(1.2), signal);
  if (signal.aborted) return;
  world.visiting = false; settle();
}

try {
  engine = new Engine(app, id => world?.kind === 'space' ? destination(id) : inspect(id));
  engine.onFrame = () => ui.project(engine);
  engine.onContextLost = () => { operation.abort(); ui.error('The graphics connection was interrupted. Reload to restart from space.'); };
  applyMotion();
  await home(true);
} catch (error) { report(error); }
