import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { planets, bodyById, orbitPosition } from '../data/astronomy.js';
import { createRocket } from '../models/rocket.js';
import { createSun } from '../models/sun.js';
import { atmosphere, starfield } from './shared.js';
import { seededRandom } from '../core/math.js';

export function createNavigation(camera, element, look) {
  const orbit = new OrbitControls(camera, element);
  orbit.enableDamping = true; orbit.dampingFactor = .09; orbit.enablePan = false;
  orbit.minDistance = 2; orbit.maxDistance = 250; orbit.maxPolarAngle = Math.PI*.92;
  orbit.target.copy(look);
  // The engine's pick listener runs before this release listener. A drag, a
  // two-finger gesture, or a cancelled pointer must never select a world.
  const pointers = new Map(); let moved = true;
  const down = e => { if(e.button!==0) return; if(!pointers.size)moved=false; pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); if(pointers.size>1)moved=true; };
  const move = e => {const p=pointers.get(e.pointerId);if(p&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>6)moved=true;};
  const up = e => pointers.delete(e.pointerId);
  const cancel = e => {moved=true;up(e);};
  element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',cancel);element.addEventListener('lostpointercapture',cancel);
  return { orbit, canPick: e=>orbit.enabled&&!moved&&pointers.size===1&&pointers.has(e.pointerId),
    setEnabled(value){orbit.enabled=value;if(!value){pointers.clear();moved=true;orbit.update();}},
    dispose(){orbit.dispose();for(const [name,fn] of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel]])element.removeEventListener(name,fn);},
  };
}

export async function createSolarSystem(engine, { textures: suppliedTextures } = {}) {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#080b19');scene.add(starfield(1900));
  scene.add(new THREE.AmbientLight('#b9cbef',1.3));
  const light=new THREE.PointLight('#fff0d8',1900,0,1.4);scene.add(light);
  // A soft camera-side fill keeps the nightside legible in this educational view.
  const fill=new THREE.DirectionalLight('#b2c8ed',1.5);scene.add(fill);
  const objects={}, targets=[], nodes=[], textureLoader=new THREE.TextureLoader();
  const globe=new THREE.SphereGeometry(1,64,40);
  const textures=suppliedTextures ? Object.entries(suppliedTextures) : await Promise.all(Object.values(bodyById).filter(b=>b.texture).map(async b=>{
    const map=await textureLoader.loadAsync(`${import.meta.env.BASE_URL}textures/${b.texture}`);
    map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(4,engine.renderer.capabilities.getMaxAnisotropy());return[b.id,map];
  }));const maps=Object.fromEntries(textures);
  function register(id,root,mesh){root.userData.poi=id;objects[id]=root;targets.push(mesh);}
  const solar=createSun(5.5);scene.add(solar.root);register('sun',solar.root,solar.surface);
  for(const body of planets) {
    const anchor=new THREE.Group();anchor.position.set(...orbitPosition(body));scene.add(anchor);
    const tilted=new THREE.Group();tilted.rotation.z=-THREE.MathUtils.degToRad(body.tilt);anchor.add(tilted);
    const mesh=new THREE.Mesh(globe,new THREE.MeshStandardMaterial({map:maps[body.id],roughness:.94,metalness:0}));mesh.scale.setScalar(body.radius);tilted.add(mesh);anchor.userData.surface=mesh;
    if(['earth','venus','uranus','neptune'].includes(body.id))tilted.add(atmosphere(body.radius*1.015,body.color,.45));
    if(body.id==='saturn') {
      const rings=new THREE.Mesh(new THREE.RingGeometry(body.radius*1.28,body.radius*2.3,160,1),new THREE.ShaderMaterial({
        vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:`varying vec3 p;void main(){float r=length(p.xy)/4.;float grain=.55+.2*sin(r*370.)+.13*sin(r*971.);float gap=smoothstep(1.91,1.94,r)*(1.-smoothstep(1.99,2.02,r));float edge=smoothstep(1.28,1.34,r)*(1.-smoothstep(2.24,2.3,r));gl_FragColor=vec4(mix(vec3(.43,.35,.24),vec3(.9,.79,.56),grain),edge*(1.-gap)*.78);}`,
        side:THREE.DoubleSide,transparent:true,depthWrite:false,
      }));rings.rotation.x=-Math.PI/2;tilted.add(rings);rings.userData.poi='saturn';targets.push(rings);
    }
    register(body.id,anchor,mesh);
    const points=Array.from({length:181},(_,i)=>new THREE.Vector3(Math.cos(i/180*Math.PI*2)*body.orbit,0,Math.sin(i/180*Math.PI*2)*body.orbit));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#627a9f',transparent:true,opacity:.18})));
  }
  const lunar=new THREE.Group();scene.add(lunar);
  const moonMesh=new THREE.Mesh(globe,new THREE.MeshStandardMaterial({map:maps.moon,roughness:1}));moonMesh.scale.setScalar(.55);lunar.add(moonMesh);register('moon',lunar,moonMesh);
  const random=seededRandom(701), asteroidGeometry=new THREE.IcosahedronGeometry(.12,0);
  const asteroids=new THREE.InstancedMesh(asteroidGeometry,new THREE.MeshStandardMaterial({color:'#c1aea1',roughness:1}),550), dummy=new THREE.Object3D();
  for(let i=0;i<550;i++){const a=random()*Math.PI*2,r=32+random()*3.5;dummy.position.set(Math.cos(a)*r,(random()-.5)*1.4,Math.sin(a)*r);dummy.rotation.set(random()*6,random()*6,0);dummy.scale.setScalar(.3+random()*1.4);dummy.updateMatrix();asteroids.setMatrixAt(i,dummy.matrix);}scene.add(asteroids);
  const novi=createRocket();novi.root.scale.setScalar(.7);novi.root.rotation.set(.1,0,-.35);scene.add(novi.root);
  // Three unlabeled, screen-projected nodes on every focused world.
  const nodeMaterial=new THREE.MeshBasicMaterial({color:'#adffe5'});
  for(let i=0;i<3;i++){const node=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),nodeMaterial);node.visible=false;const cast=node.raycast;node.raycast=function(raycaster,hits){if(this.visible)cast.call(this,raycaster,hits);};scene.add(node);node.userData.poi=`fact:${i}`;nodes.push(node);targets.push(node);}
  let focused=null, travelling=false, orbitalTime=0, controls, needsResize=false;
  const overview = () => {const portrait=engine.camera.aspect<.8;return new THREE.Vector3(0,portrait?145:90,portrait?205:130);};
  const world={kind:'astronomy',scene,objects,targets,nodes,novi,
    get focused(){return focused;},get travelling(){return travelling;},
    activate(){controls=createNavigation(engine.camera,engine.renderer.domElement,engine.look);world.controls=controls;},
    deactivate(){controls?.dispose();},
    setFocused(id){focused=id;nodes.forEach(node=>node.visible=false);if(controls)controls.orbit.minDistance=id?bodyById[id].radius*(id==='saturn'?3.7:2):10;},
    setTravelling(value){travelling=value;controls?.setEnabled(!value);if(!value&&needsResize){needsResize=false;world.resize();}},
    syncControls(){if(controls){controls.orbit.target.copy(engine.look);controls.orbit.update();}},
    overview,
    focusView(id, width = globalThis.innerWidth ?? 1280, height = globalThis.innerHeight ?? 800){
      const radius=bodyById[id].radius,position=objects[id].position.clone(),mobile=width<700;
      const distance=Math.max(radius*(id==='saturn'?8.8:6.2),3);
      const look=position.clone().add(new THREE.Vector3(!mobile&&width<1100&&width/height<1.2?radius:0,mobile?-radius*(height<740?(id==='saturn'?2:1.25):(id==='saturn'?1.1:.85)):0,0));
      return{look,position:position.clone().add(new THREE.Vector3(distance*.1,distance*.35,distance*(mobile?(id==='saturn'?1.9:1.32):1))),ship:position.clone().add(new THREE.Vector3(-radius*2,radius*.1,radius*1.5)),shipScale:Math.max(.18,radius*.15)};
    },
    resize(){if(travelling){needsResize=true;return;}if(focused&&controls){const view=world.focusView(focused);engine.camera.position.copy(view.position);engine.look.copy(view.look);world.syncControls();}else{engine.camera.position.copy(overview());engine.look.set(0,0,0);world.syncControls();}},
    update(dt,time){
      if(!focused&&!travelling)orbitalTime+=dt;
      for(const body of planets){const object=objects[body.id];if(!focused&&!travelling)object.position.set(...orbitPosition(body,orbitalTime));object.userData.surface.rotation.y+=dt*body.spin;}
      if(!focused&&!travelling){const a=orbitalTime*.24;lunar.position.copy(objects.earth.position).add(new THREE.Vector3(Math.cos(a)*3.4,.3,Math.sin(a)*3.4));moonMesh.rotation.y=-a;}
      if(!focused&&!travelling){novi.root.position.copy(objects.saturn.position).add(new THREE.Vector3(-8,2,4));novi.root.scale.setScalar(.8);}
      if(focused){const body=bodyById[focused],p=objects[focused].position,r=body.radius;nodes.forEach((node,i)=>{const angle=-.8+i*.85;node.position.set(Math.sin(angle)*.8,.55-i*.48,Math.cos(angle)*.95).normalize().multiplyScalar(r*(focused==='saturn'?1.4:1.045)).add(p);});}
      novi.update(time,engine.paused);solar.update(time,engine.camera);fill.position.copy(engine.camera.position);
      if(controls?.orbit.enabled){controls.orbit.update();engine.look.copy(controls.orbit.target);}
    },
  };
  // Initialize lunar position before any focus transition.
  lunar.position.copy(objects.earth.position).add(new THREE.Vector3(3.4,.3,0));
  return world;
}
