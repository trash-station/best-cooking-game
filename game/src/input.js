// Mouse + keyboard input for the kitchen.
// One clear job: turn pointer and key events into named actions the game handles.

import { INGREDIENTS, LAYOUT } from './config.js';

export function stationRects() {
  const st = LAYOUT.stations;
  const gap = 14;
  const sw = (st.w - gap * (INGREDIENTS.length - 1)) / INGREDIENTS.length;
  return INGREDIENTS.map((ing, i) => ({
    ing,
    rect: { x: st.x + i * (sw + gap), y: st.y, w: sw, h: st.h },
  }));
}

export function grillSlotRects() {
  const g = LAYOUT.grill;
  return [0, 1].map((i) => ({
    slot: i,
    rect: { x: g.x + 22 + i * 132, y: g.y + 44, w: 116, h: 150 },
  }));
}

function hit(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Translate a click (logical canvas coords) into an action object.
export function actionForClick(x, y, state) {
  if (state.screen !== 'playing') return null;
  // stations
  for (const { ing, rect } of stationRects()) {
    if (hit(rect, x, y)) return { type: 'station', id: ing.id };
  }
  // grill slots
  for (const { slot, rect } of grillSlotRects()) {
    if (hit(rect, x, y)) return { type: 'grill', slot };
  }
  // plate: click removes the top topping
  if (hit(LAYOUT.plate, x, y)) return { type: 'undo' };
  // serve bell
  if (hit(LAYOUT.bell, x, y)) return { type: 'serve' };
  return null;
}

// Translate a keydown into an action object. Returns 'start'/'restart'/'mute' too.
export function actionForKey(key, state) {
  const k = key.toLowerCase();
  if (k === 'm') return { type: 'mute' };
  if (state.screen === 'title' || state.screen === 'over') {
    if (k === 'enter' || k === ' ') return { type: 'start' };
    return null;
  }
  const ing = INGREDIENTS.find((i) => i.key === k);
  if (ing) return { type: 'station', id: ing.id };
  if (k === 'g') return { type: 'takePatty' };
  if (k === ' ') return { type: 'serve' };
  if (k === 'backspace') return { type: 'undo' };
  return null;
}

// Convert a DOM pointer event on the canvas to logical 1280x720 coordinates.
export function toLogical(canvas, event) {
  const r = canvas.getBoundingClientRect();
  const sx = 1280 / r.width;
  const sy = 720 / r.height;
  return {
    x: (event.clientX - r.left) * sx,
    y: (event.clientY - r.top) * sy,
  };
}
