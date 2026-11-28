import * as THREE from 'three';
import { seededRandom } from '../core/math.js';
import { atmosphere } from '../scenes/shared.js';

function makeCanvasTexture(width, height, draw, renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function drawBandedPlanet(ctx, w, h, stops, seed, { swirl = 0, spot = null, polarCaps = false } = {}) {
  const random = seededRandom(seed);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const [offset, color] of stops) grad.addColorStop(offset, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle latitudinal cloud bands and turbulence
  for (let i = 0; i < 42; i++) {
    const y = random() * h;
    const bandH = 2 + random() * 14;
    const alpha = 0.06 + random() * 0.14;
    ctx.fillStyle = random() > 0.5 ? `rgba(255,248,232,${alpha})` : `rgba(38,26,20,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 32) {
      const wave = Math.sin(x / w * Math.PI * (2 + Math.floor(random() * 3)) + i) * swirl;
      ctx.lineTo(x, y + wave);
    }
    ctx.lineTo(w, y + bandH);
    ctx.lineTo(0, y + bandH);
    ctx.closePath();
    ctx.fill();
  }

  if (spot) {
    const { x, y, rx, ry, color, rim } = spot;
    ctx.save();
    ctx.translate(x * w, y * h);
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * w * 1.22, ry * h * 1.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * w, ry * h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (polarCaps) {
    const north = ctx.createLinearGradient(0, 0, 0, h * 0.14);
    north.addColorStop(0, 'rgba(246,248,252,0.92)');
    north.addColorStop(1, 'rgba(246,248,252,0)');
    ctx.fillStyle = north;
    ctx.fillRect(0, 0, w, h * 0.14);

    const south = ctx.createLinearGradient(0, h * 0.88, 0, h);
    south.addColorStop(0, 'rgba(246,248,252,0)');
    south.addColorStop(1, 'rgba(246,248,252,0.88)');
    ctx.fillStyle = south;
    ctx.fillRect(0, h * 0.88, w, h * 0.12);
  }
}

function drawRockyPlanet(ctx, w, h, base, dark, light, seed, { craters = 90, polarCaps = false } = {}) {
  const random = seededRandom(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 48; i++) {
    const x = random() * w, y = random() * h;
    const rx = 24 + random() * 90, ry = 14 + random() * 48;
    ctx.fillStyle = random() > 0.45 ? dark : light;
    ctx.globalAlpha = 0.12 + random() * 0.18;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (let i = 0; i < craters; i++) {
    const x = random() * w;
    const y = h * 0.12 + random() * h * 0.76;
    const r = 3 + random() * 14;
    ctx.fillStyle = 'rgba(255,250,240,0.16)';
    ctx.beginPath();
    ctx.arc(x + 1.5, y + 1.5, r * 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(24,20,18,0.28)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }

  if (polarCaps) {
    const north = ctx.createLinearGradient(0, 0, 0, h * 0.12);
    north.addColorStop(0, 'rgba(244,247,252,0.92)');
    north.addColorStop(1, 'rgba(244,247,252,0)');
    ctx.fillStyle = north;
    ctx.fillRect(0, 0, w, h * 0.12);

    const south = ctx.createLinearGradient(0, h * 0.89, 0, h);
    south.addColorStop(0, 'rgba(244,247,252,0)');
    south.addColorStop(1, 'rgba(244,247,252,0.85)');
    ctx.fillStyle = south;
    ctx.fillRect(0, h * 0.89, w, h * 0.11);
  }
}

function makeSaturnRingTexture(renderer) {
  return makeCanvasTexture(512, 512, (ctx, w, h) => {
    const cx = w / 2, cy = h / 2, maxR = w * 0.49;
    ctx.clearRect(0, 0, w, h);
    // RingGeometry maps planar XY, so concentric circles match directly.
    const rings = [
      [0.44, 0.53, 'rgba(170,150,122,0.24)'],
      [0.54, 0.69, 'rgba(232,208,162,0.86)'],
      [0.69, 0.72, 'rgba(245,228,190,0.92)'],
      [0.72, 0.765, 'rgba(20,18,22,0.10)'], // Cassini Division
      [0.765, 0.90, 'rgba(208,186,144,0.74)'],
      [0.91, 0.935, 'rgba(226,208,172,0.42)'],
    ];
    for (const [inner, outer, color] of rings) {
      const rMid = (inner + outer) * 0.5 * maxR;
      const width = (outer - inner) * maxR;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(cx, cy, rMid, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, renderer);
}

function makeUranusRingTexture(renderer) {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    const cx = w / 2, cy = h / 2, maxR = w * 0.48;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(182,226,236,0.34)';
    ctx.lineWidth = maxR * 0.06;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(196,236,245,0.22)';
    ctx.lineWidth = maxR * 0.03;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.9, 0, Math.PI * 2);
    ctx.stroke();
  }, renderer);
}

export function createPlanetBody(id, radius, renderer) {
  const group = new THREE.Group();
  group.userData.poi = id;

  let map;
  let roughness = 0.85;
  let tilt = 0;
  let atmoColor = null;
  let atmoOpacity = 0;

  if (id === 'mercury') {
    map = makeCanvasTexture(512, 256, (ctx, w, h) => drawRockyPlanet(ctx, w, h, '#8f8982', '#5f5a55', '#b8b2aa', 101, { craters: 130 }), renderer);
    roughness = 0.94;
    tilt = 0.03;
  } else if (id === 'venus') {
    map = makeCanvasTexture(512, 256, (ctx, w, h) => drawBandedPlanet(ctx, w, h, [
      [0, '#eed49b'], [0.28, '#deb56d'], [0.5, '#f2dfb3'], [0.75, '#d5a45a'], [1, '#ead096'],
    ], 202, { swirl: 11 }), renderer);
    roughness = 0.78;
    tilt = 0.05;
    atmoColor = '#f5c776';
    atmoOpacity = 0.55;
  } else if (id === 'mars') {
    map = makeCanvasTexture(512, 256, (ctx, w, h) => drawRockyPlanet(ctx, w, h, '#c45b39', '#8a3721', '#e08558', 303, { craters: 64, polarCaps: true }), renderer);
    roughness = 0.9;
    tilt = 0.44;
    atmoColor = '#e67e51';
    atmoOpacity = 0.42;
  } else if (id === 'jupiter') {
    map = makeCanvasTexture(512, 256, (ctx, w, h) => drawBandedPlanet(ctx, w, h, [
      [0, '#b59c84'], [0.16, '#eddcc4'], [0.28, '#c67c4e'], [0.42, '#f1e3cf'], [0.54, '#b86842'],
      [0.66, '#e8d4b7'], [0.8, '#9e6248'], [1, '#b89f87'],
    ], 404, {
      swirl: 5,
      spot: { x: 0.62, y: 0.64, rx: 0.072, ry: 0.052, color: 'rgba(196,74,46,0.92)', rim: 'rgba(242,216,184,0.55)' },
    }), renderer);
    roughness = 0.76;
    tilt = 0.055;
    atmoColor = '#e8c49a';
    atmoOpacity = 0.28;
  } else if (id === 'saturn') {
    map = makeCanvasTexture(512, 256, (ctx, w, h) => drawBandedPlanet(ctx, w, h, [
      [0, '#c8b48b'], [0.22, '#eddba8'], [0.45, '#d8be85'], [0.68, '#f1e3b8'], [0.86, '#c4a66e'], [1, '#b69e74'],
    ], 505, { swirl: 2 }), renderer);
    roughness = 0.78;
    tilt = 0.466;
    atmoColor = '#ebd299';
    atmoOpacity = 0.25;
  } else if (id === 'uranus') {
    map = makeCanvasTexture(512, 256, (ctx, w, h) => drawBandedPlanet(ctx, w, h, [
      [0, '#b8eef3'], [0.35, '#89d7e2'], [0.65, '#73c7d4'], [1, '#aee8ef'],
    ], 606, { swirl: 1.5 }), renderer);
    roughness = 0.74;
    tilt = 1.706;
    atmoColor = '#93e5ef';
    atmoOpacity = 0.42;
  } else if (id === 'neptune') {
    map = makeCanvasTexture(512, 256, (ctx, w, h) => drawBandedPlanet(ctx, w, h, [
      [0, '#446be0'], [0.3, '#2d4fc2'], [0.55, '#3b62d8'], [0.8, '#233ea8'], [1, '#4870e2'],
    ], 707, {
      swirl: 4,
      spot: { x: 0.36, y: 0.58, rx: 0.055, ry: 0.038, color: 'rgba(19,31,92,0.72)', rim: 'rgba(148,186,255,0.45)' },
    }), renderer);
    roughness = 0.72;
    tilt = 0.494;
    atmoColor = '#5e8bff';
    atmoOpacity = 0.48;
  }

  group.rotation.z = tilt;
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 32),
    new THREE.MeshStandardMaterial({ map, roughness, metalness: 0.03 }),
  );
  sphere.userData.poi = id;
  group.add(sphere);

  if (atmoColor) {
    const halo = atmosphere(radius * 1.04, atmoColor, atmoOpacity);
    halo.raycast = () => {};
    group.add(halo);
  }

  if (id === 'saturn') {
    const ringGeo = new THREE.RingGeometry(radius * 1.24, radius * 2.25, 96);
    const ringMat = new THREE.MeshStandardMaterial({
      map: makeSaturnRingTexture(renderer),
      side: THREE.DoubleSide,
      transparent: true,
      roughness: 0.85,
      metalness: 0.02,
      depthWrite: false,
    });
    const rings = new THREE.Mesh(ringGeo, ringMat);
    rings.rotation.x = Math.PI / 2;
    rings.userData.poi = id;
    group.add(rings);
  } else if (id === 'uranus') {
    const ringGeo = new THREE.RingGeometry(radius * 1.38, radius * 1.78, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      map: makeUranusRingTexture(renderer),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const rings = new THREE.Mesh(ringGeo, ringMat);
    rings.rotation.x = Math.PI / 2;
    rings.raycast = () => {};
    group.add(rings);
  }

  return { group, sphere };
}

export function createAsteroidBelt(innerRadius = 9.7, outerRadius = 11.1, count = 220) {
  const random = seededRandom(909);
  const geometry = new THREE.DodecahedronGeometry(0.06, 0);
  const material = new THREE.MeshStandardMaterial({ color: '#9c958e', roughness: 0.95, metalness: 0.05 });
  const belt = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const r = innerRadius + random() * (outerRadius - innerRadius);
    const y = (random() - 0.5) * 0.45;
    dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    const s = 0.55 + random() * 1.15;
    dummy.scale.set(s * (0.8 + random() * 0.4), s * (0.7 + random() * 0.4), s * (0.8 + random() * 0.4));
    dummy.updateMatrix();
    belt.setMatrixAt(i, dummy.matrix);
    color.setHSL(0.08 + random() * 0.04, 0.1 + random() * 0.12, 0.42 + random() * 0.25);
    belt.setColorAt(i, color);
  }
  belt.instanceMatrix.needsUpdate = true;
  if (belt.instanceColor) belt.instanceColor.needsUpdate = true;
  belt.computeBoundingSphere();
  belt.raycast = () => {};
  return belt;
}
