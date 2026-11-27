// Pointer gestures are separate from geography/rendering so they can be tested without WebGL.
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const wrapLongitude = value => ((value + 180) % 360 + 360) % 360 - 180;
export const longitudeDelta = (from, to) => wrapLongitude(to - from);

export class GlobeControls {
  constructor(onChange = () => {}) {
    this.onChange = onChange;
    this.pose = { lat: 15, lon: 85, zoom: 1 };
    this.enabled = true;
    this.pointers = new Map();
    this.moved = false;
    this.listeners = [];
  }
  setPose(pose) {
    const next = { ...this.pose, ...pose };
    if (![next.lat, next.lon, next.zoom].every(Number.isFinite)) return;
    this.pose = { lat: clamp(next.lat, -75, 75), lon: wrapLongitude(next.lon), zoom: clamp(next.zoom, .62, 1.65) };
    this.onChange(this.pose);
  }
  rotate(dx, dy) { this.setPose({ lon: this.pose.lon - dx * .22, lat: this.pose.lat + dy * .18 }); }
  zoom(factor) { if (Number.isFinite(factor) && factor > 0) this.setPose({ zoom: this.pose.zoom * factor }); }
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.clear();
  }
  clear() {
    for (const id of this.pointers.keys()) {
      try { this.element?.releasePointerCapture(id); } catch {}
    }
    this.pointers.clear(); this.moved = true;
  }
  canPick(event) { return this.enabled && !this.moved && this.pointers.size === 1 && this.pointers.has(event.pointerId); }
  attach(element) {
    this.dispose(); this.element = element;
    const listen = (name, handler, options) => {
      element.addEventListener(name, handler, options);
      this.listeners.push(() => element.removeEventListener(name, handler, options));
    };
    const pair = () => {
      const [a, b] = [...this.pointers.values()];
      return { distance: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };
    listen('pointerdown', e => {
      if (!this.enabled || (e.button !== undefined && e.button !== 0)) return;
      if (!this.pointers.size) this.moved = false;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY });
      if (this.pointers.size > 1) this.moved = true;
      try { element.setPointerCapture(e.pointerId); } catch {}
    });
    listen('pointermove', e => {
      const p = this.pointers.get(e.pointerId);
      if (!this.enabled || !p) return;
      const previous = this.pointers.size === 2 ? pair() : null;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (Math.hypot(p.x - p.startX, p.y - p.startY) > 6) this.moved = true;
      if (this.pointers.size === 1 && this.moved) this.rotate(dx, dy);
      else if (this.pointers.size === 2) {
        const next = pair(); this.moved = true;
        this.rotate(next.x - previous.x, next.y - previous.y);
        if (previous.distance > 2 && next.distance > 2) this.zoom(previous.distance / next.distance);
      }
    });
    const release = e => {
      this.pointers.delete(e.pointerId);
      // Keep moved set through the whole gesture, including the final finger.
      try { element.releasePointerCapture(e.pointerId); } catch {}
    };
    listen('pointerup', release);
    listen('pointercancel', e => { this.moved = true; release(e); });
    listen('lostpointercapture', e => { this.pointers.delete(e.pointerId); });
    listen('wheel', e => {
      if (!this.enabled) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 300 : 1;
      const dx = clamp(e.deltaX * unit, -120, 120), dy = clamp(e.deltaY * unit, -120, 120);
      if (e.ctrlKey || e.shiftKey) this.zoom(Math.exp(dy * .002));
      else this.setPose({ lon: this.pose.lon + (dx + dy) * .13 });
    }, { passive: false });
  }
  dispose() { this.clear(); this.listeners.forEach(remove => remove()); this.listeners = []; this.element = null; }
}
