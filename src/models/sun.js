import * as THREE from 'three';

// An authored plasma illustration, not an observation or a fluid simulation.
// Shared by the distant Sun and the solar scene; no render targets or bloom pass.
export const SUNSPOT_DIRECTION = new THREE.Vector3(-0.42, 0.24, 0.875).normalize();

const vertex = `varying vec3 p; varying vec3 n; varying vec3 eye;
void main(){p=normalize(position);n=normalize(normalMatrix*normal);
vec4 mv=modelViewMatrix*vec4(position,1.);eye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
const noise = `
float hash(vec3 q){q=fract(q*.3183099+vec3(.17,.31,.53));q*=17.;return fract(q.x*q.y*q.z*(q.x+q.y+q.z));}
float noise(vec3 q){vec3 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);
return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 q){float v=0.,a=.52;for(int i=0;i<4;i++){v+=a*noise(q);q=q*2.07+vec3(9.1,3.7,5.2);a*=.5;}return v;}`;

export function createSun(radius = 4, { detail = true } = {}) {
  const root = new THREE.Group();
  const clock = { value: 0 };
  const surface = new THREE.Mesh(new THREE.SphereGeometry(radius, detail ? 80 : 40, detail ? 56 : 28), new THREE.ShaderMaterial({
    uniforms: { time: clock, spots: { value: detail ? 1 : 0 }, spot: { value: SUNSPOT_DIRECTION } },
    vertexShader: vertex,
    fragmentShader: `${noise}
varying vec3 p; varying vec3 n; varying vec3 eye; uniform float time; uniform float spots; uniform vec3 spot;
void main(){vec3 q=p*6.+vec3(time*.023,-time*.015,time*.009);
float flow=fbm(q);float cells=noise(p*112.+flow*3.+time*.045);
float fine=noise(p*245.+flow*4.);float heat=clamp(flow*.7+cells*.4+fine*.14,0.,1.);
vec3 color=mix(vec3(.65,.052,.004),vec3(2.4,1.04,.22),smoothstep(.22,.89,heat));
float rim=pow(max(0.,dot(normalize(n),normalize(eye))),.42);color*=.52+.48*rim;
float d=distance(p,spot)+(noise(p*95.)-.5)*.025;
float d2=distance(p,normalize(spot+vec3(.13,-.07,.08)))+(noise(p*110.)-.5)*.014;
float penumbra=(1.-smoothstep(.085,.145,d))*.76+(1.-smoothstep(.045,.078,d2))*.65;
float umbra=(1.-smoothstep(.035,.067,d))*.85+(1.-smoothstep(.015,.037,d2))*.8;
color*=1.-spots*clamp(penumbra+umbra,0.,.94);
gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  }));
  root.add(surface);
  const glare = new THREE.Mesh(new THREE.PlaneGeometry(radius * 7, radius * 7), new THREE.ShaderMaterial({
    uniforms: { time: clock, strength: { value: detail ? 0.8 : 1 } },
    vertexShader: 'varying vec2 uvp;void main(){uvp=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 uvp;uniform float time;uniform float strength;
void main(){float r=length(uvp)*3.5;float a=atan(uvp.y,uvp.x);
float streamer=pow(.5+.5*sin(a*11.+sin(a*5.)*2.+time*.055),5.);
float corona=exp(-max(r-1.,0.)*3.3)*(.3+streamer*.2)*smoothstep(.94,1.04,r);
float haze=exp(-r*r*.68)*.15;
float rays=pow(abs(cos(a-.28)),50.)*.11*exp(-r*.7)+pow(abs(sin(a-.28)),65.)*.06*exp(-r*.9);
float alpha=(corona+haze+rays)*strength*(1.-smoothstep(2.6,3.5,r));
gl_FragColor=vec4(mix(vec3(1.,.27,.055),vec3(1.,.78,.42),exp(-max(r-1.,0.)*2.)),alpha);
#include <colorspace_fragment>
}`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }));
  // A halo must never enlarge the Sun's clickable area or intercept another world.
  glare.raycast = () => {};
  root.add(glare);
  const loops = [];
  if (detail) {
    for (const [angle, height, width] of [[.62, .48, .18], [2.22, .18, .10], [3.8, .12, .08]]) {
      for (let strand = 0; strand < 7; strand++) {
        const points = [];
        for (let i = 0; i <= 60; i++) {
          const t = i / 60, a = angle + (t - .5) * width * 2;
          const r = radius * (1 + Math.sin(t * Math.PI) * (height + strand * .009));
          points.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, Math.sin(t * Math.PI) * radius * (.1 + strand * .008)));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const loop = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, radius * (.003 + strand * .0006), 5, false), new THREE.MeshBasicMaterial({
          color: strand % 2 ? '#ff5918' : '#ffc274', transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
        }));
        loop.userData.poi = 'prominence'; root.add(loop); loops.push(loop);
      }
    }
  }
  return {
    root, surface, glare, loops,
    update(time, camera) {
      clock.value = time;
      // Copy world orientation: both scenes keep the Sun root unrotated.
      glare.quaternion.copy(camera.quaternion);
    },
  };
}
