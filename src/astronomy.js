import * as THREE from 'three';
import './astronomy.css';
import { Engine } from './core/engine.js';
import { createSolarSystem } from './scenes/solar-system.js';
import { AstronomyInterface } from './ui/astronomy-interface.js';
import { bodyById } from './data/astronomy.js';

const app=document.querySelector('#app');
let engine,world,busy=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,operation=new AbortController();
const ui=new AstronomyInterface(app,{visit,home:()=>visit(null),reset:()=>visit(ui.selected),camera:cameraControl,motion:()=>{reduced=!reduced;applyMotion();},modal:value=>{world?.controls?.setEnabled(!value&&!busy);}});
function applyMotion(){if(engine)engine.paused=reduced;document.body.classList.toggle('reduced-motion',reduced);const button=document.querySelector('[data-action="motion"]');button.setAttribute('aria-pressed',String(reduced));button.textContent=reduced?'Enable motion':'Reduce motion';}
async function visit(id){
  if(id&&!bodyById[id])return;
  ui.closeDialog();
  if(!world){ui.select(id);return;}
  operation.abort();operation=new AbortController();const signal=operation.signal;
  busy=true;world.setTravelling(true);world.setFocused(id);world.novi.setMoving(true);ui.select(id);ui.nodes(world);ui.setBusy(true,id?bodyById[id].name:'the solar system');
  const view=id?world.focusView(id):{position:world.overview(),look:new THREE.Vector3(),ship:world.objects.saturn.position.clone().add(new THREE.Vector3(-8,2,4)),shipScale:.8};
  const from=world.novi.root.position.clone(),scale=world.novi.root.scale.x;
  // Camera and rocket share one cancellable operation. Home can interrupt any trip.
  const flight=engine.animate(reduced?.06:1.65,t=>{
    world.novi.root.position.lerpVectors(from,view.ship,t);
    world.novi.root.position.y+=Math.sin(t*Math.PI)*Math.min(8,from.distanceTo(view.ship)*.1);
    world.novi.root.scale.setScalar(THREE.MathUtils.lerp(scale,view.shipScale,t));
  },signal);
  await engine.view(view.position,view.look,reduced?.06:1.65,signal);await flight;
  if(signal.aborted)return;
  world.syncControls();world.setTravelling(false);world.novi.setMoving(false);busy=false;ui.setBusy(false);
  world.nodes.forEach(node=>node.visible=!!id);ui.status(id?`Arrived at ${bodyById[id].name}. Choose a glowing node to discover more.`:'Solar system overview. Drag to look around or choose a world.');
}
function cameraControl(action){
  if(busy||!world)return;
  const offset=engine.camera.position.clone().sub(engine.look),sphere=new THREE.Spherical().setFromVector3(offset);
  if(action==='left'||action==='right')sphere.theta+=(action==='left'?-1:1)*.22;
  else sphere.radius=THREE.MathUtils.clamp(sphere.radius*(action==='in'?.82:1.22),world.controls.orbit.minDistance,250);
  engine.camera.position.copy(engine.look).add(new THREE.Vector3().setFromSpherical(sphere));world.syncControls();
}
try{
  engine=new Engine(app,id=>{if(busy||ui.el['astro-dialog'].open)return;if(id.startsWith('fact:'))ui.showFact(Number(id.slice(5)));else visit(id);});
  engine.renderer.domElement.setAttribute('aria-label','3D solar system. Drag to orbit, scroll or pinch to zoom. Destination and camera buttons are available.');
  engine.onContextLost=()=>{operation.abort();busy=false;ui.setBusy(false);world?.setTravelling(true);ui.graphicsError('The 3D connection was interrupted. Reload to restore the view. You can still explore facts using the destinations below.');world=null;};
  applyMotion();world=await createSolarSystem(engine);engine.use(world);
  engine.onFrame=()=>{if(world)ui.project(engine,world);};
  ui.select(null);ui.nodes(world);
  document.querySelector('#boot-status')?.remove();
  applyMotion();ui.status('Welcome aboard NoviVerse. The Sun, all eight planets and the Moon are ready to explore.');
}catch(error){console.error(error);document.querySelector('#boot-status')?.remove();ui.graphicsError('This browser could not load the 3D view. Try reloading with WebGL2 enabled. You can still choose worlds below to read their science and try Novi’s questions.');ui.setBusy(false);}
