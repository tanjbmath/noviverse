// Procedural Web Audio API planetary ambient synthesizer.
// Zero external audio assets; every world has a distinct harmonic and atmospheric profile.

export const PLANET_SOUNDS = {
  mercury: {
    name: 'Mercury · Iron-core thermal hum',
    fundamental: 46.25, // F#1
    partials: [
      { ratio: 1, type: 'sine', gain: 0.48, detune: 0 },
      { ratio: 3, type: 'triangle', gain: 0.14, detune: 3 },
      { ratio: 5, type: 'sine', gain: 0.06, detune: -4 },
    ],
    filterType: 'lowpass',
    filterFreq: 260,
    filterQ: 1.6,
    lfoRate: 0.07,
    lfoDepth: 48,
    noiseFreq: 920,
    noiseQ: 2.2,
    noiseGain: 0.028,
    baseLevel: 0.28,
    closeupSubBoost: 1.32,
    closeupNoiseBoost: 1.45,
  },
  venus: {
    name: 'Venus · Dense sulfuric pressure drone',
    fundamental: 49.0, // G1
    partials: [
      { ratio: 1, type: 'sawtooth', gain: 0.36, detune: -5 },
      { ratio: 1.5, type: 'triangle', gain: 0.24, detune: 6 },
      { ratio: 2, type: 'sine', gain: 0.2, detune: 0 },
    ],
    filterType: 'lowpass',
    filterFreq: 175,
    filterQ: 2.5,
    lfoRate: 0.11,
    lfoDepth: 55,
    noiseFreq: 310,
    noiseQ: 1.4,
    noiseGain: 0.085,
    baseLevel: 0.29,
    closeupSubBoost: 1.3,
    closeupNoiseBoost: 1.55,
  },
  earth: {
    name: 'Earth · Living ocean & atmosphere',
    fundamental: 65.41, // C2
    partials: [
      { ratio: 1, type: 'sine', gain: 0.45, detune: 0 },
      { ratio: 1.5, type: 'triangle', gain: 0.18, detune: -3 },
      { ratio: 3, type: 'sine', gain: 0.09, detune: 4 },
    ],
    filterType: 'lowpass',
    filterFreq: 320,
    filterQ: 1.1,
    lfoRate: 0.14,
    lfoDepth: 65,
    noiseFreq: 420,
    noiseQ: 0.9,
    noiseGain: 0.055,
    baseLevel: 0.24,
    closeupSubBoost: 1.2,
    closeupNoiseBoost: 1.4,
  },
  moon: {
    name: 'Moon · Quiet regolith stillness',
    fundamental: 61.74, // B1
    partials: [
      { ratio: 1, type: 'sine', gain: 0.46, detune: 0 },
      { ratio: 3, type: 'sine', gain: 0.08, detune: 2 },
    ],
    filterType: 'lowpass',
    filterFreq: 240,
    filterQ: 0.9,
    lfoRate: 0.05,
    lfoDepth: 25,
    noiseFreq: 1050,
    noiseQ: 2.0,
    noiseGain: 0.014,
    baseLevel: 0.22,
    closeupSubBoost: 1.25,
    closeupNoiseBoost: 1.3,
  },
  sun: {
    name: 'Sun · Deep solar plasma roar',
    fundamental: 43.65, // F1
    partials: [
      { ratio: 1, type: 'sawtooth', gain: 0.34, detune: -4 },
      { ratio: 2, type: 'triangle', gain: 0.22, detune: 5 },
      { ratio: 3, type: 'sine', gain: 0.14, detune: -2 },
    ],
    filterType: 'lowpass',
    filterFreq: 210,
    filterQ: 1.8,
    lfoRate: 0.18,
    lfoDepth: 75,
    noiseFreq: 220,
    noiseQ: 1.1,
    noiseGain: 0.11,
    baseLevel: 0.27,
    closeupSubBoost: 1.25,
    closeupNoiseBoost: 1.4,
  },
  mars: {
    name: 'Mars · Rusty canyon wind drone',
    fundamental: 55.0, // A1
    partials: [
      { ratio: 1, type: 'triangle', gain: 0.42, detune: 0 },
      { ratio: 1.5, type: 'sine', gain: 0.24, detune: -4 },
      { ratio: 2.5, type: 'sine', gain: 0.07, detune: 5 },
    ],
    filterType: 'lowpass',
    filterFreq: 235,
    filterQ: 1.9,
    lfoRate: 0.19,
    lfoDepth: 62,
    noiseFreq: 480,
    noiseQ: 1.8,
    noiseGain: 0.072,
    baseLevel: 0.28,
    closeupSubBoost: 1.28,
    closeupNoiseBoost: 1.65,
  },
  jupiter: {
    name: 'Jupiter · Colossal gas-giant sub-bass',
    fundamental: 36.71, // D1
    partials: [
      { ratio: 1, type: 'sine', gain: 0.54, detune: 0 },
      { ratio: 1.5, type: 'sawtooth', gain: 0.22, detune: -6 },
      { ratio: 2, type: 'triangle', gain: 0.24, detune: 5 },
    ],
    filterType: 'lowpass',
    filterFreq: 145,
    filterQ: 2.7,
    lfoRate: 0.16,
    lfoDepth: 52,
    noiseFreq: 165,
    noiseQ: 1.2,
    noiseGain: 0.1,
    baseLevel: 0.31,
    closeupSubBoost: 1.38,
    closeupNoiseBoost: 1.5,
  },
  saturn: {
    name: 'Saturn · Golden bands & icy ring shimmer',
    fundamental: 46.25, // F#1
    partials: [
      { ratio: 1, type: 'sine', gain: 0.46, detune: 0 },
      { ratio: 2, type: 'triangle', gain: 0.22, detune: -3 },
      { ratio: 3, type: 'sine', gain: 0.14, detune: 4 },
      { ratio: 6, type: 'sine', gain: 0.055, detune: -7 },
      { ratio: 9, type: 'sine', gain: 0.032, detune: 6 },
    ],
    filterType: 'lowpass',
    filterFreq: 340,
    filterQ: 1.5,
    lfoRate: 0.09,
    lfoDepth: 85,
    noiseFreq: 1250,
    noiseQ: 2.8,
    noiseGain: 0.035,
    baseLevel: 0.28,
    closeupSubBoost: 1.3,
    closeupNoiseBoost: 1.45,
  },
  uranus: {
    name: 'Uranus · Tilted cyan ice-giant pad',
    fundamental: 51.91, // G#1
    partials: [
      { ratio: 1, type: 'sine', gain: 0.48, detune: 0 },
      { ratio: 2, type: 'triangle', gain: 0.2, detune: -8 },
      { ratio: 3, type: 'sine', gain: 0.14, detune: 8 },
    ],
    filterType: 'lowpass',
    filterFreq: 270,
    filterQ: 1.7,
    lfoRate: 0.055,
    lfoDepth: 45,
    noiseFreq: 640,
    noiseQ: 2.1,
    noiseGain: 0.045,
    baseLevel: 0.27,
    closeupSubBoost: 1.28,
    closeupNoiseBoost: 1.5,
  },
  neptune: {
    name: 'Neptune · Supersonic abyssal methane synth',
    fundamental: 41.2, // E1
    partials: [
      { ratio: 1, type: 'sine', gain: 0.5, detune: 0 },
      { ratio: 2, type: 'sawtooth', gain: 0.22, detune: -7 },
      { ratio: 2.67, type: 'triangle', gain: 0.11, detune: 6 },
    ],
    filterType: 'lowpass',
    filterFreq: 195,
    filterQ: 2.4,
    lfoRate: 0.29,
    lfoDepth: 78,
    noiseFreq: 540,
    noiseQ: 2.0,
    noiseGain: 0.088,
    baseLevel: 0.29,
    closeupSubBoost: 1.34,
    closeupNoiseBoost: 1.65,
  },
};

function createPinkNoiseBuffer(ctx, seconds = 3) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let seed = 1337;
  for (let i = 0; i < length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = (seed / 0xffffffff) * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
    b6 = white * 0.115926;
    data[i] = Math.max(-1, Math.min(1, sample));
  }
  return buffer;
}

export class PlanetSoundEngine {
  constructor(createContext = null) {
    this.createContext = createContext || (() => {
      const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
      return Ctx ? new Ctx() : null;
    });
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.noiseBuffer = null;
    this.activeVoice = null;
    this.retiring = new Set();
    this.desiredId = null;
    this.desiredCloseup = false;
    this.muted = false;
    this.hidden = false;
    this.disposed = false;
  }

  ensureContext() {
    if (this.disposed) return null;
    if (!this.ctx) {
      this.ctx = this.createContext();
      if (!this.ctx) return null;
      this.master = this.ctx.createGain();
      this.master.gain.setValueAtTime(this.effectiveMasterGain(), this.ctx.currentTime);
      if (typeof this.ctx.createDynamicsCompressor === 'function') {
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(18, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        this.master.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      } else {
        this.master.connect(this.ctx.destination);
      }
      this.noiseBuffer = createPinkNoiseBuffer(this.ctx);
    }
    return this.ctx;
  }

  effectiveMasterGain() {
    return (this.muted || this.hidden) ? 0 : 1;
  }

  syncMasterGain(fadeSeconds = 0.25) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const target = this.effectiveMasterGain();
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + fadeSeconds);
  }

  async unlock() {
    if (this.disposed) return false;
    const ctx = this.ensureContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      try {
        await ctx.resume();
      } catch {
        return false;
      }
    }
    if (this.desiredId && !this.activeVoice) {
      this.applyTarget();
    }
    return ctx.state !== 'suspended';
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    this.syncMasterGain(0.22);
    return this.muted;
  }

  toggleMute() {
    this.setMuted(!this.muted);
    if (!this.muted) this.unlock();
    return this.muted;
  }

  setHidden(hidden) {
    this.hidden = Boolean(hidden);
    this.syncMasterGain(0.18);
  }

  setTarget(id, { closeup = false } = {}) {
    const nextId = id && PLANET_SOUNDS[id] ? id : null;
    const nextCloseup = Boolean(closeup);
    if (this.desiredId === nextId && this.desiredCloseup === nextCloseup && (nextId === null || this.activeVoice)) {
      return;
    }
    this.desiredId = nextId;
    this.desiredCloseup = nextCloseup;
    if (!this.ctx) {
      // Only lazily create if already unlocked or AudioContext can start cleanly; otherwise unlock() activates it.
      if (!nextId) return;
      const ctx = this.ensureContext();
      if (!ctx) return;
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        ctx.resume().catch(() => {});
      }
    }
    this.applyTarget();
  }

  applyTarget() {
    if (!this.ctx || this.disposed) return;
    const id = this.desiredId;
    const closeup = this.desiredCloseup;

    if (!id) {
      if (this.activeVoice) {
        this.retireVoice(this.activeVoice, 1.05);
        this.activeVoice = null;
      }
      return;
    }

    if (this.activeVoice && this.activeVoice.id === id) {
      this.tuneVoice(this.activeVoice, closeup, 0.9);
      return;
    }

    if (this.activeVoice) {
      this.retireVoice(this.activeVoice, 0.85);
      this.activeVoice = null;
    }

    this.activeVoice = this.spawnVoice(id, closeup);
  }

  spawnVoice(id, closeup) {
    const ctx = this.ctx;
    const profile = PLANET_SOUNDS[id];
    const now = ctx.currentTime;
    const nodes = [];

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.connect(this.master);

    const filter = ctx.createBiquadFilter();
    filter.type = profile.filterType;
    filter.frequency.setValueAtTime(profile.filterFreq, now);
    filter.Q.setValueAtTime(profile.filterQ, now);
    filter.connect(voiceGain);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(profile.lfoRate, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(profile.lfoDepth, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);
    nodes.push(lfo, lfoGain);

    let subGain = null;
    for (let i = 0; i < profile.partials.length; i++) {
      const part = profile.partials[i];
      const osc = ctx.createOscillator();
      osc.type = part.type;
      osc.frequency.setValueAtTime(profile.fundamental * part.ratio, now);
      if (part.detune) osc.detune.setValueAtTime(part.detune, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(part.gain, now);
      if (i === 0) subGain = gain;
      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      nodes.push(osc, gain);
    }

    let noiseGainNode = null;
    if (this.noiseBuffer && profile.noiseGain > 0) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.setValueAtTime(profile.noiseFreq, now);
      band.Q.setValueAtTime(profile.noiseQ, now);
      noiseGainNode = ctx.createGain();
      noiseGainNode.gain.setValueAtTime(profile.noiseGain, now);
      lfoGain.connect(band.frequency);
      src.connect(band);
      band.connect(noiseGainNode);
      noiseGainNode.connect(voiceGain);
      src.start(now);
      nodes.push(src, band, noiseGainNode);
    }

    const voice = {
      id,
      profile,
      closeup,
      voiceGain,
      filter,
      subGain,
      noiseGainNode,
      nodes,
      timer: null,
    };

    this.tuneVoice(voice, closeup, 1.15);
    return voice;
  }

  tuneVoice(voice, closeup, rampSeconds = 0.9) {
    const ctx = this.ctx;
    if (!ctx || !voice) return;
    voice.closeup = closeup;
    const now = ctx.currentTime;
    const p = voice.profile;
    const targetLevel = p.baseLevel * (closeup ? 1.16 : 1);
    const targetFilter = p.filterFreq * (closeup ? 0.88 : 1);

    voice.voiceGain.gain.cancelScheduledValues(now);
    voice.voiceGain.gain.setValueAtTime(Math.max(0.0001, voice.voiceGain.gain.value), now);
    voice.voiceGain.gain.linearRampToValueAtTime(targetLevel, now + rampSeconds);

    voice.filter.frequency.cancelScheduledValues(now);
    voice.filter.frequency.setValueAtTime(voice.filter.frequency.value, now);
    voice.filter.frequency.linearRampToValueAtTime(targetFilter, now + rampSeconds);

    if (voice.subGain) {
      const subTarget = p.partials[0].gain * (closeup ? p.closeupSubBoost : 1);
      voice.subGain.gain.cancelScheduledValues(now);
      voice.subGain.gain.setValueAtTime(voice.subGain.gain.value, now);
      voice.subGain.gain.linearRampToValueAtTime(subTarget, now + rampSeconds);
    }

    if (voice.noiseGainNode) {
      const noiseTarget = p.noiseGain * (closeup ? p.closeupNoiseBoost : 1);
      voice.noiseGainNode.gain.cancelScheduledValues(now);
      voice.noiseGainNode.gain.setValueAtTime(voice.noiseGainNode.gain.value, now);
      voice.noiseGainNode.gain.linearRampToValueAtTime(noiseTarget, now + rampSeconds);
    }
  }

  retireVoice(voice, fadeSeconds = 0.9) {
    const ctx = this.ctx;
    if (!ctx || !voice) return;
    const now = ctx.currentTime;
    voice.voiceGain.gain.cancelScheduledValues(now);
    voice.voiceGain.gain.setValueAtTime(Math.max(0.0001, voice.voiceGain.gain.value), now);
    voice.voiceGain.gain.linearRampToValueAtTime(0.0001, now + fadeSeconds);
    this.retiring.add(voice);
    const stopAt = now + fadeSeconds + 0.05;
    for (const node of voice.nodes) {
      if (typeof node.stop === 'function') {
        try { node.stop(stopAt); } catch {}
      }
    }
    voice.timer = setTimeout(() => {
      for (const node of voice.nodes) {
        try { node.disconnect(); } catch {}
      }
      try { voice.filter.disconnect(); } catch {}
      try { voice.voiceGain.disconnect(); } catch {}
      this.retiring.delete(voice);
    }, Math.ceil((fadeSeconds + 0.12) * 1000));
  }

  dispose() {
    this.disposed = true;
    this.desiredId = null;
    if (this.activeVoice) {
      clearTimeout(this.activeVoice.timer);
      for (const node of this.activeVoice.nodes) {
        if (typeof node.stop === 'function') try { node.stop(); } catch {}
        try { node.disconnect(); } catch {}
      }
      try { this.activeVoice.voiceGain.disconnect(); } catch {}
      this.activeVoice = null;
    }
    for (const v of this.retiring) {
      clearTimeout(v.timer);
      for (const node of v.nodes) {
        if (typeof node.stop === 'function') try { node.stop(); } catch {}
        try { node.disconnect(); } catch {}
      }
    }
    this.retiring.clear();
    if (this.ctx && typeof this.ctx.close === 'function') {
      try { this.ctx.close(); } catch {}
    }
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.noiseBuffer = null;
  }
}
