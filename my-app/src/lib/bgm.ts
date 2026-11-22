// Background music, generated live with the Web Audio API (no audio files). Two original tracks:
//  - Persona and Metro: a jazz-funk groove in F minor (drums, a syncopated bass line, electric-piano chords
//    and, every other time round, a short vibraphone melody);
//  - Retro: late-night 70s soul on a record (brushed drums and a rim click, a round bass, warm Rhodes over a
//    D♭ major progression, soft strings and, every other time round, a flute melody), with the record's
//    crackle and hiss and a slight wobble in the pitch.
// The track follows the theme, also while it plays. Off by default; the choice is remembered. Browsers only
// allow sound after the visitor interacts, so a remembered "on" waits for the first click/key.

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

// Whether the music is actually playing: a remembered "on" waits for the first click or key (browsers block
// sound before that), so it isn't the same as `on`. What shows the music playing (the needles on the record,
// the corner player's spin and meters) follows this one; the Music keys show the setting.
let live = false;
export const isBgmLive = () => live;
const setLive = (next: boolean) => {
  if (live === next) return;
  live = next;
  listeners.forEach((l) => l());
};

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

// ── The tracks ───────────────────────────────────────────────────────────────

interface Track {
  bpm: number;
  wobble: number; // the record's pitch wobble: how far its delay drifts, seconds
  swing: number; // how late the off-beat 16ths land (share of a 16th)
  bars: number;
  tone: number; // the lowpass on the whole mix, Hz
  volume: number;
  schedule: (ac: AudioContext, n: number, t: number) => void;
  begin?: (ac: AudioContext) => void;
  end?: () => void;
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// Bass: [step, semitones above the root, length in steps, volume]; keys: [step, length in steps];
// melody: [bar, step, MIDI note, length in steps]
type BassNote = [number, number, number, number];
type Hit = [number, number];
type Phrase = [number, number, number, number][];

// Persona / Metro: jazz-funk in F minor, 102 BPM
const FUNK_CHORDS: { root: number; keys: number[] }[] = [
  { root: 41, keys: [56, 60, 63, 67] }, // Fm9
  { root: 41, keys: [56, 58, 63, 67] }, // Fm11
  { root: 46, keys: [56, 60, 61, 65] }, // B♭m9
  { root: 39, keys: [55, 60, 61, 65] }, // E♭13
  { root: 44, keys: [60, 63, 67, 70] }, // A♭maj9
  { root: 37, keys: [60, 63, 65, 68] }, // D♭maj9
  { root: 43, keys: [58, 61, 65, 67] }, // Gm7♭5
  { root: 36, keys: [52, 58, 63, 67] }, // C7♯9
];
const FUNK_BASS_A: BassNote[] = [
  [0, 0, 3, 1], [3, 0, 1, 0.6], [6, 12, 1, 0.8], [7, 0, 2, 0.7], [10, 7, 2, 0.8], [12, 10, 1, 0.7], [14, 12, 1, 0.8], [15, 0, 1, 0.5],
];
const FUNK_BASS_B: BassNote[] = [
  [0, 0, 3, 1], [4, 7, 2, 0.7], [7, 0, 1, 0.6], [8, 12, 2, 0.8], [11, 10, 2, 0.7], [13, 7, 1, 0.6], [14, 5, 1, 0.6], [15, 3, 1, 0.6],
];
const FUNK_KEYS_A: Hit[] = [[0, 4], [6, 2], [10, 5]];
const FUNK_KEYS_B: Hit[] = [[2, 2], [7, 3], [12, 3]];
const FUNK_KICK = [0, 3, 7, 10];
// F minor pentatonic phrase
const FUNK_MELODY: Phrase = [
  [3, 2, 72, 2], [3, 4, 75, 2], [3, 7, 77, 4],
  [4, 0, 79, 3], [4, 4, 77, 2], [4, 6, 75, 2], [4, 10, 72, 6],
  [5, 8, 70, 2], [5, 10, 72, 2], [5, 12, 75, 4],
  [6, 2, 73, 3], [6, 6, 72, 2], [6, 8, 70, 7],
];

const FUNK: Track = {
  bpm: 102,
  wobble: 0,
  swing: 0.16,
  bars: 8,
  tone: 9000,
  volume: 0.17,
  schedule(ac, n, t) {
    const s = n % 16;
    const bar = Math.floor(n / 16) % 8;
    const cycle = Math.floor(n / (16 * 8));
    const chord = FUNK_CHORDS[bar];

    if (FUNK_KICK.includes(s)) kick(ac, t, s === 0 ? 0.9 : 0.6);
    if (s === 4 || s === 12) snare(ac, t, 0.5);
    if (s === 7 || s === 9 || s === 15) snare(ac, t, 0.08); // ghost notes
    if (s % 2 === 0) noise(ac, t, 0.035, "highpass", 7500, s % 4 === 0 ? 0.16 : 0.11);
    else if (s === 5 || s === 13) noise(ac, t, 0.025, "highpass", 8000, 0.06);
    if (s === 14 && bar % 4 === 3) noise(ac, t, 0.3, "highpass", 6500, 0.1); // open hat into the next phrase

    for (const [st, semi, len, vol] of bar % 2 ? FUNK_BASS_B : FUNK_BASS_A) {
      if (st === s) bass(ac, t, chord.root + semi, len, vol);
    }
    for (const [st, len] of bar % 2 ? FUNK_KEYS_B : FUNK_KEYS_A) {
      if (st === s) chord.keys.forEach((m, i) => epiano(ac, t + i * 0.006, m, len, 0.045));
    }
    if (cycle % 2 === 1) {
      for (const [b, st, m, len] of FUNK_MELODY) if (b === bar && st === s) vibe(ac, t, m, len);
    }
  },
};

// Retro: late-night soul in D♭ major, 84 BPM, on a record
const SOUL_CHORDS: { root: number; keys: number[] }[] = [
  { root: 37, keys: [60, 63, 65, 68] }, // D♭maj9
  { root: 34, keys: [56, 60, 61, 65] }, // B♭m9
  { root: 39, keys: [61, 65, 66, 70] }, // E♭m9
  { root: 32, keys: [54, 58, 60, 65] }, // A♭13
  { root: 42, keys: [58, 61, 65, 68] }, // G♭maj9
  { root: 41, keys: [56, 60, 63, 65] }, // Fm7
  { root: 39, keys: [58, 61, 65, 66] }, // E♭m9
  { root: 32, keys: [58, 61, 63, 66] }, // A♭9sus4
];
const SOUL_BASS_A: BassNote[] = [[0, 0, 6, 1], [7, 7, 1, 0.55], [10, 12, 4, 0.8], [14, 7, 2, 0.6]];
const SOUL_BASS_B: BassNote[] = [[0, 0, 6, 1], [6, 0, 1, 0.5], [8, 7, 4, 0.8], [13, 10, 1, 0.55], [14, 12, 2, 0.7]];
const SOUL_KEYS_A: Hit[] = [[0, 7], [10, 6]];
const SOUL_KEYS_B: Hit[] = [[2, 5], [8, 8]];
// D♭ major pentatonic, a slow flute line over the second time round
const SOUL_MELODY: Phrase = [
  [0, 4, 77, 4], [0, 8, 75, 2], [0, 10, 73, 6],
  [1, 2, 70, 2], [1, 4, 73, 4], [1, 10, 72, 6],
  [2, 4, 73, 3], [2, 8, 70, 2], [2, 10, 68, 6],
  [3, 6, 72, 2], [3, 8, 70, 2], [3, 10, 66, 6],
  [4, 2, 70, 4], [4, 8, 73, 2], [4, 10, 77, 6],
  [5, 4, 75, 4], [5, 10, 72, 6],
  [6, 2, 73, 4], [6, 8, 70, 2], [6, 10, 68, 4],
  [7, 4, 66, 2], [7, 6, 68, 2], [7, 8, 70, 8],
];

let hiss: AudioBufferSourceNode | null = null;

const SOUL: Track = {
  bpm: 84,
  wobble: 0.0011, // about ±7 cents
  swing: 0.1,
  bars: 8,
  tone: 5200,
  volume: 0.2,
  begin(ac) {
    // the record's surface: a quiet hiss under everything
    if (!noiseBuf || !master) return;
    hiss = ac.createBufferSource();
    hiss.buffer = noiseBuf;
    hiss.loop = true;
    const f = ac.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 5000;
    f.Q.value = 0.5;
    const g = ac.createGain();
    g.gain.value = 0.035;
    hiss.connect(f).connect(g).connect(master);
    hiss.start();
  },
  end() {
    hiss?.stop();
    hiss = null;
  },
  schedule(ac, n, t) {
    const s = n % 16;
    const bar = Math.floor(n / 16) % 8;
    const cycle = Math.floor(n / (16 * 8));
    const chord = SOUL_CHORDS[bar];

    // Brushed kit: a soft kick, a rim click on 2 and 4, brushes on the 8ths
    if (s === 0) kick(ac, t, 0.55, 95);
    if (s === 10) kick(ac, t, 0.3, 95);
    if (s === 4 || s === 12) rim(ac, t, 0.32);
    if (s % 2 === 0) brush(ac, t, s % 4 === 2 ? 0.07 : 0.045);
    if (s === 15 && bar % 2 === 1) rim(ac, t, 0.08);

    for (const [st, semi, len, vol] of bar % 2 ? SOUL_BASS_B : SOUL_BASS_A) {
      if (st === s) roundBass(ac, t, chord.root + semi, len, vol);
    }
    for (const [st, len] of bar % 2 ? SOUL_KEYS_B : SOUL_KEYS_A) {
      if (st === s) chord.keys.forEach((m, i) => epiano(ac, t + i * 0.012, m, len, 0.04, true));
    }
    // strings: a soft pad under each bar
    if (s === 0) strings(ac, t, chord.keys.map((m) => m - 12), 16 * stepLen);
    if (cycle % 2 === 1) {
      for (const [b, st, m, len] of SOUL_MELODY) if (b === bar && st === s) flute(ac, t, m, len);
    }
    // the record's crackle
    if (Math.random() < 0.22) crackle(ac, t + Math.random() * stepLen);
  },
};

const trackFor = () => (document.documentElement.dataset.theme === "retro" ? SOUL : FUNK);

// ── The instruments ──────────────────────────────────────────────────────────

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let toneFilter: BiquadFilterNode | null = null;
let analyser: AnalyserNode | null = null;
let drums: GainNode | null = null;
let keys: GainNode | null = null;
let echo: DelayNode | null = null;
let wow: GainNode | null = null; // how far the wobble's delay drifts, seconds (0 = steady)
let noiseBuf: AudioBuffer | null = null;
let track: Track = FUNK;
let stepLen = 60 / FUNK.bpm / 4; // one 16th note, seconds
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
  toneFilter = ac.createBiquadFilter();
  toneFilter.type = "lowpass";
  toneFilter.frequency.value = 9000;
  master = ac.createGain();
  master.gain.value = 0;
  analyser = ac.createAnalyser();
  analyser.fftSize = 64;
  analyser.smoothingTimeConstant = 0.55;
  // The mix runs through a short delay whose length drifts slowly: a pitch wobble, like a record that's
  // not quite steady on the platter. Only the Retro track turns it up.
  const drift = ac.createDelay(0.05);
  drift.delayTime.value = 0.01;
  master.connect(drift).connect(toneFilter).connect(comp).connect(analyser).connect(ac.destination);

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
  echo = ac.createDelay(1);
  echo.delayTime.value = stepLen * 3;
  const feedback = ac.createGain();
  feedback.gain.value = 0.28;
  const wet = ac.createGain();
  wet.gain.value = 0.22;
  keys.connect(trem).connect(master);
  trem.connect(echo);
  echo.connect(feedback).connect(echo);
  echo.connect(wet).connect(master);

  const wobble = ac.createOscillator();
  wobble.frequency.value = 0.55;
  wow = ac.createGain();
  wow.gain.value = 0;
  wobble.connect(wow).connect(drift.delayTime);
  wobble.start();

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

function noise(ac: AudioContext, t: number, dur: number, type: BiquadFilterType, freq: number, vol: number, q = 1, attack = 0.002) {
  if (!noiseBuf || !drums) return;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  env(g, t, vol, attack, dur);
  src.connect(f).connect(g).connect(drums);
  src.start(t, Math.random() * 0.8);
  src.stop(t + attack + dur + 0.05);
}

function kick(ac: AudioContext, t: number, vol: number, from = 130) {
  if (!drums) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.frequency.setValueAtTime(from, t);
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

/** A rim click: the stick across the snare's rim. */
function rim(ac: AudioContext, t: number, vol: number) {
  if (!drums) return;
  noise(ac, t, 0.03, "bandpass", 3200, vol * 0.7, 5);
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "triangle";
  o.frequency.value = 820;
  env(g, t, vol * 0.5, 0.001, 0.04);
  o.connect(g).connect(drums);
  o.start(t);
  o.stop(t + 0.07);
}

/** A brush swept across the snare: soft noise that swells in. */
function brush(ac: AudioContext, t: number, vol: number) {
  noise(ac, t, 0.16, "bandpass", 4200, vol, 0.7, 0.03);
}

/** One click or pop of dust on the record. */
function crackle(ac: AudioContext, t: number) {
  if (!noiseBuf || !master) return;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const f = ac.createBiquadFilter();
  const pop = Math.random() < 0.08;
  f.type = pop ? "lowpass" : "highpass";
  f.frequency.value = pop ? 1400 : 2600;
  const g = ac.createGain();
  env(g, t, (pop ? 0.12 : 0.04) * (0.4 + Math.random()), 0.0008, pop ? 0.02 : 0.006);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.9);
  src.stop(t + 0.05);
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
  const dur = Math.max(0.12, len * stepLen * 0.9);
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

/** A round, warm bass, like a flatwound string played with the thumb. */
function roundBass(ac: AudioContext, t: number, midi: number, len: number, vol: number) {
  if (!master) return;
  const o = ac.createOscillator();
  const sub = ac.createOscillator();
  const f = ac.createBiquadFilter();
  const g = ac.createGain();
  o.type = "triangle";
  sub.type = "sine";
  o.frequency.value = hz(midi);
  sub.frequency.value = hz(midi);
  f.type = "lowpass";
  f.frequency.setValueAtTime(900, t);
  f.frequency.exponentialRampToValueAtTime(420, t + 0.25);
  const dur = Math.max(0.15, len * stepLen * 0.92);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.3 * vol, t + 0.012);
  g.gain.setTargetAtTime(0.18 * vol, t + 0.05, 0.2);
  g.gain.setTargetAtTime(0.0001, t + dur, 0.05);
  o.connect(f);
  sub.connect(f);
  f.connect(g).connect(master);
  o.start(t);
  sub.start(t);
  o.stop(t + dur + 0.3);
  sub.stop(t + dur + 0.3);
}

function epiano(ac: AudioContext, t: number, midi: number, len: number, vol: number, warm = false) {
  if (!keys) return;
  const dur = len * stepLen;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.setTargetAtTime(vol * 0.35, t + 0.02, warm ? 0.45 : 0.25);
  g.gain.setTargetAtTime(0.0001, t + dur, warm ? 0.15 : 0.07);
  g.connect(keys);
  // Body, a soft octave and a little bell-like "bark" — a simple electric-piano tone (warmer: less bark).
  const partials: [number, OscillatorType, number][] = [[1, "sine", 1], [2, "sine", warm ? 0.16 : 0.22], [4.01, "triangle", warm ? 0.025 : 0.05]];
  for (const [mult, type, level] of partials) {
    const o = ac.createOscillator();
    const pg = ac.createGain();
    o.type = type;
    o.frequency.value = hz(midi) * mult;
    pg.gain.value = level;
    o.connect(pg).connect(g);
    o.start(t);
    o.stop(t + dur + 0.9);
  }
}

function vibe(ac: AudioContext, t: number, midi: number, len: number) {
  if (!keys) return;
  const dur = Math.max(0.3, len * stepLen * 1.6);
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

/** A soft string section: detuned saws through a dark filter, swelling in and out over the bar. */
function strings(ac: AudioContext, t: number, notes: number[], dur: number) {
  if (!master) return;
  const f = ac.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 1300;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.022, t + dur * 0.35);
  g.gain.setTargetAtTime(0.0001, t + dur * 0.8, dur * 0.12);
  f.connect(g).connect(master);
  for (const m of notes) {
    for (const cents of [-7, 6]) {
      const o = ac.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = hz(m);
      o.detune.value = cents;
      o.connect(f);
      o.start(t);
      o.stop(t + dur * 1.3);
    }
  }
}

/** A breathy flute: a sine with a little air, vibrato coming in after the attack. */
function flute(ac: AudioContext, t: number, midi: number, len: number) {
  if (!keys || !master) return;
  const dur = Math.max(0.3, len * stepLen * 1.1);
  const o = ac.createOscillator();
  o.frequency.value = hz(midi);
  const vib = ac.createOscillator();
  const vibDepth = ac.createGain();
  vib.frequency.value = 5.2;
  vibDepth.gain.setValueAtTime(0, t);
  vibDepth.gain.linearRampToValueAtTime(9, t + 0.25);
  vib.connect(vibDepth).connect(o.detune);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.07);
  g.gain.setTargetAtTime(0.045, t + 0.1, 0.2);
  g.gain.setTargetAtTime(0.0001, t + dur, 0.08);
  o.connect(g).connect(keys);
  o.start(t);
  vib.start(t);
  o.stop(t + dur + 0.5);
  vib.stop(t + dur + 0.5);
  noise(ac, t, 0.12, "bandpass", hz(midi) * 2, 0.012, 2, 0.04); // the breath
}

// ── Playing ──────────────────────────────────────────────────────────────────

function switchTrack(next: Track) {
  if (!ctx) return;
  track.end?.();
  track = next;
  stepLen = 60 / track.bpm / 4;
  if (echo) echo.delayTime.setValueAtTime(stepLen * 3, ctx.currentTime);
  if (toneFilter) toneFilter.frequency.setValueAtTime(track.tone, ctx.currentTime);
  if (wow) wow.gain.setValueAtTime(track.wobble, ctx.currentTime);
  track.begin?.(ctx);
}

function tick() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + 0.15) {
    track.schedule(ctx, step, nextTime + (step % 2 ? track.swing * stepLen : 0));
    nextTime += stepLen;
    step = (step + 1) % (16 * track.bars * 2);
  }
}

function start() {
  if (!ctx) ctx = setup();
  if (!ctx || !master) return;
  window.clearTimeout(stopTimer);
  void ctx.resume();
  window.clearInterval(timer);
  switchTrack(trackFor());
  step = 0;
  nextTime = ctx.currentTime + 0.08;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
  master.gain.linearRampToValueAtTime(track.volume, now + 1.5);
  timer = window.setInterval(tick, 25);
  tick();
  setLive(true);
}

function stop() {
  setLive(false);
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(0, now + 0.6);
  window.clearTimeout(stopTimer);
  stopTimer = window.setTimeout(() => {
    window.clearInterval(timer);
    track.end?.();
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

if (typeof window !== "undefined") {
  // Music left on last visit starts with the first click or key press.
  if (on) {
    const begin = () => {
      window.removeEventListener("pointerdown", begin);
      window.removeEventListener("keydown", begin);
      if (on) start();
    };
    window.addEventListener("pointerdown", begin);
    window.addEventListener("keydown", begin);
  }
  // A theme change while the music plays fades into the other track.
  new MutationObserver(() => {
    if (!on || !ctx || ctx.state !== "running" || trackFor() === track || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.0001, now + 0.5);
    window.setTimeout(() => {
      if (on) start();
    }, 550);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
