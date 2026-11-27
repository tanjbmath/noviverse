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

async function home(initial = false) {
  if (!engine) return;
  const signal = begin(initial ? 'Preparing a universe of discoveries…' : 'Heading home to our blue planet…');
  try {
    if (world?.kind === 'space') {
      world.setIdle(true); world.resize(engine); world.novi.root.rotation.set(0.06, -0.33, -0.08);
      ui.world('space', world.labels); settle(); return;
    }
    // Start the lazy module/assets while the ascent plays. Result wrappers prevent unhandled rejections.
    const nextPromise = import('./scenes/space.js').then(m => m.createSpace(engine)).then(value => ({ value }), error => ({ error }));
    if (world) {
      world.novi.setMoving(true); const from = world.novi.root.position.clone(), earthMode = world.novi.earthMode;
      await engine.animate(duration(1.4), t => {
        world.novi.root.position.copy(from).add(new THREE.Vector3(0, t * 12, -t * 5));
        if (world.kind === 'moon') world.novi.setTransform(1 - t);
        if (world.kind === 'wonder') world.novi.setEarthMode(earthMode * (1 - t));
      }, signal);
    }
    const result = await nextPromise;
    if (signal.aborted) { if (result.value) disposeScene(result.value.scene); return; }
    if (result.error) throw result.error;
    swap(result.value); settle(); ui.status('Welcome to space. All three destinations are open.');
  } catch (error) { if (!signal.aborted) report(error); }
}

async function destination(id) {
  if (busy || !world || !['moon', 'earth', 'sun'].includes(id)) return;
  if (world.kind !== 'space') return;
  const signal = begin(id === 'moon' ? 'Course set for the Moon. Let’s follow our curiosity.' : `Flying to our ${id === 'earth' ? 'Earth' : 'Sun'} viewing point…`);
  try {
    world.novi.setMoving(true);
    if (id === 'sun') {
      const nextPromise = import('./scenes/sun.js').then(m => m.createSolarScene()).then(value => ({ value }), error => ({ error }));
      const shipFrom = world.novi.root.position.clone();
      const shipTo = world.sun.position.clone().add(new THREE.Vector3(-1.5, -1, 3));
      const flight = engine.animate(duration(2.2), t => world.novi.root.position.lerpVectors(shipFrom, shipTo, t), signal);
      await engine.view(world.sun.position.clone().add(new THREE.Vector3(0, 0, 6)), world.sun.position.clone(), duration(2.2), signal);
      await flight;
      const result = await nextPromise;
      if (signal.aborted) { if (result.value) disposeScene(result.value.scene); return; }
      if (result.error) throw result.error;
      swap(result.value); settle(); ui.status('Welcome to the solar observatory. Tap a glowing node to investigate our star.'); return;
    }
    if (id === 'earth') {
      const nextPromise = import('./scenes/earth.js').then(m => m.createEarth(engine)).then(value => ({ value }), error => ({ error }));
      const object = world.earth, from = world.novi.root.position.clone();
      const to = object.position.clone().add(new THREE.Vector3(-2, -1, 5));
      const flight = engine.animate(duration(2.2), t => world.novi.root.position.lerpVectors(from, to, t), signal);
      await engine.view(object.position.clone().add(new THREE.Vector3(0, 0, 10)), object.position.clone(), duration(2.2), signal);
      await flight;
      const result = await nextPromise;
      if (signal.aborted) { if (result.value) disposeScene(result.value.scene); return; }
      if (result.error) throw result.error;
      swap(result.value); ui.earthRegion(null); settle();
      ui.status('Welcome to Earth. Drag, swipe or scroll to turn the globe. Tap a glowing node to explore the first continent.'); return;
    }
    const nextPromise = import('./scenes/moon.js').then(m => m.createMoon(engine)).then(value => ({ value }), error => ({ error }));
    const shipFrom = world.novi.root.position.clone(), shipTo = world.moon.position.clone().add(new THREE.Vector3(0, 0, 1.4));
    const cameraFrom = engine.camera.position.clone(), lookFrom = engine.look.clone();
    const cameraTo = shipTo.clone().add(new THREE.Vector3(0.5, 0.6, 3.5));
    await engine.animate(duration(2.4), t => {
      world.novi.root.position.lerpVectors(shipFrom, shipTo, t);
      world.novi.root.position.y += Math.sin(t * Math.PI) * 1.2;
      const heading = Math.atan2(shipTo.x - shipFrom.x, shipTo.z - shipFrom.z);
      world.novi.root.rotation.y = -0.33 + Math.min(1, t * 3) * (heading + 0.33);
      engine.camera.position.lerpVectors(cameraFrom, cameraTo, t);
      engine.look.lerpVectors(lookFrom, shipTo, t);
    }, signal);
    const result = await nextPromise;
    if (signal.aborted) { if (result.value) disposeScene(result.value.scene); return; }
    if (result.error) throw result.error;
    swap(result.value); ui.setBusy(true, 'Engines pivoting. Wings folding. Hello, lunar hovercraft!');
    world.novi.setMoving(true); world.novi.root.rotation.y = -0.5;
    await engine.animate(duration(2.3), t => {
      world.novi.setTransform(t);
      world.novi.root.position.set(0, 1.1 + (1 - t) * 6, 9 + (1 - t) * 4);
    }, signal);
    if (signal.aborted) return;
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
    const view = world.view(true);
    const flight = engine.animate(duration(1.6), t => world.novi.root.position.lerpVectors(from, to, t), signal);
    await engine.view(view.position, view.look, duration(1.6), signal); await flight;
    if (signal.aborted) return;
    settle(); world.novi.setScanning(true); ui.showDiscovery(id); return;
  }
  const data = discoveries[id], target = new THREE.Vector3(...data.stop), from = world.novi.root.position.clone();
  target.y = world.terrainHeight(target.x, target.z) + 1;
  const center = new THREE.Vector3(...data.position); center.y = world.terrainHeight(center.x, center.z);
  // Flight is lifted above the terrain and debris, with a soft automatic landing.
  const path = new THREE.CatmullRomCurve3([from, from.clone().lerp(target, 0.4).add(new THREE.Vector3(0, 2, 2)), target]);
  const cameraFrom = engine.camera.position.clone(), lookFrom = engine.look.clone();
  const mobile = innerWidth < 760;
  const approach = target.clone().sub(center); approach.y = 0;
  approach.normalize().multiplyScalar(id === 'tycho' ? 25 : 14); approach.y = id === 'tycho' ? 13 : 8;
  const cameraTo = center.clone().add(mobile ? approach : id === 'tycho' ? new THREE.Vector3(12, 10, 16) : new THREE.Vector3(5.5, 4.8, 7.5));
  // On desktop the object sits to the left of the discovery panel.
  const lookTo = center.clone().add(new THREE.Vector3(mobile ? 0 : 2.5, mobile ? (id === 'tycho' ? -5.3 : -2.5) : 0.5, 0));
  await engine.animate(duration(2.2), t => {
    const p = path.getPoint(t); p.y = Math.max(p.y, world.terrainHeight(p.x, p.z) + 1.25 + Math.sin(t * Math.PI) * 1.3);
    world.novi.root.position.copy(p);
    const angle = Math.atan2(center.x - p.x, center.z - p.z);
    world.novi.root.rotation.y = angle;
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
    const flight = engine.animate(duration(1.2), t => world.novi.root.position.lerpVectors(from, new THREE.Vector3(-5, -3.7, 5), t), signal);
    await engine.view(view.position, view.look, duration(1.2), signal); await flight;
    if (signal.aborted) return;
    world.visiting = false; settle(); return;
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
