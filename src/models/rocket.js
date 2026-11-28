import * as THREE from 'three';

// Original smooth-surfaced 3D rocket: sculpted lathe hull, swept fins, recessed
// face porthole, separate fasteners, banding, vents and a layered exhaust plume.
export function createRocket() {
  const root = new THREE.Group(), hull = new THREE.Group(); root.add(hull);
  root.name = 'Novi / astronomy rocket';
  const white = new THREE.MeshStandardMaterial({ color: '#fff0d7', metalness: .28, roughness: .3 });
  const red = new THREE.MeshStandardMaterial({ color: '#f46d52', metalness: .25, roughness: .32 });
  const teal = new THREE.MeshStandardMaterial({ color: '#49d2c5', metalness: .4, roughness: .25 });
  const dark = new THREE.MeshStandardMaterial({ color: '#142c42', metalness: .6, roughness: .3 });
  const gold = new THREE.MeshStandardMaterial({ color: '#f4bc70', metalness: .65, roughness: .27 });
  const glow = new THREE.MeshBasicMaterial({ color: '#a8ffeb' });
  function add(geometry, material, position = [0, 0, 0], parent = hull) {
    const object = new THREE.Mesh(geometry, material); object.position.set(...position); parent.add(object); return object;
  }
  const profile = [[0,-1.35],[.52,-1.32],[.73,-1.05],[.84,-.5],[.87,.1],[.78,.72],[.58,1.2],[.3,1.64],[0,1.95]].map(p => new THREE.Vector2(...p));
  const curve = new THREE.SplineCurve(profile);
  add(new THREE.LatheGeometry(curve.getPoints(64), 64), white);
  const nose = [[0,1.95],[.12,1.85],[.3,1.64],[.46,1.42],[.55,1.25]].map(p=>new THREE.Vector2(...p));
  add(new THREE.LatheGeometry(new THREE.SplineCurve(nose).getPoints(32),64), red);
  function ring(radius, tube, y, material) {
    const r = add(new THREE.TorusGeometry(radius,tube,10,64),material,[0,y,0]);r.rotation.x=Math.PI/2;return r;
  }
  ring(.565,.027,1.24,gold);ring(.74,.045,-.94,teal);ring(.69,.022,-1.10,gold);
  // Face panel points toward +Z and is recessed behind a metallic porthole rim.
  const window = add(new THREE.SphereGeometry(.57,40,24),dark,[0,.26,.69]);window.scale.set(1,1,.32);
  const rim=add(new THREE.TorusGeometry(.565,.065,12,64),gold,[0,.26,.78]);
  rim.scale.z=.7;
  for(let i=0;i<10;i++) {
    const a=i*Math.PI*2/10; add(new THREE.SphereGeometry(.025,8,6),white,[Math.cos(a)*.565,.26+Math.sin(a)*.565,.84]);
  }
  const eyes=[];
  for(const x of [-.19,.19]) {
    const eye=add(new THREE.CapsuleGeometry(.045,.12,5,12),glow,[x,.31,.88]);eyes.push(eye);
    const cheek=add(new THREE.SphereGeometry(.06,12,8),red,[x*1.65,.14,.85]);cheek.scale.set(1,.4,.3);
  }
  const smile=add(new THREE.TorusGeometry(.13,.016,8,28,Math.PI*.8),glow,[.04,.20,.89]);smile.rotation.z=Math.PI*1.1;
  const reflection=add(new THREE.SphereGeometry(.13,16,10),new THREE.MeshBasicMaterial({color:'#a9efff',transparent:true,opacity:.22}),[-.31,.56,.84]);reflection.scale.set(.6,1,.1);
  for(let i=0;i<3;i++) {
    const pivot=new THREE.Group();pivot.rotation.y=i*Math.PI*2/3;hull.add(pivot);
    const shape=new THREE.Shape();shape.moveTo(.64,-.28);shape.bezierCurveTo(.9,-.3,1.4,-.91,1.48,-1.4);shape.quadraticCurveTo(1.13,-1.5,.77,-1.18);shape.lineTo(.64,-.28);
    const fin=add(new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.06,bevelThickness:.05}),teal,[0,0,-.06],pivot);
    fin.name='Swept flight fin';
  }
  for(const sign of [-1,1]) for(let j=0;j<4;j++) {
    const vent=add(new THREE.CapsuleGeometry(.023,.15,3,6),dark,[sign*.76,-.35-j*.12,.26]);vent.rotation.z=sign*.28;
  }
  add(new THREE.CylinderGeometry(.46,.55,.27,40,1,true),dark,[0,-1.38,0]);ring(.51,.035,-1.52,gold);
  const plume=new THREE.Group();hull.add(plume);
  for(const [radius,height,color,opacity] of [[.37,1.8,'#f99b56',.3],[.23,1.35,'#ffd591',.65],[.12,.9,'#edfff8',.95]]) {
    const flame=add(new THREE.ConeGeometry(radius,height,32),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}),[0,-1.48-height/2,0],plume);flame.rotation.z=Math.PI;
  }
  let moving=false;
  return {root,hull,setMoving(value){moving=value;},update(time,reduced=false){
    hull.position.y=reduced?0:Math.sin(time*1.6)*.12;
    hull.rotation.z=reduced?0:Math.sin(time*.7)*.035;
    eyes.forEach(e=>e.scale.y=!reduced&&Math.sin(time*1.2)>.994?.12:1);
    plume.scale.y=(moving?1.5:.65)+(reduced?0:Math.sin(time*15)*.08);
  }};
}
