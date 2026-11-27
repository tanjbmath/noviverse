import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createNovi } from '../src/models/novi.js';
import { wonders } from '../src/data/wonders.js';
import { discoveries, sources } from '../src/data/discoveries.js';
import { createWonder, artworkPoint, wonderView } from '../src/scenes/wonder.js';
import { disposeScene } from '../src/core/dispose.js';

test('deferred geography compatibility hooks preserve the new rocket form', () => {
  const novi = createNovi(), scene = new THREE.Scene(); scene.add(novi.root);
  novi.update(0, true, 0);
  const hull = novi.root.children[0], original = new THREE.Box3().setFromObject(novi.root);
  assert.equal(novi.root.getObjectByName('Earth walking rig'), undefined);
  for (const mode of [0, .25, .5, .75, 1, .5, 0]) {
    novi.setEarthMode(mode); novi.setMoving(true); novi.update(2, false, .016);
    assert.equal(novi.earthMode, 0);
    scene.updateMatrixWorld(true); scene.traverse(o => assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
  }
  novi.setMoving(false); novi.update(0, true, 0);
  const restored = new THREE.Box3().setFromObject(novi.root);
  assert.ok(original.min.distanceTo(restored.min) < 1e-10); assert.ok(original.max.distanceTo(restored.max) < 1e-10);
  novi.setEarthMode(1); novi.setMoving(true); novi.update(.2, false, .016);
  const root = novi.root.position.clone(); novi.update(5, true, 0);
  assert.equal(hull.position.y, 0); assert.ok(novi.root.position.equals(root));
  disposeScene(scene);
});

test('all wonder nodes are reachable and selected features stay clear of discovery panels', () => {
  for (const [width, height] of [[1280,720],[1920,1080],[390,844],[390,650],[360,640],[760,844],[844,390]]) {
    const camera = new THREE.PerspectiveCamera(43, width / height, .1, 1200);
    for (const data of Object.values(wonders)) {
      const view = wonderView(width, height); camera.position.copy(view.position); camera.lookAt(view.look); camera.updateMatrixWorld();
      const points = data.features.map(feature => {
        const point = artworkPoint(feature.uv).project(camera);
        const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2;
        assert.ok(x >= 25 && x <= width - 25 && y >= 88 && y <= height - 60, `${data.title} ${feature.id} ${width}x${height}: ${x},${y}`);
        return { x, y };
      });
      for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) assert.ok(Math.hypot(points[i].x-points[j].x, points[i].y-points[j].y) >= 44, '44 px node separation');
      for (const feature of data.features) {
        const close = wonderView(width,height,feature);camera.position.copy(close.position);camera.lookAt(close.look);camera.updateMatrixWorld();
        const p = artworkPoint(feature.uv).project(camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2;
        if(width<760) assert(y+22<height-60-height*(height<=730?.46:.45),'phone panel clearance');
        else assert(x+22<width-424,'desktop panel clearance');
        assert(camera.position.distanceTo(artworkPoint(feature.uv)) < view.position.distanceTo(artworkPoint(feature.uv)), 'closer feature view');
      }
    }
  }
});

test('wonder scene construction, direct picking, focus, abort and texture disposal', async () => {
  globalThis.innerWidth=390;globalThis.innerHeight=844;
  for (const [site, data] of Object.entries(wonders)) {
    const texture = new THREE.Texture(); let disposed = 0; texture.addEventListener('dispose',()=>disposed++);
    const engine = {camera:new THREE.PerspectiveCamera(43,390/844,.1,1200),look:new THREE.Vector3(),renderer:{},paused:false,
      async animate(seconds,draw,signal){if(signal?.aborted)return false;draw(1);return true;},async view(position,look){this.camera.position.copy(position);this.look.copy(look);return true;}};
    const original=engine.camera.position.clone(),world=await createWonder(site,engine,{texture});
    assert(world.novi.root && engine.camera.position.equals(original),'construction cannot move active camera');
    world.resize(engine); world.novi.setEarthMode(1);world.scene.updateMatrixWorld(true);
    for (const label of world.labels) {
      const origin=label.object.position.clone();origin.z=10;
      const hit=new THREE.Raycaster(origin,new THREE.Vector3(0,0,-1)).intersectObjects(world.targets)[0];
      assert.equal(hit?.object.userData.poi,label.id);
      assert.equal(discoveries[label.id].activity,`wonder:${site}`);
      for(const source of discoveries[label.id].sourceIds)assert.ok(sources[source]);
      assert(await world.focus(label.id,engine,0));assert.equal(world.visiting.id,label.id);
    }
    assert(await world.focus(null,engine,0));assert.equal(world.visiting,null);
    const abort=new AbortController();abort.abort();const pose=world.novi.root.position.clone();
    assert.equal(await world.focus(data.features[0].id,engine,0,abort.signal),false);assert.equal(world.visiting,null);assert(world.novi.root.position.equals(pose));
    assert.equal(await world.focus('not-a-node',engine,0),false);
    disposeScene(world.scene);assert.equal(disposed,1);
  }
});
