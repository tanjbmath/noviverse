import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSpace, bodyView, overviewView, companionView } from '../src/scenes/space.js';
import { SpaceControls } from '../src/core/orbit-controls.js';
import { celestialBodies, planets } from '../src/data/universe.js';
import { createNovi } from '../src/models/novi.js';
import { disposeScene } from '../src/core/dispose.js';
import { placeNode } from '../src/core/node-layout.js';

class Surface {
  constructor(){this.handlers=new Map();}
  addEventListener(name,fn){if(!this.handlers.has(name))this.handlers.set(name,new Set());this.handlers.get(name).add(fn);}
  removeEventListener(name,fn){this.handlers.get(name)?.delete(fn);}
  setPointerCapture(){} releasePointerCapture(){}
  send(name,data={}){const e={pointerId:1,button:0,clientX:100,clientY:100,deltaY:0,deltaMode:0,preventDefault(){},...data};for(const fn of this.handlers.get(name)||[])fn(e);return e;}
}
function engineFor(width=1280,height=800){
  globalThis.innerWidth=width;globalThis.innerHeight=height;
  return {camera:new THREE.PerspectiveCamera(43,width/height,.1,1200),look:new THREE.Vector3(),paused:false,frameDelta:1/60,renderer:{domElement:new Surface()},
    async animate(seconds,draw,signal){if(signal?.aborted)return false;draw(1);return true;},
    async view(position,look,seconds,signal){if(signal?.aborted)return false;this.camera.position.copy(position);this.look.copy(look);return true;}};
}
async function setup(width,height){const engine=engineFor(width,height),world=await createSpace(engine,{textures:[new THREE.Texture(),new THREE.Texture()]});world.resize(engine);world.activate(engine);return {world,engine};}

test('solar system includes eight independently rotating, orbiting planets and Earth’s Moon',async()=>{
  const {world,engine}=await setup(1280,800);
  assert.equal(planets.length,8);assert.equal(world.labels.length,10);
  assert.deepEqual(Object.keys(world.objects),celestialBodies.map(b=>b.id));
  for(const data of celestialBodies.filter(b=>b.parent)){
    const radius=world.objects[data.id].position.distanceTo(world.objects[data.parent].position);
    assert.ok(Math.abs(radius-data.visual.orbit)<1e-9);
    const before=world.objects[data.id].position.clone(),rotation=world.models[data.id].surface.rotation.y;
    world.update(1,1,engine);assert.notEqual(world.models[data.id].surface.rotation.y,rotation);
    assert.ok(world.objects[data.id].position.distanceTo(before)>.001);
  }
  const before=world.objects.earth.position.clone(),rotation=world.models.earth.surface.rotation.y;
  engine.paused=true;world.update(0,2,engine);assert.ok(world.objects.earth.position.equals(before));assert.equal(world.models.earth.surface.rotation.y,rotation);
  world.deactivate();assert([...engine.renderer.domElement.handlers.values()].every(set=>set.size===0));disposeScene(world.scene);
});

test('click-to-fly, focus, orbit locking, reset and cancellation preserve scene ownership',async()=>{
  const {world,engine}=await setup(1280,800);
  const abort=new AbortController();abort.abort();const pose=engine.camera.position.clone();
  assert.equal(await world.focus('earth',engine,0,abort.signal),false);assert.ok(engine.camera.position.equals(pose));
  assert.equal(await world.focus('missing',engine,0),false);
  for(const id of Object.keys(world.objects)){
    assert.equal(await world.focus(id,engine,0),true);assert.equal(world.focused,id);
    const before=world.objects[id].position.clone();world.setInteractive(true);world.update(1,2,engine);assert.ok(world.objects[id].position.equals(before));
    assert.ok(world.novi.root.position.distanceTo(before)>0);assert.ok(engine.camera.position.distanceTo(before)>3);
    assert.equal(world.targets.length,1);assert.equal(world.targets[0],world.objects[id]);
    assert.equal(world.objects[id].visible,true);
    const direction=world.objects[id].position.clone().sub(engine.camera.position).normalize();
    world.scene.updateMatrixWorld(true);
    const hit=new THREE.Raycaster(engine.camera.position,direction).intersectObjects(world.targets,true)[0];
    let node=hit?.object;while(node&&!node.userData.poi)node=node.parent;
    assert.equal(node?.userData.poi,id,'planet mesh can be selected directly');
    world.scene.updateMatrixWorld(true);world.scene.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
  }
  assert.equal(await world.reset(engine,0),true);assert.equal(world.focused,null);world.setInteractive(true);
  assert.equal(world.targets.length,10);assert(Object.values(world.objects).every(object=>object.visible));
  const earth=world.objects.earth.position.clone();world.update(1,3,engine);assert.ok(world.objects.earth.position.distanceTo(earth)>0);
  world.deactivate();disposeScene(world.scene);
});

test('planet framing clears the discovery panel on desktop, portrait and landscape phones',()=>{
  for(const [w,h]of [[1440,900],[1280,720],[390,844],[360,640],[844,390],[760,844]]){
    const engine=engineFor(w,h);
    const overview=overviewView(w,h);assert.ok(overview.position.length()<1100);
    for(const data of celestialBodies){
      const point=new THREE.Vector3(10,0,3),view=bodyView(data.id,point,w,h);
      engine.camera.position.copy(view.position);engine.camera.lookAt(view.look);engine.camera.updateMatrixWorld();
      const p=point.clone().project(engine.camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;
      assert.ok(x>20&&y>70&&x<w-20,`${data.id} ${w}x${h}: ${x},${y}`);
      if(w<760)assert.ok(y<h-112-h*.43,'body above phone panel');else assert.ok(x<w-424,'body beside desktop panel');
      const ship=companionView(view,w,h),s=ship.position.clone().project(engine.camera);
      const sx=(s.x+1)*w/2,sy=(1-s.y)*h/2;
      assert(sx>40&&sx<w-40&&sy>100&&sy<h-80,'Novi remains on screen beside every planet');
      if(w<760)assert(sy+40<h-112-h*.43,'Novi clears phone panel');
    }
  }
});

test('space gestures damp orbit, wheel zoom, pinch, cancel and suppress accidental flight',()=>{
  const surface=new Surface(),c=new SpaceControls();c.attach(surface);
  surface.send('pointerdown');assert(c.canPick({pointerId:1}));surface.send('pointerup');
  const theta=c.goal.theta;surface.send('pointerdown');surface.send('pointermove',{clientX:180});assert.notEqual(c.goal.theta,theta);assert.equal(c.canPick({pointerId:1}),false);surface.send('pointerup');
  const distance=c.goal.distance;surface.send('wheel',{deltaY:100});assert(c.goal.distance>distance);
  surface.send('pointerdown');surface.send('pointerdown',{pointerId:2,clientX:200});const pinch=c.goal.distance;
  surface.send('pointermove',{pointerId:2,clientX:260});assert(c.goal.distance<pinch);assert.equal(c.canPick({pointerId:2}),false);
  surface.send('pointercancel',{pointerId:2});assert.equal(c.canPick({pointerId:1}),false);
  c.setEnabled(false);const locked={...c.goal};surface.send('wheel',{deltaY:-100});assert.deepEqual(c.goal,locked);
  c.setEnabled(true);c.zoom(1e10);assert.equal(c.goal.distance,650);c.zoom(1e-10);assert.equal(c.goal.distance,c.minDistance);
  c.rotate(0,1e8);assert(c.goal.phi>=.15);c.dispose();assert([...surface.handlers.values()].every(set=>set.size===0));
});

test('hover respects root navigation, travel extends exhaust, reduced motion freezes local animation',()=>{
  const novi=createNovi(),hull=novi.root.children[0];novi.root.position.set(2,3,4);const root=novi.root.position.clone();
  novi.update(Math.PI/3);assert(hull.position.y>.2);assert(novi.root.position.equals(root));
  const flame=novi.root.getObjectByName('Exhaust plume'),idle=flame.scale.y;
  novi.setMoving(true);for(let i=0;i<120;i++)novi.update(2+i/60,false,1/60);
  assert(flame.scale.y>idle*3);assert(Math.abs(hull.position.y)<.036);assert(novi.root.position.equals(root));
  novi.update(5,true,0);assert.equal(hull.position.y,0);assert.equal(hull.rotation.x,0);
  const particles=novi.root.getObjectByName('Exhaust particles').geometry.attributes.position;
  const before=Array.from(particles.array);novi.update(20,true,0);assert.deepEqual(Array.from(particles.array),before);
  const scene=new THREE.Scene();scene.add(novi.root);disposeScene(scene);
});

test('compressed discovery nodes retain separate touch areas and stay on screen',()=>{
  for(const [width,height]of [[390,844],[1280,720]]){
    const placed=[];
    for(let i=0;i<8;i++){
      const point=placeNode({x:width/2+i*2,y:height/2},placed,width,height);
      if(!point)continue;
      assert(placed.every(other=>Math.hypot(point.x-other.x,point.y-other.y)>=46));
      assert(point.x>=25&&point.x<=width-25&&point.y>=88&&point.y<=height-105);placed.push(point);
    }
    assert(placed.length>=6);
  }
});
