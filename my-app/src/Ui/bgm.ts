// Background music: an original jazz-funk groove, generated live with the Web Audio API (no audio files).
// Drums, a syncopated bass line, electric-piano chords and, every other time round, a short melody,
// over an 8-bar progression in F minor. Off by default; the choice is remembered.
// Browsers only allow sound after the visitor interacts, so a remembered "on" waits for the first click/key.

const KEY = "portfolio-bgm";

const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

let on = read() === "1";
const listeners = new Set<() => void>();

export const isBgmOn = () => on;

export function subscribeBgm(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setBgm(next: boolean) {
  on = next;
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    // storage blocked: the setting still applies for this visit
  }
  listeners.forEach((l) => l());
  if (next) start();
  else stop();
}

export const toggleBgm = () => setBgm(!on);

// ── Music ────────────────────────────────────────────────────────────────────

const BPM = 102;
const STEP = 60 / BPM / 4; // one 16th note
const SWING = 0.16; // off-beat 16ths land a little late
const BARS = 8;
const VOLUME = 0.17;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// One chord per bar: bass root (MIDI) + electric-piano voicing.
const CHORDS: { root: number; keys: number[] }[] = [
  { root: 41, keys: [56, 60, 63, 67] }, // Fm9
  { root: 41, keys: [56, 58, 63, 67] }, // Fm11
  { root: 46, keys: [56, 60, 61, 65] }, // B♭m9
  { root: 39, keys: [55, 60, 61, 65] }, // E♭13
  { root: 44, keys: [60, 63, 67, 70] }, // A♭maj9
  { root: 37, keys: [60, 63, 65, 68] }, // D♭maj9
  { root: 43, keys: [58, 61, 65, 67] }, // Gm7♭5
  { root: 36, keys: [52, 58, 63, 67] }, // C7♯9
];

// [step, semitones above the root, length in steps, volume]
const BASS_A: [number, number, number, number][] = [
  [0, 0, 3, 1], [3, 0, 1, 0.6], [6, 12, 1, 0.8], [7, 0, 2, 0.7], [10, 7, 2, 0.8], [12, 10, 1, 0.7], [14, 12, 1, 0.8], [15, 0, 1, 0.5],
];
const BASS_B: [number, number, number, number][] = [
  [0, 0, 3, 1], [4, 7, 2, 0.7], [7, 0, 1, 0.6], [8, 12, 2, 0.8], [11, 10, 2, 0.7], [13, 7, 1, 0.6], [14, 5, 1, 0.6], [15, 3, 1, 0.6],
];
// [step, length in steps]
const KEYS_A: [number, number][] = [[0, 4], [6, 2], [10, 5]];
const KEYS_B: [number, number][] = [[2, 2], [7, 3], [12, 3]];
const KICK = [0, 3, 7, 10];
// [bar, step, MIDI note, length in steps] — F minor pentatonic phrase, played every other time round
const MELODY: [number, number, number, number][] = [
  [3, 2, 72, 2], [3, 4, 75, 2], [3, 7, 77, 4],
  [4, 0, 79, 3], [4, 4, 77, 2], [4, 6, 75, 2], [4, 10, 72, 6],
  [5, 8, 70, 2], [5, 10, 72, 2], [5, 12, 75, 4],
  [6, 2, 73, 3], [6, 6, 72, 2], [6, 8, 70, 7],
];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let analyser: AnalyserNode | null = null;
let drums: GainNode | null = null;
let keys: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let timer = 0;
let stopTimer = 0;
let nextTime = 0;
let step = 0;

function setup() {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ac = new AC();

  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  const tone = ac.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 9000;
  master = ac.createGain();
  master.gain.value = 0;
  analyser = ac.createAnalyser();
  analyser.fftSize = 64;
  analyser.smoothingTimeConstant = 0.55;
  master.connect(tone).connect(comp).connect(analyser).connect(ac.destination);

  drums = ac.createGain();
  drums.gain.value = 0.9;
  drums.connect(master);

  // Electric piano bus: a slow tremolo and a dotted-8th echo.
  keys = ac.createGain();
  keys.gain.value = 0.85;
  const trem = ac.createGain();
  trem.gain.value = 0.85;
  const lfo = ac.createOscillator();
  const lfoDepth = ac.createGain();
  lfo.frequency.value = 4.6;
  lfoDepth.gain.value = 0.15;
  lfo.connect(lfoDepth).connect(trem.gain);
  lfo.start();
  const delay = ac.createDelay(1);
  delay.delayTime.value = STEP * 3;
  const feedback = ac.createGain();
  feedback.gain.value = 0.28;
  const wet = ac.createGain();
  wet.gain.value = 0.22;
  keys.connect(trem).connect(master);
  trem.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(master);

  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  // Save CPU and stay polite: pause while the tab is hidden.
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (on) void ctx.resume();
  });

  return ac;
}

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function noise(ac: AudioContext, t: number, dur: number, type: BiquadFilterType, freq: number, vol: number, q = 1) {
  if (!noiseBuf || !drums) return;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  env(g, t, vol, 0.002, dur);
  src.connect(f).connect(g).connect(drums);
  src.start(t, Math.random() * 0.8);
  src.stop(t + dur + 0.05);
}

function kick(ac: AudioContext, t: number, vol: number) {
  if (!drums) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
  env(g, t, vol, 0.003, 0.3);
  o.connect(g).connect(drums);
  o.start(t);
  o.stop(t + 0.35);
}

function snare(ac: AudioContext, t: number, vol: number) {
  if (!drums) return;
  noise(ac, t, 0.16, "bandpass", 1900, vol * 0.9, 0.8);
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(160, t + 0.08);
  env(g, t, vol * 0.45, 0.002, 0.09);
  o.connect(g).connect(drums);
  o.start(t);
  o.stop(t + 0.12);
}

function bass(ac: AudioContext, t: number, midi: number, len: number, vol: number) {
  if (!master) return;
  const o = ac.createOscillator();
  const sub = ac.createOscillator();
  const f = ac.createBiquadFilter();
  const g = ac.createGain();
  o.type = "sawtooth";
  sub.type = "sine";
  o.frequency.value = hz(midi);
  sub.frequency.value = hz(midi);
  f.type = "lowpass";
  f.Q.value = 6;
  f.frequency.setValueAtTime(1100, t);
  f.frequency.exponentialRampToValueAtTime(260, t + 0.18);
  const dur = Math.max(0.12, len * STEP * 0.9);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.22 * vol, t + 0.008);
  g.gain.setTargetAtTime(0.12 * vol, t + 0.03, 0.08);
  g.gain.setTargetAtTime(0.0001, t + dur, 0.03);
  o.connect(f);
  sub.connect(f);
  f.connect(g).connect(master);
  o.start(t);
  sub.start(t);
  o.stop(t + dur + 0.2);
  sub.stop(t + dur + 0.2);
}

function epiano(ac: AudioContext, t: number, midi: number, len: number, vol: number) {
  if (!keys) return;
  const dur = len * STEP;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.setTargetAtTime(vol * 0.35, t + 0.02, 0.25);
  g.gain.setTargetAtTime(0.0001, t + dur, 0.07);
  g.connect(keys);
  // Body, a soft octave and a little bell-like "bark" — a simple electric-piano tone.
  const partials: [number, OscillatorType, number][] = [[1, "sine", 1], [2, "sine", 0.22], [4.01, "triangle", 0.05]];
  for (const [mult, type, level] of partials) {
    const o = ac.createOscillator();
    const pg = ac.createGain();
    o.type = type;
    o.frequency.value = hz(midi) * mult;
    pg.gain.value = level;
    o.connect(pg).connect(g);
    o.start(t);
    o.stop(t + dur + 0.6);
  }
}

function vibe(ac: AudioContext, t: number, midi: number, len: number) {
  if (!keys) return;
  const dur = Math.max(0.3, len * STEP * 1.6);
  for (const [mult, level] of [[1, 0.07], [3.98, 0.012]] as const) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.value = hz(midi) * mult;
    env(g, t, level, 0.004, dur);
    o.connect(g).connect(keys);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
}

function scheduleStep(ac: AudioContext, n: number, t: number) {
  const s = n % 16;
  const bar = Math.floor(n / 16) % BARS;
  const cycle = Math.floor(n / (16 * BARS));
  const chord = CHORDS[bar];

  // Drums
  if (KICK.includes(s)) kick(ac, t, s === 0 ? 0.9 : 0.6);
  if (s === 4 || s === 12) snare(ac, t, 0.5);
  if (s === 7 || s === 9 || s === 15) snare(ac, t, 0.08); // ghost notes
  if (s % 2 === 0) noise(ac, t, 0.035, "highpass", 7500, s % 4 === 0 ? 0.16 : 0.11);
  else if (s === 5 || s === 13) noise(ac, t, 0.025, "highpass", 8000, 0.06);
  if (s === 14 && bar % 4 === 3) noise(ac, t, 0.3, "highpass", 6500, 0.1); // open hat into the next phrase

  // Bass
  for (const [st, semi, len, vol] of bar % 2 ? BASS_B : BASS_A) {
    if (st === s) bass(ac, t, chord.root + semi, len, vol);
  }

  // Electric piano comping
  for (const [st, len] of bar % 2 ? KEYS_B : KEYS_A) {
    if (st === s) chord.keys.forEach((m, i) => epiano(ac, t + i * 0.006, m, len, 0.045));
  }

  // Melody, every other time round
  if (cycle % 2 === 1) {
    for (const [b, st, m, len] of MELODY) if (b === bar && st === s) vibe(ac, t, m, len);
  }
}

function tick() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + 0.15) {
    scheduleStep(ctx, step, nextTime + (step % 2 ? SWING * STEP : 0));
    nextTime += STEP;
    step = (step + 1) % (16 * BARS * 2);
  }
}

function start() {
  if (!ctx) ctx = setup();
  if (!ctx || !master) return;
  window.clearTimeout(stopTimer);
  void ctx.resume();
  window.clearInterval(timer);
  step = 0;
  nextTime = ctx.currentTime + 0.08;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
  master.gain.linearRampToValueAtTime(VOLUME, now + 1.5);
  timer = window.setInterval(tick, 25);
  tick();
}

function stop() {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(0, now + 0.6);
  window.clearTimeout(stopTimer);
  stopTimer = window.setTimeout(() => {
    window.clearInterval(timer);
    void ctx?.suspend();
  }, 700);
}

/** The music's loudness in a few frequency bands (0–255 each), for meters that move with it.
 *  Returns false while nothing is playing. */
export function bgmLevels(out: Uint8Array<ArrayBuffer>) {
  if (!analyser || !on || ctx?.state !== "running") return false;
  analyser.getByteFrequencyData(out);
  return true;
}

// Music left on last visit starts with the first click or key press.
if (on && typeof window !== "undefined") {
  const begin = () => {
    window.removeEventListener("pointerdown", begin);
    window.removeEventListener("keydown", begin);
    if (on) start();
  };
  window.addEventListener("pointerdown", begin);
  window.addEventListener("keydown", begin);
}
