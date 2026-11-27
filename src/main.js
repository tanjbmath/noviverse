import * as THREE from 'three';
import './style.css';
import { Engine } from './core/engine.js';
import { disposeScene } from './core/dispose.js';
import { Interface } from './ui/interface.js';
import { discoveries } from './data/discoveries.js';
import { bodyById } from './data/universe.js';

const app=document.querySelector('#app');
let engine,world,operation=new AbortController(),busy=true;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ui=new Interface(app,{
  destination,poi:inspect,home,back,detail:openDetail,activity:runActivity,
  motion(){reduced=!reduced;applyMotion();},
  zoom(factor){if(!busy&&world?.kind==='space')world.controls.zoom(factor);},
});
document.querySelector('#boot-status')?.remove();
const duration=seconds=>reduced?.08:seconds;
function applyMotion(){
  if(engine)engine.paused=reduced;
  document.body.classList.toggle('reduced-motion',reduced);
  const button=document.querySelector('[data-action="motion"]');
  button.setAttribute('aria-pressed',String(reduced));button.setAttribute('aria-label',reduced?'Enable cinematic motion':'Reduce motion');
}
function begin(text){
  operation.abort();operation=new AbortController();busy=true;
  ui.closeModal();ui.hideDiscovery();ui.setBusy(true,text);
  world?.setInteractive?.(false);world?.setIdle?.(false);world?.novi.setScanning(false);
  return operation.signal;
}
function settle(){busy=false;ui.setBusy(false);world?.novi.setMoving(false);world?.setInteractive?.(true);}
function swap(next){const old=world;world=next;engine.use(next);ui.world(next.kind,next.labels);if(old)disposeScene(old.scene);}
function report(error){console.error(error);settle();ui.error('The world could not load. Return home to retry, or reload the page.');}

async function home(){
  if(!engine)return;
  const signal=begin('Opening our solar system…');
  try{
    if(world?.kind==='space'){
      if(!await world.reset(engine,duration(1.3),signal))return;
      ui.world('space',world.labels);settle();ui.status('Solar system overview. Drag to orbit, scroll to zoom, or choose any world.');return;
    }
    const module=await import('./scenes/space.js');
    if(signal.aborted)return;
    const next=await module.createSpace(engine);
    if(signal.aborted){disposeScene(next.scene);return;}
    swap(next);settle();ui.status('Welcome aboard. All eight planets, the Sun and Moon are open.');
  }catch(error){if(!signal.aborted)report(error);}
}
async function destination(id){
  if(busy||world?.kind!=='space'||!bodyById[id])return;
  ui.closeModal();
  if(world.focused===id)return;
  const signal=begin(`Course set for ${bodyById[id].name}. Follow your curiosity.`);
  try{
    if(!await world.focus(id,engine,duration(2.6),signal))return;
    settle();ui.showBody(id);
  }catch(error){if(!signal.aborted)report(error);}
}
async function openDetail(id){
  if(busy||world?.kind!=='space'||!['sun','moon'].includes(id))return;
  const signal=begin(id==='sun'?'Opening the solar observatory…':'Approaching the lunar field station…');
  try{
    const module=await (id==='sun'?import('./scenes/sun.js'):import('./scenes/moon.js'));
    if(signal.aborted)return;
    const next=await (id==='sun'?module.createSolarScene():module.createMoon(engine));
    if(signal.aborted){disposeScene(next.scene);return;}
    swap(next);settle();ui.status('Tap an unlabelled discovery node. Home returns to the solar system.');
  }catch(error){if(!signal.aborted)report(error);}
}
async function inspect(id){
  if(busy||!world?.labels.some(label=>label.id===id)||!discoveries[id])return;
  const signal=begin('Novi is taking a closer look…');
  try{
    world.visiting=true;world.novi.setMoving(true);
    const from=world.novi.root.position.clone();
    if(world.kind==='sun'){
      const anchor=world.labels.find(label=>label.id===id).object.position;
      const to=anchor.clone().add(new THREE.Vector3(-.8,-.8,0));to.z=6;
      const view=world.view(true);
      const flight=engine.animate(duration(1.5),t=>world.novi.root.position.lerpVectors(from,to,t),signal);
      await engine.view(view.position,view.look,duration(1.5),signal);await flight;
    }else if(world.kind==='moon'){
      const data=discoveries[id],target=new THREE.Vector3(...data.stop),center=new THREE.Vector3(...data.position);
      target.y=world.terrainHeight(target.x,target.z)+1.6;center.y=world.terrainHeight(center.x,center.z);
      const approach=target.clone().sub(center);approach.y=0;approach.normalize().multiplyScalar(id==='tycho'?25:14);approach.y=id==='tycho'?13:8;
      const mobile=innerWidth<760;
      const cameraTo=center.clone().add(mobile?approach:id==='tycho'?new THREE.Vector3(12,10,16):new THREE.Vector3(5.5,4.8,7.5));
      const lookTo=center.clone().add(new THREE.Vector3(mobile?0:2.5,mobile?(id==='tycho'?-5.3:-2.5):.5,0));
      const flight=engine.animate(duration(2),t=>{
        world.novi.root.position.lerpVectors(from,target,t);
        const p=world.novi.root.position;p.y=Math.max(p.y,world.terrainHeight(p.x,p.z)+1.6+Math.sin(t*Math.PI)*2);
      },signal);
      await engine.view(cameraTo,lookTo,duration(2),signal);await flight;
    }
    if(signal.aborted)return;
    settle();world.novi.setScanning(true);ui.showDiscovery(id);
  }catch(error){if(!signal.aborted)report(error);}
}
async function back(){
  if(busy)return;
  if(world?.kind==='space'){await home();return;}
  const signal=begin('Returning to our viewing point…');
  try{
    if(world.kind==='sun'){
      const view=world.view();await engine.view(view.position,view.look,duration(1.2),signal);
      if(signal.aborted)return;world.novi.root.position.set(-5,-3.7,5);
    }else await engine.view(world.overviewPosition(),new THREE.Vector3(0,0,-.5),duration(1.2),signal);
    if(signal.aborted)return;world.visiting=false;settle();
  }catch(error){if(!signal.aborted)report(error);}
}
async function runActivity(id){
  const signal=operation.signal;
  try{
    const module=await import('./ui/activities.js');if(signal.aborted)return;
    if(id==='gravity')module.gravityActivity(ui);else if(id==='solar')module.solarActivity(ui);else module.impactActivity(ui);
  }catch(error){if(!signal.aborted)report(error);}
}
try{
  engine=new Engine(app,id=>world?.kind==='space'?destination(id):inspect(id));
  engine.onFrame=()=>ui.project(engine);
  engine.onContextLost=()=>{operation.abort();world?.setInteractive?.(false);ui.error('The graphics connection was interrupted. Reload to restart from the solar system.');};
  applyMotion();await home();
}catch(error){report(error);}
