export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = t => t * t * (3 - 2 * t);
export const lerp = (a, b, t) => a + (b - a) * t;

export function seededRandom(seed = 27) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export const GRAVITY = Object.freeze({ earth: 9.81, moon: 1.62 });
export function fallTime(height, gravity) {
  if (!Number.isFinite(height) || !Number.isFinite(gravity) || height <= 0 || gravity <= 0) throw new RangeError('Height and gravity must be positive.');
  return Math.sqrt(2 * height / gravity);
}
export const fallDistance = (time, gravity, height) => Math.min(height, 0.5 * gravity * Math.max(0, time) ** 2);
export function impactEnergy(mass, speed) {
  if (mass <= 0 || speed <= 0) throw new RangeError('Mass and speed must be positive.');
  return 0.5 * mass * speed * speed;
}
