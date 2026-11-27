import * as THREE from 'three';

export async function loadTexture(name, renderer) {
  const texture = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}textures/${name}`);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

export function makeGrain(seed, size = 256, base = 140) {
  let state = seed;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) | 0; return (state >>> 0) / 4294967296; };
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), data = ctx.createImageData(size, size);
  for (let i = 0; i < data.data.length; i += 4) {
    const c = base + (random() - 0.5) * 66;
    data.data[i] = c; data.data[i + 1] = c; data.data[i + 2] = c + 3; data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
