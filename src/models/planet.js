import * as THREE from 'three';
import { atmosphere } from '../scenes/shared.js';

// Authored surfaces: no extra image downloads, render targets or per-frame textures.
export function createPlanet(data,map){
  const {radius,color}=data.visual,root=new THREE.Group();root.name=data.name;root.userData.poi=data.id;
  const tilt=new THREE.Group();root.add(tilt);tilt.rotation.z=data.id==='uranus'?1.71:data.id==='saturn'?.47:data.id==='earth'?.409:.07;
  let material;
  if(map) material=new THREE.MeshStandardMaterial({map,roughness:.87});
  else {
    material=new THREE.MeshStandardMaterial({color,roughness:.85});
    material.onBeforeCompile=shader=>{
      shader.uniforms.kind={value:['jupiter','saturn','uranus','neptune'].indexOf(data.id)+1};
      shader.vertexShader='varying vec3 localPoint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlocalPoint=normalize(position);');
      shader.fragmentShader='varying vec3 localPoint; uniform int kind;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float wave=sin(localPoint.y*48.+sin(localPoint.x*12.+localPoint.z*9.)*.9);
        float grain=sin(localPoint.x*43.+localPoint.z*28.)*sin(localPoint.y*64.+localPoint.x*23.);
        float shade=kind>0 ? .86+.14*wave+.04*grain : .85+.12*grain+.05*sin(localPoint.y*18.);
        diffuseColor.rgb*=shade;
        if(kind==1){float storm=length((localPoint.xy-vec2(.35,-.25))*vec2(2.8,7.));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.55,.19,.09),(1.-smoothstep(.7,1.,storm))*step(.2,localPoint.z));}
      `);
    };
    material.customProgramCacheKey=()=>`noviverse-planet-${data.id}`;
  }
  const surface=new THREE.Mesh(new THREE.SphereGeometry(radius,48,32),material);tilt.add(surface);
  if(['earth','venus','uranus','neptune'].includes(data.id))tilt.add(atmosphere(radius*1.035,data.id==='earth'?'#51aaff':color,.45));
  if(data.id==='saturn'){
    const ringMat=new THREE.MeshStandardMaterial({color:'#d9bd8d',side:THREE.DoubleSide,transparent:true,opacity:.72,roughness:1});
    for(const [inner,outer]of [[1.3,1.53],[1.56,1.86],[1.98,2.17]]){
      const ring=new THREE.Mesh(new THREE.RingGeometry(radius*inner,radius*outer,96),ringMat);ring.rotation.x=-Math.PI/2;tilt.add(ring);
    }
  }
  return {root,surface,update(dt){surface.rotation.y+=dt*(data.visual.spin||0);}};
}
