import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GlobeControls, longitudeDelta } from '../src/core/globe-controls.js';
import { continents, earthRegions, earthSites, globePose } from '../src/data/earth.js';
import { geographicPoint, globeFrame, anchorVisible, createEarth } from '../src/scenes/earth.js';
import { discoveries } from '../src/data/discoveries.js';
import { disposeScene } from '../src/core/dispose.js';

class Surface {
  constructor() { this.handlers = new Map(); this.captures = new Set(); }
  addEventListener(name, fn) { if (!this.handlers.has(name)) this.handlers.set(name, new Set()); this.handlers.get(name).add(fn); }
  removeEventListener(name, fn) { this.handlers.get(name)?.delete(fn); }
  setPointerCapture(id) { this.captures.add(id); }
  releasePointerCapture(id) { this.captures.delete(id); }
  send(name, data = {}) { const event = { button: 0, pointerId: 1, clientX: 100, clientY: 100, deltaX: 0, deltaY: 0, deltaMode: 0, preventDefault() {}, ...data }; for (const handler of this.handlers.get(name) || []) handler(event); return event; }
}
test('globe supports taps, drag, scrolling, pinch, cancellation and disabled navigation', () => {
  const s = new Surface(), c = new GlobeControls(); c.attach(s);
  s.send('pointerdown'); assert.equal(c.canPick({pointerId:1}), true);
  s.send('pointermove', {clientX:103}); assert.equal(c.canPick({pointerId:1}), true);
  s.send('pointerup');
  const start = c.pose.lon;
  s.send('pointerdown'); s.send('pointermove', {clientX:150});
  assert.notEqual(c.pose.lon, start); assert.equal(c.canPick({pointerId:1}), false); s.send('pointerup');
  const zoom = c.pose.zoom;
  s.send('pointerdown', {clientX:100}); s.send('pointerdown', {pointerId:2,clientX:200});
  s.send('pointermove', {pointerId:2,clientX:250});
  assert.ok(c.pose.zoom < zoom); assert.equal(c.canPick({pointerId:2}), false);
  s.send('pointerup', {pointerId:2}); assert.equal(c.canPick({pointerId:1}), false); s.send('pointerup');
  const beforeWheel = c.pose.lon; let prevented = false;
  s.send('wheel', {deltaY:80,preventDefault(){prevented=true;}}); assert(prevented); assert.notEqual(c.pose.lon,beforeWheel);
  s.send('pointerdown'); s.send('pointercancel'); assert.equal(c.canPick({pointerId:1}), false);
  c.setEnabled(false); const paused = {...c.pose}; s.send('wheel',{deltaY:90}); s.send('pointerdown'); s.send('pointermove',{clientX:300}); assert.deepEqual(c.pose,paused);
  c.setEnabled(true); c.setPose({lat:900,lon:1081,zoom:.01}); assert.equal(c.pose.lat,75); assert.equal(c.pose.lon,1); assert.equal(c.pose.zoom,.62);
  const finite = {...c.pose}; c.setPose({lat:NaN}); assert.deepEqual(c.pose,finite);
  c.dispose(); assert.equal(s.captures.size,0); assert([...s.handlers.values()].every(set=>set.size===0));
  assert.equal(longitudeDelta(179,-179),2);
});
test('equirectangular geography and rear-side node occlusion agree', () => {
  assert.ok(geographicPoint(0,0,1).distanceTo(new THREE.Vector3(1,0,0))<1e-10);
  assert.ok(geographicPoint(0,90,1).distanceTo(new THREE.Vector3(0,0,-1))<1e-10);
  assert.ok(geographicPoint(90,0,1).distanceTo(new THREE.Vector3(0,1,0))<1e-10);
  const point=geographicPoint(-7.54,110.446,4.3);
  assert(anchorVisible(point,point.clone().multiplyScalar(4)));
  assert.equal(anchorVisible(point,point.clone().multiplyScalar(-4)),false);
  assert.equal(continents.length,7); assert.deepEqual(continents.filter(c=>c.available).map(c=>c.id),['asia']);
  for(const id of earthRegions.asia.sites){assert.equal(earthSites[id].region,'asia');assert.ok(discoveries[id].sourceIds.length);}
  assert.equal(earthSites.merapi.lat,-7.54);assert.equal(earthSites.merapi.lon,110.446);
});
test('Earth, Asia and site framing keep discovery nodes out of interface panels', () => {
  for(const [width,height] of [[1280,720],[1920,1080],[390,844],[390,650],[360,640],[760,844],[844,390]]){
    const camera=new THREE.PerspectiveCamera(43,width/height,.1,1200);
    for(const [pose,points,discovery] of [
      [globePose,[continents[0]],false],
      [earthRegions.asia,Object.values(earthSites),false],
      ...Object.values(earthSites).map(site=>[site,[site],true]),
    ]){
      const view=globeFrame(pose,width,height,discovery);camera.position.copy(view.position);camera.lookAt(view.look);camera.updateMatrixWorld();
      const projected=[];
      for(const point of points){
        const p=geographicPoint(point.lat,point.lon,4.3).project(camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2;
        assert(x>25&&x<width-25&&y>88&&y<height-60,`${width}x${height} at ${point.lat},${point.lon}: ${x},${y}`);
        if(discovery&&width<760)assert(y+22<height-60-height*(height<=730?.46:.45),'phone discovery panel');
        if(discovery&&width>=760)assert(x+22<width-424,'desktop discovery panel');
        projected.push({x,y});
      }
      if(!discovery&&points.length>1)for(let i=0;i<projected.length;i++)for(let j=i+1;j<projected.length;j++)assert(Math.hypot(projected[i].x-projected[j].x,projected[i].y-projected[j].y)>=44,'Asia tap targets must remain separate');
    }
  }
});
test('Earth navigation is expandable, cancellable and releases gesture listeners on exit', async () => {
  globalThis.innerWidth=390;globalThis.innerHeight=844;
  const surface=new Surface(),engine={renderer:{domElement:surface},camera:new THREE.PerspectiveCamera(43,390/844,.1,1200),look:new THREE.Vector3(),paused:false,
    async animate(seconds,draw,signal){if(signal?.aborted)return false;draw(1);return true;}};
  const world=await createEarth(engine,{map:new THREE.Texture()}); world.activate(); world.resize(engine); world.setInteractive(true);
  assert.deepEqual(world.labels.map(l=>l.id),['asia']);
  assert(await world.focus('asia',engine,0));assert.equal(world.region,'asia');assert.equal(world.labels.length,3);
  assert(await world.focus('merapi',engine,0));assert.equal(world.visiting,true);
  world.setInteractive(true);assert.equal(world.controls.enabled,false);
  assert(await world.focus('asia',engine,0));assert.equal(world.visiting,false);
  const aborted=new AbortController();aborted.abort();assert.equal(await world.focus('globe',engine,0,aborted.signal),false);
  const root=world.novi.root.position.clone();world.update(0,10,{paused:true});assert(world.novi.root.position.equals(root));
  world.deactivate();disposeScene(world.scene);assert.equal(world.scene.children.length,0);assert([...surface.handlers.values()].every(set=>set.size===0));
});
