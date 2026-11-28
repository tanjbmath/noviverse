import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { planets, bodies, bodyById, orbitPosition } from '../src/data/astronomy.js';
import { createSolarSystem, createNavigation } from '../src/scenes/solar-system.js';
import { createRocket } from '../src/models/rocket.js';
import { disposeScene } from '../src/core/dispose.js';

function setup(width=1280,height=800){
  const engine={camera:new THREE.PerspectiveCamera(43,width/height,.1,1200),look:new THREE.Vector3(),renderer:{capabilities:{getMaxAnisotropy:()=>4}},paused:false};
  const textures=Object.fromEntries(bodies.filter(b=>b.texture).map(b=>[b.id,new THREE.Texture()]));
  return{engine,textures};
}
test('astronomy catalog covers eight ordered planets, Sun and Moon with sourced discoveries',()=>{
  assert.deepEqual(planets.map(b=>b.id),['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']);
  assert.equal(new Set(bodies.map(b=>b.id)).size,10);
  for(const b of bodies){assert(b.diameter>0);assert.equal(b.facts.length,3);assert(b.question[2]>=0&&b.question[2]<b.question[1].length);assert(bodyById[b.id].source.startsWith('https://science.nasa.gov/'));}
  for(const b of planets)for(const time of [0,100,10000])assert(Math.abs(Math.hypot(...orbitPosition(b,time))-b.orbit)<1e-9);
});
test('solar scene preserves construction camera, animates orbits, locks focus and releases every texture',async()=>{
  const {engine,textures}=setup(),initial=engine.camera.position.clone();
  let disposed=0;Object.values(textures).forEach(t=>t.addEventListener('dispose',()=>disposed++));
  const world=await createSolarSystem(engine,{textures});assert(engine.camera.position.equals(initial));
  world.resize();const before=world.objects.earth.position.clone();world.update(1,1);assert(world.objects.earth.position.distanceTo(before)>.1);
  world.setTravelling(true);const lock=world.objects.earth.position.clone();world.update(2,3);assert(world.objects.earth.position.equals(lock));
  world.setFocused('saturn');world.setTravelling(false);const spin=world.objects.saturn.userData.surface.rotation.y;
  world.update(2,5);assert(world.objects.earth.position.equals(lock));assert(world.objects.saturn.userData.surface.rotation.y>spin);
  world.update(0,5);const sun=world.scene.children.find(o=>o===world.objects.sun);assert(sun);
  world.scene.updateMatrixWorld(true);world.scene.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite)));
  assert.equal(world.nodes.length,3);assert(world.targets.includes(world.objects.sun.children[0]));
  disposeScene(world.scene);assert.equal(disposed,9);assert.equal(world.scene.children.length,0);
});
test('focused worlds and discovery nodes fit desktop and phone camera framing',async()=>{
  for(const [width,height] of [[1280,800],[1920,1080],[390,844],[360,640],[760,844],[844,390]]){
    const {engine,textures}=setup(width,height),world=await createSolarSystem(engine,{textures});
    for(const b of bodies){
      world.setFocused(b.id);const view=world.focusView(b.id,width,height);engine.camera.position.copy(view.position);engine.camera.lookAt(view.look);engine.camera.updateMatrixWorld();world.update(0,0);
      const center=world.objects[b.id].position.clone().project(engine.camera),cx=(center.x+1)*width/2,cy=(1-center.y)*height/2;
      assert(cx>22&&cx<width-22&&cy>95&&cy<height-155,`${b.id} ${width}x${height} center ${cx},${cy}`);
      const screenNodes=[];for(const node of world.nodes){const p=node.position.clone().project(engine.camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2;screenNodes.push([x,y]);assert(x>22&&x<width-22&&y>90&&y<height-(height<600?120:145),`${b.id} node ${width}x${height}: ${x},${y}`); if(width<700)assert(y+22<height-159-height*(height<740?.28:.30),`${b.id} phone panel clearance`); else assert(x+22<width-(width<=1000?320:360),`${b.id} desktop panel clearance`);}
      for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert(Math.hypot(screenNodes[i][0]-screenNodes[j][0],screenNodes[i][1]-screenNodes[j][1])>=44,`${b.id} ${width} node separation`);
    }disposeScene(world.scene);
  }
});
test('rocket idle motion preserves travel coordinates, freezes with reduced motion, and disposes',()=>{
  const rocket=createRocket(),scene=new THREE.Scene();scene.add(rocket.root);rocket.root.position.set(2,3,4);const start=rocket.root.position.clone();
  rocket.update(1);assert(rocket.hull.position.y>.1);assert(rocket.root.position.equals(start));rocket.setMoving(true);rocket.update(3);assert(rocket.root.position.equals(start));rocket.update(3,true);assert.equal(rocket.hull.position.y,0);assert.equal(rocket.hull.rotation.z,0);
  scene.updateMatrixWorld(true);scene.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite)));assert(rocket.root.getObjectByName('Swept flight fin'));disposeScene(scene);
});

test('orbit navigation separates taps from drag, pinch, cancellation and disabled travel',()=>{
  class Surface extends EventTarget {
    constructor(){super();this.style={};this.clientWidth=1280;this.clientHeight=800;this.document=new EventTarget();}
    getRootNode(){return this.document;}
    setPointerCapture(){} releasePointerCapture(){} hasPointerCapture(){return true;}
    getBoundingClientRect(){return {left:0,top:0,width:1280,height:800};}
  }
  const element=new Surface(), camera=new THREE.PerspectiveCamera(43,1.6,.1,1200);camera.position.set(0,50,100);
  let nav, picks=[];element.addEventListener('pointerup',e=>picks.push(nav.canPick(e)));
  nav=createNavigation(camera,element,new THREE.Vector3());
  const event=(name,id,x,y,type='mouse')=>{const e=new Event(name,{cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:y,pageX:x,pageY:y,pointerType:type,button:0,ctrlKey:false,metaKey:false,shiftKey:false});element.dispatchEvent(e);};
  event('pointerdown',1,100,100);event('pointerup',1,100,100);assert.equal(picks.pop(),true);
  event('pointerdown',2,100,100);event('pointermove',2,130,110);event('pointerup',2,130,110);assert.equal(picks.pop(),false);
  event('pointerdown',3,100,100,'touch');event('pointerdown',4,200,100,'touch');event('pointerup',3,100,100,'touch');event('pointerup',4,200,100,'touch');assert.equal(picks.pop(),false);assert.equal(picks.pop(),false);
  event('pointerdown',5,100,100);event('pointercancel',5,100,100);event('pointerup',5,100,100);assert.equal(picks.pop(),false);
  nav.setEnabled(false);event('pointerdown',6,100,100);event('pointerup',6,100,100);assert.equal(picks.pop(),false);
  nav.setEnabled(true);event('pointerdown',7,100,100);event('pointerup',7,100,100);assert.equal(picks.pop(),true);nav.dispose();
});

test('Home cancellation stops earlier camera motion before the next journey',async()=>{
  const { Engine }=await import('../src/core/engine.js');
  const engine=Object.create(Engine.prototype);engine.camera=new THREE.PerspectiveCamera();engine.look=new THREE.Vector3();engine.tweens=new Set();
  const old=new AbortController();const first=engine.view(new THREE.Vector3(20,30,40),new THREE.Vector3(4,5,6),2,old.signal);
  for(const step of [...engine.tweens])step(.5);old.abort();const interrupted=engine.camera.position.clone();assert.equal(await first,false);assert.equal(engine.tweens.size,0);
  const second=engine.view(new THREE.Vector3(0,90,130),new THREE.Vector3(),1,new AbortController().signal);
  assert(engine.camera.position.equals(interrupted));for(const step of [...engine.tweens])step(1);assert.equal(await second,true);assert(engine.camera.position.equals(new THREE.Vector3(0,90,130)));assert.equal(engine.tweens.size,0);
});
