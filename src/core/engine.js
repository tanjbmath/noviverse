import * as THREE from 'three';
import { smooth } from './math.js';

export class Engine {
  constructor(container, onPick) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D space. Equivalent destination buttons follow.');
    this.renderer.domElement.id = 'universe';
    container.prepend(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(43, 1, 0.1, 1200);
    this.look = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.current = null;
    this.tweens = new Set();
    this.paused = false;
    this.time = 0;
    this.last = performance.now();
    this.resize = () => {
      this.renderer.setSize(innerWidth, innerHeight);
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.current?.resize?.(this);
    };
    window.addEventListener('resize', this.resize);
    this.resize();
    const cast = event => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.current?.targets || [], true)[0];
      let node = hit?.object;
      while (node && !node.userData.poi) node = node.parent;
      return node?.userData.poi;
    };
    this.renderer.domElement.addEventListener('pointerup', e => { if (this.current?.controls && !this.current.controls.canPick(e)) return; const id = cast(e); if (id) onPick(id); });
    this.renderer.domElement.addEventListener('pointermove', e => {
      this.renderer.domElement.style.cursor = cast(e) ? 'pointer' : 'default';
    });
    this.renderer.domElement.addEventListener('webglcontextlost', e => {
      e.preventDefault(); this.onContextLost?.();
    });
    this.renderer.setAnimationLoop(now => this.frame(now));
  }
  frame(now) {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    if (document.hidden) return;
    if (!this.paused) this.time += dt;
    for (const tween of [...this.tweens]) tween(dt);
    this.current?.update?.(this.paused ? 0 : dt, this.time, this);
    this.camera.lookAt(this.look);
    if (this.current) this.renderer.render(this.current.scene, this.camera);
    this.onFrame?.();
  }
  use(world) {
    this.current?.deactivate?.();
    this.current = world;
    this.resize();
    world.activate?.(this);
  }
  animate(seconds, update, signal) {
    if (signal?.aborted) return Promise.resolve(false);
    return new Promise(resolve => {
      let elapsed = 0;
      const finish = result => { this.tweens.delete(step); signal?.removeEventListener('abort', abort); resolve(result); };
      const abort = () => finish(false);
      const step = dt => {
        elapsed += dt;
        const t = Math.min(1, elapsed / Math.max(seconds, 0.001));
        update(smooth(t), t);
        if (t === 1) finish(true);
      };
      this.tweens.add(step);
      signal?.addEventListener('abort', abort, { once: true });
      update(0, 0);
    });
  }
  view(position, look, seconds, signal) {
    const from = this.camera.position.clone(), target = this.look.clone();
    return this.animate(seconds, t => {
      this.camera.position.lerpVectors(from, position, t);
      this.look.lerpVectors(target, look, t);
    }, signal);
  }
}
