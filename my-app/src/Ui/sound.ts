// UI sounds, synthesised with the Web Audio API (no audio files).
// General sounds are off by default (turned on from the navbar or the command palette).
// The slot machine is louder about it: when the visitor pulls the lever themselves it plays its
// casino sounds anyway — unless they've explicitly switched sounds off.

const KEY = "portfolio-sound";

const stored = (() => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
})();

let enabled = stored === "1";
let explicitlyOff = stored === "0";

const listeners = new Set<() => void>();

export const isSoundOn = () => enabled;

export function setSound(on: boolean) {
  enabled = on;
  explicitlyOff = !on;
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // storage blocked: the setting still applies for this visit
  }
  listeners.forEach((l) => l());
  if (on) play("pop");
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Sounds play when they're on — or, with `force`, unless the visitor has explicitly muted them. */
const allowed = (force?: boolean) => enabled || (force === true && !explicitlyOff);

// ── Audio plumbing ──────────────────────────────────────────────────────────

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(ac: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

interface ToneOptions {
  type?: OscillatorType;
  volume?: number;
  delay?: number;
  slideTo?: number;
  attack?: number;
}

function tone(freq: number, duration: number, opts: ToneOptions = {}) {
  const ac = audio();
  if (!ac || !master) return;
  const { type = "sine", volume = 0.05, delay = 0, slideTo, attack = 0.01 } = opts;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** A short burst of filtered noise: clicks, clunks, rattles. */
function burst(duration: number, opts: { freq: number; q?: number; type?: BiquadFilterType; volume?: number; delay?: number }) {
  const ac = audio();
  if (!ac || !master) return;
  const { freq, q = 1, type = "bandpass", volume = 0.1, delay = 0 } = opts;
  const t = ac.currentTime + delay;
  const src = ac.createBufferSource();
  src.buffer = noise(ac);
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(gain).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + duration + 0.02);
}

/** A bell-like note: a pure tone plus a bright overtone, with a ringing decay. */
function bell(freq: number, delay: number, volume = 0.07, duration = 0.5) {
  tone(freq, duration, { type: "sine", volume, delay, attack: 0.004 });
  tone(freq * 2.76, duration * 0.5, { type: "sine", volume: volume * 0.35, delay, attack: 0.002 });
  tone(freq * 5.4, duration * 0.25, { type: "sine", volume: volume * 0.15, delay, attack: 0.002 });
}

/** A coin hitting a metal tray. */
function coin(delay: number, volume = 0.05) {
  const f = 1900 + Math.random() * 1300;
  tone(f, 0.18, { type: "sine", volume, delay, attack: 0.002 });
  tone(f * 1.5, 0.12, { type: "sine", volume: volume * 0.6, delay: delay + 0.01, attack: 0.002 });
  burst(0.03, { freq: 6000, q: 2, volume: volume * 0.6, delay });
}

// ── Named sounds ────────────────────────────────────────────────────────────

export type SoundName =
  | "click" | "tick" | "jackpot" | "unlock" | "whoosh" | "type" | "pop" | "send" | "error"
  | "lever" | "coin" | "reelStop";

export function play(name: SoundName, opts: { force?: boolean } = {}) {
  if (!allowed(opts.force)) return;
  switch (name) {
    case "click":
      tone(520, 0.05, { type: "triangle", volume: 0.03 });
      break;
    case "tick":
      burst(0.02, { freq: 2600, q: 4, volume: 0.05 });
      break;
    case "type":
      tone(300 + Math.random() * 120, 0.03, { type: "square", volume: 0.012 });
      break;
    case "pop":
      tone(420, 0.1, { volume: 0.05, slideTo: 760 });
      break;
    case "send":
      tone(500, 0.12, { type: "triangle", volume: 0.04, slideTo: 1000 });
      tone(1000, 0.1, { type: "triangle", volume: 0.03, delay: 0.1 });
      break;
    case "whoosh":
      tone(180, 0.35, { type: "sawtooth", volume: 0.02, slideTo: 900 });
      break;
    case "error":
      tone(220, 0.15, { type: "square", volume: 0.025, slideTo: 140 });
      break;
    case "unlock":
      [660, 880, 1320].forEach((f, i) => bell(f, i * 0.08, 0.04, 0.35));
      break;

    // Slot machine
    case "coin":
      coin(0, 0.06);
      coin(0.07, 0.04);
      break;
    case "lever":
      // The lever's ratchet going down, then a heavy clunk.
      for (let i = 0; i < 6; i++) burst(0.025, { freq: 1800 - i * 120, q: 6, volume: 0.07, delay: i * 0.035 });
      burst(0.12, { freq: 500, type: "lowpass", volume: 0.35, delay: 0.22 });
      tone(110, 0.22, { type: "sine", volume: 0.18, delay: 0.22, slideTo: 50 });
      break;
    case "reelStop":
      // A reel thudding into place.
      burst(0.06, { freq: 900, q: 1.5, volume: 0.22 });
      tone(180, 0.14, { type: "sine", volume: 0.14, slideTo: 70 });
      break;
    case "jackpot": {
      // Bells ringing up the scale, a shower of coins, then a big bright chord.
      const notes = [1047, 1319, 1568, 2093];
      for (let round = 0; round < 3; round++) notes.forEach((f, i) => bell(f, round * 0.36 + i * 0.09, 0.06, 0.45));
      for (let i = 0; i < 26; i++) coin(0.15 + Math.random() * 1.7, 0.03 + Math.random() * 0.025);
      [523, 659, 784, 1047].forEach((f) => {
        tone(f, 1.3, { type: "triangle", volume: 0.035, delay: 1.1, attack: 0.02 });
        tone(f * 1.003, 1.3, { type: "square", volume: 0.008, delay: 1.1, attack: 0.02 });
      });
      break;
    }
  }
}

/**
 * The sound of the reels spinning: a motor hum and fast clicking that slows down as each reel
 * stops. Call `reelStopped()` as each reel lands and `stop()` when they've all stopped.
 */
export function spinSound(opts: { force?: boolean; reels: number }) {
  const silent = { reelStopped: () => {}, stop: () => {} };
  if (!allowed(opts.force)) return silent;
  const ac = audio();
  if (!ac || !master) return silent;

  // Motor hum
  const hum = ac.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = 62;
  const humFilter = ac.createBiquadFilter();
  humFilter.type = "lowpass";
  humFilter.frequency.value = 320;
  const humGain = ac.createGain();
  humGain.gain.setValueAtTime(0.0001, ac.currentTime);
  humGain.gain.exponentialRampToValueAtTime(0.045, ac.currentTime + 0.15);
  hum.connect(humFilter).connect(humGain).connect(master);
  hum.start();

  // Clicking, slower with every reel that stops
  let running = opts.reels;
  let timer = 0;
  const clickLoop = () => {
    if (running <= 0) return;
    burst(0.018, { freq: 2400 + Math.random() * 600, q: 5, volume: 0.03 + running * 0.012 });
    timer = window.setTimeout(clickLoop, 42 + (opts.reels - running) * 28);
  };
  clickLoop();

  const stop = () => {
    running = 0;
    window.clearTimeout(timer);
    const t = ac.currentTime;
    humGain.gain.cancelScheduledValues(t);
    humGain.gain.setValueAtTime(Math.max(0.0001, humGain.gain.value), t);
    humGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    hum.stop(t + 0.25);
  };

  return {
    reelStopped: () => {
      running -= 1;
      play("reelStop", { force: true });
      if (running <= 0) stop();
    },
    stop,
  };
}
