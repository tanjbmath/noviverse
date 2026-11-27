import * as THREE from 'three';
import { seededRandom } from '../core/math.js';

export function starfield(count = 1100) {
  const random = seededRandom(840), positions = [], colors = [];
  for (let i = 0; i < count; i++) {
    const phi = random() * Math.PI * 2, z = random() * 2 - 1, r = 170 + random() * 200;
    positions.push(Math.sqrt(1 - z * z) * Math.cos(phi) * r, z * r, Math.sqrt(1 - z * z) * Math.sin(phi) * r);
    const c = new THREE.Color().setHSL(0.54 + random() * 0.13, 0.15, 0.45 + random() * 0.5); colors.push(c.r, c.g, c.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.22, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.85 }));
}

export function atmosphere(radius, color = '#3b9cf5', opacity = 0.8) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 40), new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: opacity } },
    vertexShader: 'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
    fragmentShader: 'uniform vec3 color; uniform float opacity; varying vec3 n; varying vec3 v; void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(color,f*opacity);}',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
}

export function beacon(position, color = '#86f5d9') {
  const root = new THREE.Group(); root.position.copy(position);
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.018, 6, 32), material); ring.rotation.x = -Math.PI / 2; root.add(ring);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), material); dot.position.y = 0.4; root.add(dot);
  return root;
}
