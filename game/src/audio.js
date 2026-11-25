// Tiny synthesized sound effects with the Web Audio API — no audio files.
// One clear job: bleeps for clicks, sizzles, dings and errors.

let ctx = null;
let muted = false;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when = 0) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  click() { tone(620, 0.07, 'square', 0.05); },
  add() { tone(440, 0.08, 'sine', 0.08); tone(660, 0.08, 'sine', 0.06, 0.05); },
  grill() { tone(180, 0.25, 'sawtooth', 0.04); tone(240, 0.2, 'sawtooth', 0.03, 0.08); },
  ready() { tone(880, 0.12, 'sine', 0.09); tone(1318, 0.18, 'sine', 0.09, 0.09); },
  serve() { tone(523, 0.1, 'sine', 0.09); tone(659, 0.1, 'sine', 0.09, 0.08); tone(784, 0.22, 'sine', 0.1, 0.16); },
  error() { tone(160, 0.18, 'square', 0.06); },
  expire() { tone(220, 0.3, 'triangle', 0.07); tone(180, 0.3, 'triangle', 0.06, 0.15); },
  start() { tone(392, 0.1, 'sine', 0.08); tone(523, 0.1, 'sine', 0.08, 0.09); tone(659, 0.2, 'sine', 0.08, 0.18); },
  toggleMute() { muted = !muted; return muted; },
  get muted() { return muted; },
};
