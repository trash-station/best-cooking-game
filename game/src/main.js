// Boot: canvas setup, the frame loop, and wiring input to the game.
// One clear job: start the game and keep it ticking.

import { VIEW_W, VIEW_H } from './config.js';
import { drawScene } from './kitchen.js';
import { freshState, update, handleAction } from './game.js';
import { actionForClick, actionForKey, toLogical } from './input.js';
import { shotState } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

let state = shot ? shotState(shot, seed) : freshState(seed);

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

canvas.addEventListener('pointerdown', (event) => {
  const { x, y } = toLogical(canvas, event);
  handleAction(state, actionForClick(x, y, state));
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  const action = actionForKey(event.key, state);
  if (action) handleAction(state, action);
  if (state.screen === 'playing') {
    statusEl.textContent = `Score $${state.score}, ${state.timeLeft | 0} seconds left, ${state.orders.filter((o) => o.state === 'waiting').length} orders waiting.`;
  }
});

// Debug hook for automated playtests (read-only state inspection).
window.__sizzle = { get state() { return state; } };

// Screenshot mode: draw the frozen scene once and stop (deterministic).
if (shot) {
  drawScene(ctx, state);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(state, dt);
    drawScene(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
