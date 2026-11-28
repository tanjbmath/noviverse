import * as THREE from 'three';
import { seededRandom } from '../core/math.js';

function makeStarLayer({ count, seed, minRadius, maxRadius, minSize, maxSize, minAlpha, maxAlpha, twinkleSpeed = 1.6, flare = 0, palette = 'mixed' }) {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  const twinkles = new Float32Array(count * 2); // x: phase, y: speed
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const phi = random() * Math.PI * 2;
    const z = random() * 2 - 1;
    const sinTheta = Math.sqrt(Math.max(0, 1 - z * z));
    const r = minRadius + random() * (maxRadius - minRadius);

    positions[i * 3] = sinTheta * Math.cos(phi) * r;
    positions[i * 3 + 1] = z * r;
    positions[i * 3 + 2] = sinTheta * Math.sin(phi) * r;

    const tint = random();
    if (palette === 'dust') {
      color.setHSL(0.56 + tint * 0.1, 0.35, 0.62 + random() * 0.28);
    } else if (tint < 0.22) {
      // Warm cream / gold stars
      color.setHSL(0.09 + random() * 0.05, 0.55, 0.78 + random() * 0.16);
    } else if (tint < 0.58) {
      // Crisp cool white / pale ice-blue stars
      color.setHSL(0.57 + random() * 0.06, 0.38, 0.8 + random() * 0.18);
    } else {
      // Deep sky blue / soft indigo stars
      color.setHSL(0.61 + random() * 0.07, 0.52, 0.64 + random() * 0.26);
    }
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    const sizeMix = random() ** 2.1;
    sizes[i] = minSize + sizeMix * (maxSize - minSize);
    alphas[i] = minAlpha + random() * (maxAlpha - minAlpha);
    twinkles[i * 2] = random() * Math.PI * 2;
    twinkles[i * 2 + 1] = twinkleSpeed * (0.55 + random() * 0.95);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkles, 2));

  const pixelRatio = typeof devicePixelRatio === 'number' ? Math.min(devicePixelRatio, 2) : 1;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uFlare: { value: flare },
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aAlpha;
      attribute vec2 aTwinkle;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vTwinkle;

      void main() {
        float pulse = 0.7 + 0.3 * sin(uTime * aTwinkle.y + aTwinkle.x);
        vColor = aColor;
        vAlpha = aAlpha;
        vTwinkle = pulse;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float distScale = 230.0 / max(24.0, -mvPosition.z);
        gl_PointSize = clamp(aSize * uPixelRatio * distScale * (0.88 + 0.16 * pulse), 1.2, 24.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uFlare;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vTwinkle;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float core = exp(-d * d * 28.0);
        float halo = pow(max(0.0, 1.0 - d * 2.0), 2.6) * 0.52;
        float glow = core + halo;
        if (uFlare > 0.5) {
          float rayH = exp(-abs(uv.y) * 28.0) * exp(-abs(uv.x) * 7.0);
          float rayV = exp(-abs(uv.x) * 28.0) * exp(-abs(uv.y) * 7.0);
          glow += (rayH + rayV) * 0.38 * vTwinkle;
        }
        float alpha = clamp(glow * vAlpha * (0.72 + 0.34 * vTwinkle), 0.0, 1.0);
        gl_FragColor = vec4(vColor * (0.85 + 0.25 * vTwinkle), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.raycast = () => {};
  return points;
}

export function starfield(count = 1100) {
  const group = new THREE.Group();
  group.name = 'Dynamic starfield';

  const deepCount = Math.max(200, Math.round(count * 0.7));
  const heroCount = Math.max(45, Math.round(count * 0.14));
  const dustCount = Math.max(90, count - deepCount - heroCount);

  const deepLayer = makeStarLayer({
    count: deepCount,
    seed: 840,
    minRadius: 190,
    maxRadius: 430,
    minSize: 1.5,
    maxSize: 4.1,
    minAlpha: 0.42,
    maxAlpha: 0.92,
    twinkleSpeed: 1.5,
    flare: 0,
  });
  const heroLayer = makeStarLayer({
    count: heroCount,
    seed: 1291,
    minRadius: 155,
    maxRadius: 310,
    minSize: 4.2,
    maxSize: 8.6,
    minAlpha: 0.58,
    maxAlpha: 0.98,
    twinkleSpeed: 2.1,
    flare: 1,
  });
  const dustLayer = makeStarLayer({
    count: dustCount,
    seed: 2049,
    minRadius: 56,
    maxRadius: 140,
    minSize: 0.9,
    maxSize: 2.3,
    minAlpha: 0.2,
    maxAlpha: 0.52,
    twinkleSpeed: 1.1,
    flare: 0,
    palette: 'dust',
  });

  group.add(deepLayer, heroLayer, dustLayer);
  group.raycast = () => {};

  let simTime = 0;
  group.update = (time, paused = false, dt = 1 / 60) => {
    if (!paused) {
      const safeDt = Math.min(Math.max(dt, 0), 0.05);
      simTime = typeof time === 'number' ? time : simTime + safeDt;
      deepLayer.material.uniforms.uTime.value = simTime;
      heroLayer.material.uniforms.uTime.value = simTime;
      dustLayer.material.uniforms.uTime.value = simTime;
      deepLayer.rotation.y += safeDt * 0.0042;
      heroLayer.rotation.y += safeDt * 0.0055;
      dustLayer.rotation.y -= safeDt * 0.0085;
      dustLayer.rotation.x += safeDt * 0.0022;
    }
  };

  return group;
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
