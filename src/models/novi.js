import * as THREE from 'three';

// Navigation owns root; hovering, expression and exhaust own the local hull.
export function createNovi() {
  const root=new THREE.Group();root.name='Novi · living retro rocket';
  const hull=new THREE.Group();hull.name='Hovering hull';root.add(hull);
  const materials={
    ivory:new THREE.MeshStandardMaterial({color:'#fff0d5',roughness:.38,metalness:.12}),
    coral:new THREE.MeshStandardMaterial({color:'#f56f50',roughness:.36,metalness:.15}),
    teal:new THREE.MeshStandardMaterial({color:'#43c8bd',roughness:.3,metalness:.25}),
    dark:new THREE.MeshStandardMaterial({color:'#163446',roughness:.3,metalness:.6}),
    glass:new THREE.MeshStandardMaterial({color:'#133969',emissive:'#154d9a',emissiveIntensity:.65,roughness:.16,metalness:.45}),
    glow:new THREE.MeshBasicMaterial({color:'#b3f8ff',toneMapped:false}),
    flame:new THREE.MeshBasicMaterial({color:'#50dce8',transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),
  };
  const mesh=(name,geo,mat,position,parent=hull)=>{
    const object=new THREE.Mesh(geo,materials[mat]);object.name=name;object.position.set(...position);parent.add(object);return object;
  };
  const profile=[[.48,-1.1],[.65,-.85],[.74,-.35],[.73,.3],[.62,.85],[.4,1.3],[.12,1.58],[0,1.65]].map(([r,y])=>new THREE.Vector2(r,y));
  mesh('Rounded ivory fuselage',new THREE.LatheGeometry(profile,40),'ivory',[0,0,0]);
  mesh('Turquoise engine collar',new THREE.CylinderGeometry(.51,.56,.22,32),'teal',[0,-1.08,0]);
  mesh('Engine bell',new THREE.CylinderGeometry(.32,.46,.3,28,1,true),'dark',[0,-1.32,0]);
  mesh('Ignited thruster',new THREE.CylinderGeometry(.32,.32,.035,24),'glow',[0,-1.48,0]);
  mesh('Expressive blue cockpit',new THREE.SphereGeometry(1,32,24),'glass',[0,.36,.61]).scale.set(.48,.49,.21);
  mesh('Cockpit turquoise rim',new THREE.TorusGeometry(.48,.065,10,40),'teal',[0,.36,.68]);
  const eyes=new THREE.Group();eyes.name='Novi eyes';eyes.position.set(0,.4,.82);hull.add(eyes);
  for(const side of [-1,1]){
    const eye=mesh('Luminous eye',new THREE.CapsuleGeometry(.038,.12,4,8),'glow',[side*.16,.015,.012],eyes);eye.rotation.z=side*-.12;
    mesh('Coral cheek',new THREE.SphereGeometry(.055,12,8),'coral',[side*.29,-.1,0],eyes).scale.set(1,.42,.3);
  }
  mesh('Cockpit smile',new THREE.TorusGeometry(.105,.013,6,20,Math.PI),'glow',[0,.3,.83]).rotation.z=Math.PI;
  const shine=mesh('Cockpit reflection',new THREE.SphereGeometry(1,16,12),'glow',[-.23,.63,.79]);shine.scale.set(.08,.025,.012);shine.rotation.z=.6;
  for(let i=0;i<3;i++){
    const fin=new THREE.Group();fin.rotation.y=i*Math.PI*2/3+Math.PI/2;hull.add(fin);
    const shape=new THREE.Shape();shape.moveTo(.46,-.35);shape.quadraticCurveTo(1.25,-.5,1.28,-1.48);shape.lineTo(.85,-1.35);shape.lineTo(.48,-.9);shape.closePath();
    mesh('Coral swept fin',new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.06,bevelThickness:.05}),'coral',[0,0,-.06],fin);
    mesh('Turquoise fin tip',new THREE.BoxGeometry(.3,.14,.19),'teal',[1.09,-1.37,0],fin).rotation.z=-.2;
  }
  for(const side of [-1,1]){
    const pivot=new THREE.Group();pivot.name=side<0?'Port engine pivot':'Starboard engine pivot';pivot.position.set(side*.75,-.85,-.2);hull.add(pivot);
    mesh('Auxiliary engine',new THREE.CylinderGeometry(.13,.18,.5,16),'teal',[0,0,0],pivot);
    mesh('Auxiliary glow',new THREE.SphereGeometry(.12,12,8),'glow',[0,-.28,0],pivot).scale.y=.35;
  }
  const flame=mesh('Exhaust plume',new THREE.ConeGeometry(.29,1.6,24,1,true),'flame',[0,-2.13,0]);flame.rotation.z=Math.PI;
  const core=mesh('Exhaust core',new THREE.ConeGeometry(.14,.9,16),'glow',[0,-1.85,0]);core.rotation.z=Math.PI;
  const count=56,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  for(let i=0;i<count;i++){const color=new THREE.Color(i%3?'#7de6ed':'#ffc180');colors.set([color.r,color.g,color.b],i*3);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const particles=new THREE.Points(geometry,new THREE.PointsMaterial({size:.075,vertexColors:true,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));particles.name='Exhaust particles';particles.frustumCulled=false;hull.add(particles);
  const scan=mesh('Scanning ring',new THREE.TorusGeometry(1.15,.015,6,48),'glow',[0,0,0],root);scan.visible=false;
  let moving=false,scanning=false,idleBlend=1;
  return {
    root,
    // Compatibility hooks for deferred geography scenes: Novi stays a spacecraft.
    setTransform(){},setEarthMode(){},get earthMode(){return 0;},
    setMoving(value){moving=value;},setScanning(value){scanning=value;scan.visible=value;},
    update(time,reduced=false,dt=1/60){
      idleBlend+=((moving?0:1)-idleBlend)*(1-Math.exp(-5*dt));
      hull.position.y=reduced?0:Math.sin(time*1.5)*(.025+idleBlend*.2);
      hull.position.x=reduced?0:Math.sin(time*.7)*idleBlend*.045;
      hull.rotation.x=reduced?0:Math.sin(time*.6)*idleBlend*.018;
      hull.rotation.z=reduced?0:Math.sin(time*.8)*(.025+idleBlend*.015);
      eyes.scale.y=!reduced&&Math.sin(time*1.1)>.993?.1:1;
      eyes.position.x=scanning&&!reduced?Math.sin(time*1.5)*.025:0;
      materials.glass.emissiveIntensity=scanning&&!reduced?.85+Math.sin(time*3)*.25:.65;
      const thrust=(moving?1.6:.35)+(reduced?0:Math.sin(time*17)*.04);
      flame.scale.y=thrust;flame.position.y=-1.5-.8*thrust;core.scale.y=thrust;core.position.y=-1.5-.45*thrust;
      for(let i=0;i<count;i++){
        const age=((reduced?0:time)*(moving?1.2:.35)+i/count)%1,spread=.08+age*.55,angle=i*2.39996;
        positions[i*3]=Math.cos(angle)*spread*age;positions[i*3+1]=-1.5-age*(moving?5:1.8);positions[i*3+2]=Math.sin(angle)*spread*age;
      }
      geometry.attributes.position.needsUpdate=true;particles.material.opacity=moving?.8:.35;
      scan.scale.setScalar(reduced?1:1+(time%2)*.3);scan.rotation.y=reduced?0:time*.4;
    },
  };
}
