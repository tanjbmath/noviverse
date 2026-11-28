import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANET_SOUNDS, PlanetSoundEngine } from '../src/core/soundscape.js';

function createMockAudioContext() {
  const makeParam = (initial = 0) => ({
    value: initial,
    events: [],
    setValueAtTime(v, t) { this.value = v; this.events.push(['set', v, t]); },
    linearRampToValueAtTime(v, t) { this.value = v; this.events.push(['ramp', v, t]); },
    cancelScheduledValues(t) { this.events.push(['cancel', t]); },
  });

  const nodes = [];
  const ctx = {
    currentTime: 1.0,
    sampleRate: 44100,
    state: 'suspended',
    destination: { kind: 'destination' },
    closed: false,
    async resume() { this.state = 'running'; },
    async close() { this.closed = true; this.state = 'closed'; },
    createGain() {
      const n = { kind: 'gain', gain: makeParam(1), connected: [], disconnected: false, connect(t) { this.connected.push(t); }, disconnect() { this.disconnected = true; } };
      nodes.push(n);
      return n;
    },
    createBiquadFilter() {
      const n = { kind: 'filter', type: 'lowpass', frequency: makeParam(350), Q: makeParam(1), connected: [], disconnected: false, connect(t) { this.connected.push(t); }, disconnect() { this.disconnected = true; } };
      nodes.push(n);
      return n;
    },
    createOscillator() {
      const n = { kind: 'oscillator', type: 'sine', frequency: makeParam(440), detune: makeParam(0), startedAt: null, stoppedAt: null, connected: [], disconnected: false, connect(t) { this.connected.push(t); }, disconnect() { this.disconnected = true; }, start(t = 0) { this.startedAt = t; }, stop(t = 0) { this.stoppedAt = t; } };
      nodes.push(n);
      return n;
    },
    createBuffer(channels, length, sampleRate) {
      const data = new Float32Array(length);
      return { channels, length, sampleRate, getChannelData() { return data; } };
    },
    createBufferSource() {
      const n = { kind: 'buffer', buffer: null, loop: false, startedAt: null, stoppedAt: null, connected: [], disconnected: false, connect(t) { this.connected.push(t); }, disconnect() { this.disconnected = true; }, start(t = 0) { this.startedAt = t; }, stop(t = 0) { this.stoppedAt = t; } };
      nodes.push(n);
      return n;
    },
    createDynamicsCompressor() {
      const n = { kind: 'compressor', threshold: makeParam(-24), knee: makeParam(30), ratio: makeParam(12), connected: [], connect(t) { this.connected.push(t); }, disconnect() {} };
      nodes.push(n);
      return n;
    },
    nodes,
  };
  return ctx;
}

test('every solar system world has a distinct low-frequency Web Audio profile', () => {
  const worlds = ['mercury', 'venus', 'earth', 'moon', 'sun', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
  const signatures = new Set();

  for (const id of worlds) {
    const p = PLANET_SOUNDS[id];
    assert.ok(p, `${id} should have a sound profile`);
    assert.ok(p.fundamental >= 30 && p.fundamental <= 90, `${id} fundamental (${p.fundamental} Hz) should sit in a low-frequency band`);
    assert.ok(Array.isArray(p.partials) && p.partials.length >= 2, `${id} should define harmonic partials`);
    assert.ok(p.filterFreq > p.fundamental && p.filterFreq <= 400, `${id} lowpass filter should shape warm ambient bass`);
    assert.ok(p.lfoRate > 0 && p.noiseGain > 0, `${id} should include organic modulation and texture`);
    signatures.add(`${p.fundamental}-${p.filterFreq}-${p.lfoRate}-${p.partials.map(x => x.type).join(',')}`);
  }

  assert.equal(signatures.size, worlds.length, 'each planet soundscape has a unique acoustic signature');
});

test('PlanetSoundEngine degrades safely when Web Audio API is unavailable', async () => {
  const engine = new PlanetSoundEngine(() => null);
  assert.equal(await engine.unlock(), false);
  engine.setTarget('jupiter', { closeup: false });
  engine.setTarget('jupiter', { closeup: true });
  assert.equal(engine.toggleMute(), true);
  assert.equal(engine.toggleMute(), false);
  engine.setTarget(null);
  engine.dispose();
});

test('PlanetSoundEngine spawns, intensifies on surface close-up, crossfades between planets, mutes, and disposes', async () => {
  const ctx = createMockAudioContext();
  const engine = new PlanetSoundEngine(() => ctx);

  const unlocked = await engine.unlock();
  assert.equal(unlocked, true);
  assert.equal(ctx.state, 'running');

  // Zoom in to Jupiter orbit
  engine.setTarget('jupiter', { closeup: false });
  const jupVoice = engine.activeVoice;
  assert.ok(jupVoice);
  assert.equal(jupVoice.id, 'jupiter');
  assert.equal(jupVoice.closeup, false);
  const orbitSubGain = jupVoice.subGain.gain.value;
  const orbitNoiseGain = jupVoice.noiseGainNode.gain.value;
  const orbitVoiceGain = jupVoice.voiceGain.gain.value;
  assert.ok(orbitVoiceGain > 0.2);

  // Zoom into Jupiter surface close-up without respawning voice
  engine.setTarget('jupiter', { closeup: true });
  assert.equal(engine.activeVoice, jupVoice);
  assert.equal(jupVoice.closeup, true);
  assert.ok(jupVoice.subGain.gain.value > orbitSubGain, 'surface close-up boosts sub-bass depth');
  assert.ok(jupVoice.noiseGainNode.gain.value > orbitNoiseGain, 'surface close-up enriches atmospheric texture');
  assert.ok(jupVoice.voiceGain.gain.value > orbitVoiceGain, 'surface close-up brings sound closer');

  // Switch to Saturn: Jupiter voice retires cleanly and Saturn voice starts
  engine.setTarget('saturn', { closeup: false });
  assert.ok(engine.retiring.has(jupVoice));
  assert.ok(jupVoice.nodes.some(n => typeof n.stop === 'function' && n.stoppedAt !== null));
  assert.equal(engine.activeVoice.id, 'saturn');
  assert.equal(engine.activeVoice.profile.fundamental, PLANET_SOUNDS.saturn.fundamental);

  // Mute and unmute preserve active target while ramping master gain cleanly
  assert.equal(engine.toggleMute(), true);
  assert.equal(engine.master.gain.value, 0);
  assert.equal(engine.toggleMute(), false);
  assert.equal(engine.master.gain.value, 1);

  // Tab visibility ducks audio cleanly
  engine.setHidden(true);
  assert.equal(engine.master.gain.value, 0);
  engine.setHidden(false);
  assert.equal(engine.master.gain.value, 1);

  // Pulling back to space overview fades out active voice
  const satVoice = engine.activeVoice;
  engine.setTarget(null);
  assert.equal(engine.activeVoice, null);
  assert.ok(engine.retiring.has(satVoice));

  // Dispose cleans up context and retiring timers
  engine.dispose();
  assert.equal(ctx.closed, true);
  assert.equal(engine.retiring.size, 0);
});
