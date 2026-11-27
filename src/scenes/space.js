import * as THREE from 'three';
import { loadTexture } from '../core/assets.js';
import { SpaceControls } from '../core/orbit-controls.js';
import { createNovi } from '../models/novi.js';
import { createPlanet } from '../models/planet.js';
import { createSun } from '../models/sun.js';
import { starfield } from './shared.js';
import { celestialBodies, bodyById } from '../data/universe.js';
import { seededRandom } from '../core/math.js';

export function overviewView(width,height){
  const distance=Math.max(155,70/(Math.tan(43*Math.PI/360)*(width/height)));
  const look=new THREE.Vector3(0,-3,0);
  return {look,position:new THREE.Vector3().setFromSpherical(new THREE.Spherical(distance,.64,.12)).add(look)};
}

export function bodyView(id,point,width,height){
  const radius=bodyById[id].visual.radius*(id==='saturn'?2.25:1), mobile=width<760;
  const tan=Math.tan(43*Math.PI/360), aspect=width/height;
  const availableWidth=mobile?width-44:Math.max(200,width-480);
  const availableHeight=mobile?Math.max(100,height*.46-95):Math.max(170,height-220);
  const distance=Math.max(8,radius*1.45/(tan*Math.min(aspect*availableWidth/width,availableHeight/height)));
  const look=point.clone();
  if(mobile)look.y-=distance*tan*.39;
  else look.x+=distance*tan*aspect*(420/width);
  return {look,position:look.clone().add(new THREE.Vector3(0,0,distance)),distance};
}

export function companionView(view,width,height){
  const mobile=width<760,depth=view.position.distanceTo(view.look)*.8,tan=Math.tan(43*Math.PI/360);
  const screenY=mobile?Math.min(height*.38,height-112-height*.43-55):height*.65;
  const orientation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(view.position,view.look,new THREE.Vector3(0,1,0)));
  const position=new THREE.Vector3(depth*tan*(width/height)*(mobile?-.65:-.69),depth*tan*(1-screenY/height*2),-depth).applyQuaternion(orientation).add(view.position);
  return {position,scale:depth*tan*.065};
}

export async function createSpace(engine,{textures}={}){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#100e25');
  const stars=starfield(innerWidth<760?900:1800);stars.material.size=.34;scene.add(stars);
  let maps=textures;
  if(!maps){
    const loaded=await Promise.allSettled([loadTexture('earth.jpg',engine.renderer),loadTexture('moon.jpg',engine.renderer)]);
    const failed=loaded.find(result=>result.status==='rejected');
    if(failed){for(const result of loaded)if(result.status==='fulfilled')result.value.dispose();stars.geometry.dispose();stars.material.dispose();throw failed.reason;}
    maps=loaded.map(result=>result.value);
  }
  const [earthMap,moonMap]=maps;
  const solar=createSun(4.6,{detail:false});solar.root.userData.poi='sun';scene.add(solar.root);
  const objects={sun:solar.root},models={},phases={};
  const orbitMaterial=new THREE.LineBasicMaterial({color:'#a89aca',transparent:true,opacity:.19}),orbitLines=[];
  const orbit=(radius,parent)=>{
    const points=Array.from({length:192},(_,i)=>new THREE.Vector3(Math.cos(i/192*Math.PI*2)*radius,0,Math.sin(i/192*Math.PI*2)*radius));
    const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),orbitMaterial);parent.add(line);orbitLines.push(line);return line;
  };
  for(const data of celestialBodies.filter(b=>b.id!=='sun')){
    const model=createPlanet(data,data.id==='earth'?earthMap:data.id==='moon'?moonMap:null);
    models[data.id]=model;objects[data.id]=model.root;phases[data.id]=data.visual.phase;scene.add(model.root);
    if(data.parent==='sun')orbit(data.visual.orbit,scene);
  }
  const lunarOrbit=orbit(2.8,scene);
  function placeBodies(){
    for(const data of celestialBodies.filter(b=>b.parent)){
      const phase=phases[data.id],r=data.visual.orbit;
      objects[data.id].position.copy(objects[data.parent].position).add(new THREE.Vector3(Math.cos(phase)*r,0,Math.sin(phase)*r));
    }
    lunarOrbit.position.copy(objects.earth.position);
  }
  placeBodies();
  const random=seededRandom(718),dustGeo=new THREE.BufferGeometry(),positions=[],colors=[];
  for(let i=0;i<(innerWidth<760?280:650);i++){
    const angle=random()*Math.PI*2,r=29+random()*2.5;
    positions.push(Math.cos(angle)*r,(random()-.5)*.65,Math.sin(angle)*r);
    const c=new THREE.Color().setHSL(.1,.15,.3+random()*.28);colors.push(c.r,c.g,c.b);
  }
  dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));dustGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({size:.11,vertexColors:true}));scene.add(dust);
  scene.add(new THREE.AmbientLight('#b8bbeb',1.15));
  const sunlight=new THREE.PointLight('#ffe3be',85,0,.65);scene.add(sunlight);
  const fill=new THREE.DirectionalLight('#d4e6ff',1.8);fill.position.set(-15,22,38);scene.add(fill,fill.target);
  const novi=createNovi();scene.add(novi.root);
  const shipLight=new THREE.PointLight('#9beaf2',3,7);shipLight.position.set(0,1,2);novi.root.add(shipLight);
  const controls=new SpaceControls();let interactive=true,idle=true,focused=null;
  const world={
    kind:'space',level:'solar-system',scene,novi,objects,models,controls,targets:Object.values(objects),focused:null,
    labels:celestialBodies.map(data=>({id:data.id,text:data.name,object:objects[data.id],offset:new THREE.Vector3(0,data.visual.radius+.6,0)})),
    activate(engine){controls.attach(engine.renderer.domElement);controls.sync(engine.camera,engine.look);},
    deactivate(){controls.dispose();},
    setInteractive(value){interactive=value;controls.setEnabled(value);},
    setIdle(value){idle=value;},
    resize(engine,width=innerWidth,height=innerHeight){
      const view=focused?bodyView(focused,objects[focused].position,width,height):overviewView(width,height);
      engine.camera.position.copy(view.position);engine.look.copy(view.look);controls.sync(engine.camera,engine.look);
      controls.minDistance=focused?Math.max(5,bodyById[focused].visual.radius*(focused==='saturn'?4:2.2)):9;
      if(!focused)this.placeCompanion(engine,width);
      else {
        const companion=companionView(view,width,height);
        novi.root.position.copy(companion.position);novi.root.scale.setScalar(companion.scale);
      }
    },
    placeCompanion(engine,width=innerWidth){
      // Place a real 3D companion in the lower left of the overview, proportional to view distance.
      const distance=engine.camera.position.distanceTo(engine.look),halfHeight=Math.tan(engine.camera.fov*Math.PI/360)*distance;
      engine.camera.lookAt(engine.look);engine.camera.updateMatrixWorld();
      const right=new THREE.Vector3(1,0,0).applyQuaternion(engine.camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(engine.camera.quaternion);
      novi.root.position.copy(engine.look).addScaledVector(right,-halfHeight*engine.camera.aspect*(width<760?.6:.69)).addScaledVector(up,-halfHeight*.52);
      novi.root.quaternion.copy(engine.camera.quaternion);novi.root.rotateZ(-.27);
      novi.root.scale.setScalar(halfHeight*(width<760?.047:.07));
    },
    async focus(id,engine,seconds,signal){
      if(signal?.aborted||!objects[id])return false;
      idle=false;interactive=false;controls.setEnabled(false);
      objects[id].visible=true;
      const point=objects[id].position.clone(),view=bodyView(id,point,innerWidth,innerHeight);
      const from=novi.root.position.clone(),qFrom=novi.root.quaternion.clone(),scaleFrom=novi.root.scale.x;
      const r=bodyById[id].visual.radius,companion=companionView(view,innerWidth,innerHeight),scale=companion.scale,to=companion.position;
      const direction=to.clone().sub(from).normalize(),flightQ=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
      const cameraFrom=engine.camera.position.clone(),lookFrom=engine.look.clone();
      novi.setMoving(true);novi.setScanning(false);
      const done=await engine.animate(seconds,t=>{
        novi.root.position.lerpVectors(from,to,t);novi.root.position.y+=Math.sin(t*Math.PI)*Math.min(8,from.distanceTo(to)*.12);
        novi.root.quaternion.slerpQuaternions(qFrom,flightQ,Math.sin(t*Math.PI));
        novi.root.scale.setScalar(THREE.MathUtils.lerp(scaleFrom,scale,t));
        engine.camera.position.lerpVectors(cameraFrom,view.position,t);engine.look.lerpVectors(lookFrom,view.look,t);
      },signal);
      if(!done)return false;
      focused=id;this.focused=id;novi.root.quaternion.identity();novi.root.rotateZ(-.18);novi.setMoving(false);novi.setScanning(true);
      for(const [key,object]of Object.entries(objects))object.visible=key===id;
      for(const line of orbitLines)line.visible=false;dust.visible=false;this.targets=[objects[id]];
      controls.sync(engine.camera,engine.look);controls.minDistance=Math.max(5,r*(id==='saturn'?4:2.2));return true;
    },
    async reset(engine,seconds,signal){
      focused=null;this.focused=null;idle=false;controls.setEnabled(false);novi.setScanning(false);
      for(const object of Object.values(objects))object.visible=true;
      for(const line of orbitLines)line.visible=true;dust.visible=true;this.targets=Object.values(objects);
      fill.position.set(-15,22,38);fill.target.position.set(0,0,0);
      const view=overviewView(innerWidth,innerHeight);
      const done=await engine.view(view.position,view.look,seconds,signal);
      if(!done)return false;
      controls.sync(engine.camera,engine.look);controls.minDistance=9;idle=true;this.placeCompanion(engine);return true;
    },
    update(dt,time,engine){
      for(const [id,model]of Object.entries(models)){
        model.update(dt);
        if(idle&&!focused)phases[id]+=dt*Math.PI*2/bodyById[id].visual.period;
      }
      if(idle&&!focused)placeBodies();
      if(interactive){controls.update(engine.frameDelta||1/60,engine.camera,engine.look);if(!focused)this.placeCompanion(engine);}
      if(focused){fill.position.copy(engine.camera.position);fill.target.position.copy(objects[focused].position);}
      if(!engine.paused)stars.rotation.y+=dt*.0015;
      solar.update(time,engine.camera);novi.update(time,engine.paused,dt);
    },
  };
  return world;
}
