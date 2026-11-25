// All canvas drawing: the kitchen, the food, the order board and the HUD.
// One clear job: given a game state, paint the whole scene. No logic lives here.

import { INGREDIENTS, LAYOUT, GRILL_COOK_SECONDS, GRILL_BURN_SECONDS } from './config.js';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function shadow(ctx, fn) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  fn();
  ctx.restore();
}

// --- food shapes ------------------------------------------------------------

export function drawIngredient(ctx, id, x, y, w, h, variant = 'normal') {
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (id === 'bunBottom') {
    ctx.fillStyle = '#e8a94e';
    rr(ctx, x + 2, cy - 4, w - 4, h * 0.55, 8); ctx.fill();
    ctx.fillStyle = '#d18f33';
    rr(ctx, x + 2, cy + h * 0.28, w - 4, 5, 3); ctx.fill();
  } else if (id === 'bunTop') {
    ctx.fillStyle = '#f0b45c';
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.28, w / 2, h * 0.62, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-0.28, -0.18], [0, -0.3], [0.28, -0.18], [-0.12, -0.05], [0.14, -0.05]]) {
      ctx.beginPath();
      ctx.ellipse(cx + dx * w, cy + dy * h, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = variant === 'raw' ? '#c98d6b' : variant === 'burned' ? '#2b2118' : '#6e4525';
    rr(ctx, x + 1, cy - h * 0.32, w - 2, h * 0.64, 10); ctx.fill();
    if (variant === 'cooked') {
      ctx.fillStyle = '#8a5a33';
      ctx.beginPath(); ctx.ellipse(cx - w * 0.2, cy - 2, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + w * 0.18, cy + 3, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#7bc950';
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const px = x + (w * i) / 8;
      const py = cy + (i % 2 === 0 ? -h * 0.28 : h * 0.28);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineTo(x + w, cy + h * 0.3);
    ctx.lineTo(x, cy + h * 0.3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5da83a';
    ctx.fillRect(x + 4, cy + h * 0.1, w - 8, 3);
  } else if (id === 'tomato') {
    ctx.fillStyle = '#e8443a';
    ctx.beginPath(); ctx.ellipse(cx, cy, w / 2 - 2, h * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff7a6e';
    ctx.beginPath(); ctx.ellipse(cx, cy, w / 2 - 12, h * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2b8b0';
    ctx.beginPath(); ctx.ellipse(cx - w * 0.18, cy - h * 0.1, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath();
    ctx.moveTo(x + 4, cy - h * 0.3);
    ctx.lineTo(x + w - 4, cy - h * 0.3);
    ctx.lineTo(cx + w * 0.28, cy + h * 0.34);
    ctx.lineTo(cx - w * 0.1, cy + h * 0.1);
    ctx.lineTo(x + w * 0.2, cy + h * 0.34);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8a91c';
    ctx.beginPath(); ctx.arc(cx - w * 0.2, cy - h * 0.08, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + w * 0.22, cy + h * 0.05, 3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'sauce') {
    ctx.strokeStyle = '#ff9f2e';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 6, cy - h * 0.1);
    ctx.bezierCurveTo(cx - w * 0.25, cy - h * 0.35, cx + w * 0.1, cy + h * 0.3, cx + w * 0.28, cy - h * 0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 10, cy + h * 0.22);
    ctx.bezierCurveTo(cx - w * 0.1, cy - h * 0.15, cx + w * 0.25, cy + h * 0.35, x + w - 8, cy + h * 0.1);
    ctx.stroke();
  }
}

function ingredientLabel(id) {
  if (id === 'bunBottom') return 'Bun';
  return INGREDIENTS.find((i) => i.id === id)?.name ?? id;
}

// --- kitchen pieces ---------------------------------------------------------

function drawGrill(ctx, rect, slots, now) {
  const { x, y, w, h } = rect;
  shadow(ctx, () => {
    ctx.fillStyle = '#3a3f4a';
    rr(ctx, x, y, w, h, 14); ctx.fill();
  });
  text(ctx, 'GRILL', x + w / 2, y + 18, 15, '#c8ccd6');
  ctx.strokeStyle = '#565d6d';
  ctx.lineWidth = 3;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(x + 14, y + 34 + i * 34); ctx.lineTo(x + w - 14, y + 34 + i * 34); ctx.stroke();
  }
  slots.forEach((slot, i) => {
    const sx = x + 22 + i * 132;
    const sy = y + 44;
    const sw = 116, sh = 150;
    ctx.fillStyle = '#2b2f38';
    rr(ctx, sx, sy, sw, sh, 10); ctx.fill();
    if (slot) {
      const t = slot.t;
      const variant = t >= GRILL_BURN_SECONDS ? 'burned' : t >= GRILL_COOK_SECONDS ? 'cooked' : 'raw';
      drawIngredient(ctx, 'patty', sx + 8, sy + 44, sw - 16, 62, variant);
      // progress ring
      const frac = Math.min(1, t / GRILL_COOK_SECONDS);
      const cx = sx + sw / 2, cy = sy + 128;
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = t >= GRILL_BURN_SECONDS ? '#e8443a' : t >= GRILL_COOK_SECONDS ? '#7bc950' : '#ffc93c';
      ctx.beginPath(); ctx.arc(cx, cy, 12, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
      const label = t >= GRILL_BURN_SECONDS ? 'BURNT!' : t >= GRILL_COOK_SECONDS ? 'READY' : 'cooking…';
      text(ctx, label, cx, sy + 18, 13, t >= GRILL_BURN_SECONDS ? '#ff7a6e' : '#e8eaf0');
      if (t >= GRILL_BURN_SECONDS) text(ctx, 'click to toss', cx, sy + 168, 11, '#9aa0ad', 'normal');
    } else {
      text(ctx, 'empty', sx + sw / 2, sy + 80, 13, '#7a8090', 'normal');
    }
  });
  void now;
}

function drawPlateArea(ctx, rect, plate, servingFlash) {
  const { x, y, w, h } = rect;
  shadow(ctx, () => {
    ctx.fillStyle = '#f4ead8';
    rr(ctx, x, y, w, h, 14); ctx.fill();
  });
  text(ctx, 'PLATE — click a topping to undo', x + w / 2, y + 18, 14, '#8a6d3b');
  // the plate
  const px = x + w / 2, py = y + 150;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(px, py + 62, 150, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9c9a8';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(px, py + 62, 128, 22, 0, 0, Math.PI * 2); ctx.stroke();
  // the stack, bottom bun first, then toppings upward
  let sy = py + 52;
  const itemH = 26;
  for (const id of plate) {
    const wob = id === 'bunBottom' ? 0 : (plate.indexOf(id) % 2 === 0 ? -4 : 4);
    drawIngredient(ctx, id, px - 105 + wob, sy - itemH, 210, itemH);
    sy -= itemH - 6;
  }
  if (plate.length <= 1) {
    text(ctx, 'empty plate — add toppings!', px, py - 10, 15, '#b09a6d', 'normal');
  }
  if (servingFlash > 0) {
    ctx.fillStyle = `rgba(123,201,80,${Math.min(0.35, servingFlash * 0.4)})`;
    rr(ctx, x + 8, y + 8, w - 16, h - 16, 10); ctx.fill();
  }
}

function drawBell(ctx, rect, canServe) {
  const { x, y, w, h } = rect;
  shadow(ctx, () => {
    ctx.fillStyle = canServe ? '#ffe08a' : '#e8ddc4';
    rr(ctx, x, y, w, h, 14); ctx.fill();
  });
  // service bell
  const cx = x + w / 2, cy = y + 96;
  ctx.fillStyle = '#c9a227';
  ctx.beginPath(); ctx.ellipse(cx, cy + 52, 62, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8c33c';
  ctx.beginPath();
  ctx.moveTo(cx - 52, cy + 48);
  ctx.quadraticCurveTo(cx, cy - 62, cx + 52, cy + 48);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a6d1f';
  ctx.beginPath(); ctx.arc(cx, cy - 56, 7, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'SERVE', cx, y + 172, 20, canServe ? '#7a5b00' : '#9a8a66');
  text(ctx, canServe ? 'ding! plate matches' : 'build the order first', cx, y + 198, 12, '#8a7a5a', 'normal');
}

function drawStation(ctx, rect, ing, count) {
  const { x, y, w, h } = rect;
  shadow(ctx, () => {
    ctx.fillStyle = '#fff8ea';
    rr(ctx, x, y, w, h, 12); ctx.fill();
  });
  ctx.strokeStyle = '#e0cfa8';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 12); ctx.stroke();
  if (ing.id === 'patty') {
    // raw patty bin feeds the grill
    drawIngredient(ctx, 'patty', x + 22, y + 14, w - 44, 48, 'raw');
    text(ctx, 'RAW PATTY', x + w / 2, y + 84, 14, '#6b5433');
    text(ctx, '→ grill', x + w / 2, y + 104, 12, '#9a8a66', 'normal');
  } else {
    drawIngredient(ctx, ing.id, x + 22, y + 14, w - 44, 48);
    text(ctx, ing.name.toUpperCase(), x + w / 2, y + 84, 14, '#6b5433');
  }
  // key hint
  ctx.fillStyle = '#3a3f4a';
  rr(ctx, x + w - 30, y + 8, 22, 22, 5); ctx.fill();
  text(ctx, ing.key, x + w - 19, y + 20, 13, '#fff');
  if (count > 0) {
    ctx.fillStyle = '#e8443a';
    ctx.beginPath(); ctx.arc(x + 16, y + 14, 11, 0, Math.PI * 2); ctx.fill();
    text(ctx, String(count), x + 16, y + 15, 12, '#fff');
  }
}

// --- order board ------------------------------------------------------------

function drawOrderTicket(ctx, rect, order, now) {
  const { x, y, w, h } = rect;
  const urgent = order.patienceLeft < 12;
  shadow(ctx, () => {
    ctx.fillStyle = order.state === 'served' ? '#dff3d0' : order.state === 'expired' ? '#f3d0d0' : '#fffdf5';
    rr(ctx, x, y, w, h, 10); ctx.fill();
  });
  ctx.strokeStyle = urgent && order.state === 'waiting' ? '#e8443a' : '#e0d6bd';
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 10); ctx.stroke();
  // customer + recipe
  text(ctx, order.customer, x + 14, y + 18, 16, '#3a3f4a', 'bold', 'left');
  text(ctx, order.recipe.name, x + 14, y + 40, 13, '#8a6d3b', 'normal', 'left');
  // recipe icons
  let ix = x + 14;
  for (const [id, n] of Object.entries(order.recipe.needs)) {
    for (let i = 0; i < n; i++) {
      drawIngredient(ctx, id, ix, y + 46, 30, 18);
      ix += 32;
    }
  }
  // reward
  text(ctx, `$${order.reward.total}`, x + w - 12, y + 20, 17, '#2e7d32', 'bold', 'right');
  text(ctx, `+$${order.reward.tip} tip`, x + w - 12, y + 40, 11, '#7a9a6d', 'normal', 'right');
  // patience bar
  const frac = Math.max(0, order.patienceLeft / order.patienceMax);
  ctx.fillStyle = '#e8e2d2';
  rr(ctx, x + 12, y + h - 11, w - 24, 6, 3); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#7bc950' : frac > 0.25 ? '#ffc93c' : '#e8443a';
  if (frac > 0) { rr(ctx, x + 12, y + h - 11, (w - 24) * frac, 6, 3); ctx.fill(); }
  if (order.state === 'served') text(ctx, 'SERVED ✓', x + w / 2, y + h / 2 + 8, 20, '#2e7d32');
  if (order.state === 'expired') text(ctx, 'WALKED OUT', x + w / 2, y + h / 2 + 8, 18, '#c0392b');
  void now;
}

export function drawBoard(ctx, rect, orders) {
  const { x, y, w, h } = rect;
  ctx.fillStyle = '#5d4037';
  rr(ctx, x, y, w, h, 12); ctx.fill();
  text(ctx, 'ORDER BOARD', x + 16, y + 16, 15, '#ffd9a0', 'bold', 'left');
  if (orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush is coming…', x + w / 2, y + h / 2 + 10, 16, '#d7b98a', 'normal');
    return;
  }
  const gap = 12;
  const tw = (w - 24 - gap * (orders.length - 1)) / orders.length;
  orders.forEach((o, i) => {
    drawOrderTicket(ctx, { x: x + 12 + i * (tw + gap), y: y + 28, w: tw, h: h - 40 }, o);
  });
}

// --- top bar ----------------------------------------------------------------

export function drawTopBar(ctx, rect, s) {
  const { x, y, w, h } = rect;
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(x, y, w, h);
  text(ctx, 'SIZZLE & SERVE', x + 20, y + h / 2, 24, '#ffd9a0', 'bold', 'left');
  const mins = Math.floor(s.timeLeft / 60);
  const secs = Math.floor(s.timeLeft % 60);
  const timerColor = s.timeLeft <= 30 ? '#ff7a6e' : '#fff';
  text(ctx, `⏱ ${mins}:${String(secs).padStart(2, '0')}`, x + w / 2 - 130, y + h / 2, 26, timerColor);
  // shift progress
  const frac = 1 - s.timeLeft / 180;
  ctx.fillStyle = '#4a3f33';
  rr(ctx, x + w / 2 + 10, y + h / 2 - 6, 150, 12, 6); ctx.fill();
  ctx.fillStyle = '#ffc93c';
  rr(ctx, x + w / 2 + 10, y + h / 2 - 6, 150 * frac, 12, 6); ctx.fill();
  text(ctx, `SCORE $${s.score}`, x + w - 230, y + h / 2, 22, '#ffd94d');
  text(ctx, s.combo > 1 ? `🔥 x${s.combo}` : '', x + w - 90, y + h / 2, 20, '#ff9f2e');
  text(ctx, `served ${s.served}`, x + w - 372, y + h / 2, 13, '#c8b89a', 'normal', 'right');
}

// --- full scene ---------------------------------------------------------------

export function drawScene(ctx, s) {
  const W = 1280, H = 720;
  // wall + floor
  ctx.fillStyle = '#f7e8c8';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e8d3a8';
  ctx.fillRect(0, 0, W, 8);
  ctx.fillStyle = '#c9a06a';
  ctx.fillRect(0, 528, W, 8);
  ctx.fillStyle = '#8a6d4b';
  ctx.fillRect(0, 536, W, H - 536);
  // subtle wall tiles
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  ctx.lineWidth = 2;
  for (let tx = 0; tx < W; tx += 64) { ctx.beginPath(); ctx.moveTo(tx, 8); ctx.lineTo(tx, 528); ctx.stroke(); }
  for (let ty = 72; ty < 528; ty += 64) { ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke(); }

  drawTopBar(ctx, LAYOUT.topBar, s);
  drawBoard(ctx, LAYOUT.board, s.orders);

  // counter
  const c = LAYOUT.counter;
  shadow(ctx, () => {
    ctx.fillStyle = '#a9805a';
    rr(ctx, c.x, c.y, c.w, c.h, 16); ctx.fill();
  });
  ctx.fillStyle = '#c9a06a';
  rr(ctx, c.x + 6, c.y + 6, c.w - 12, 22, 10); ctx.fill();

  drawGrill(ctx, LAYOUT.grill, s.grill);
  drawPlateArea(ctx, LAYOUT.plate, s.plate, s.servingFlash);
  drawBell(ctx, LAYOUT.bell, s.canServe);

  // ingredient stations
  const st = LAYOUT.stations;
  text(ctx, 'INGREDIENTS — click or press 1–5', st.x + 4, st.y - 10, 14, '#5d4037', 'bold', 'left');
  const gap = 14;
  const sw = (st.w - gap * (INGREDIENTS.length - 1)) / INGREDIENTS.length;
  INGREDIENTS.forEach((ing, i) => {
    const rect = { x: st.x + i * (sw + gap), y: st.y, w: sw, h: st.h };
    const count = s.plate.filter((p) => p === ing.id).length;
    drawStation(ctx, rect, ing, count);
  });

  // floating score pops
  for (const p of s.pops) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / 1.2);
    text(ctx, p.text, p.x, p.y - p.t * 40, 22, p.color);
    ctx.globalAlpha = 1;
  }

  // message banner
  if (s.message) {
    ctx.globalAlpha = Math.min(1, s.message.t * 4);
    shadow(ctx, () => {
      ctx.fillStyle = s.message.good ? '#2e7d32' : '#c0392b';
      rr(ctx, W / 2 - 260, 190, 520, 44, 10); ctx.fill();
    });
    text(ctx, s.message.text, W / 2, 213, 18, '#fff');
    ctx.globalAlpha = 1;
  }

  // title screen overlay
  if (s.screen === 'title') {
    ctx.fillStyle = 'rgba(43,33,24,0.72)';
    ctx.fillRect(0, 0, W, H);
    shadow(ctx, () => {
      ctx.fillStyle = '#fff8ea';
      rr(ctx, 290, 110, 700, 470, 18); ctx.fill();
    });
    text(ctx, 'SIZZLE & SERVE', 640, 165, 44, '#5d4037');
    text(ctx, 'The lunch rush is on. Build burgers, beat the clock.', 640, 212, 18, '#8a6d3b', 'normal');
    const lines = [
      '1–5  add an ingredient  •  click the grill to cook a patty',
      'Click a cooked patty to put it on the plate',
      'SPACE  serve the plate when it matches an order',
      'BACKSPACE  undo the last topping  •  M  mute',
      'Serve fast for bigger tips. Wrong plate: −$2. Expired order: −$5.',
    ];
    lines.forEach((l, i) => text(ctx, l, 640, 258 + i * 30, 16, '#5d4037', 'normal'));
    ctx.fillStyle = '#2e7d32';
    rr(ctx, 480, 430, 320, 56, 12); ctx.fill();
    text(ctx, 'START SHIFT  (Enter)', 640, 459, 22, '#fff');
    text(ctx, '3-minute shift • 4 orders at most • top score wins the rush', 640, 522, 14, '#9a8a66', 'normal');
  }

  // end screen overlay
  if (s.screen === 'over') {
    ctx.fillStyle = 'rgba(43,33,24,0.78)';
    ctx.fillRect(0, 0, W, H);
    shadow(ctx, () => {
      ctx.fillStyle = '#fff8ea';
      rr(ctx, 330, 120, 620, 440, 18); ctx.fill();
    });
    text(ctx, 'SHIFT OVER!', 640, 175, 40, '#5d4037');
    const stars = '★'.repeat(s.stars) + '☆'.repeat(3 - s.stars);
    text(ctx, stars, 640, 225, 34, '#ffc93c');
    text(ctx, `Final score  $${s.score}`, 640, 280, 26, '#2e7d32');
    text(ctx, `Orders served: ${s.served}   •   Wrong plates: ${s.wrongServes}   •   Walk-outs: ${s.expired}`, 640, 322, 16, '#5d4037', 'normal');
    text(ctx, `Best combo: x${s.bestCombo}`, 640, 352, 16, '#5d4037', 'normal');
    const verdict = s.stars === 3 ? 'Head chef material!' : s.stars === 2 ? 'Solid shift, chef.' : s.stars === 1 ? 'The rush got the better of you.' : 'The kitchen won this round.';
    text(ctx, verdict, 640, 398, 18, '#8a6d3b', 'normal');
    ctx.fillStyle = '#2e7d32';
    rr(ctx, 480, 430, 320, 56, 12); ctx.fill();
    text(ctx, 'PLAY AGAIN  (Enter)', 640, 459, 22, '#fff');
  }
}
