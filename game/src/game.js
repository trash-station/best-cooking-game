// Game state and rules: the shift timer, the grill, the plate, serving.
// One clear job: everything the game does when time passes or the player acts.

import {
  SHIFT_SECONDS, GRILL_COOK_SECONDS, GRILL_BURN_SECONDS, GRILL_SLOTS,
  WRONG_SERVE_PENALTY, EXPIRED_ORDER_PENALTY, STAR_SCORES, orderReward,
} from './config.js';
import { mulberry32 } from './random.js';
import { OrderBoard, matchingOrder, plateCounts } from './orders.js';
import { sfx } from './audio.js';

export function freshState(seed = 1) {
  const rand = mulberry32(seed);
  return {
    seed,
    rand,
    screen: 'title',
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    served: 0,
    wrongServes: 0,
    expired: 0,
    combo: 0,
    bestCombo: 0,
    stars: 0,
    board: new OrderBoard(rand),
    orders: [],
    grill: Array.from({ length: GRILL_SLOTS }, () => null),
    plate: ['bunBottom'],
    pops: [],
    message: null,
    servingFlash: 0,
    canServe: false,
    muted: false,
  };
}

export function startShift(s) {
  s.screen = 'playing';
  s.elapsed = 0;
  s.timeLeft = SHIFT_SECONDS;
  s.score = 0;
  s.served = 0;
  s.wrongServes = 0;
  s.expired = 0;
  s.combo = 0;
  s.bestCombo = 0;
  s.stars = 0;
  s.board.reset(s.rand);
  s.orders = [];
  s.grill = Array.from({ length: GRILL_SLOTS }, () => null);
  s.plate = ['bunBottom'];
  s.pops = [];
  s.message = null;
  s.servingFlash = 0;
  sfx.start();
}

function addPop(s, x, y, text, color) {
  s.pops.push({ x, y, text, color, t: 0 });
  if (s.pops.length > 8) s.pops.shift();
}

function setMessage(s, text, good) {
  s.message = { text, good, t: 2 };
}

function endShift(s) {
  s.screen = 'over';
  s.stars = STAR_SCORES.filter((t) => s.score >= t).length;
  sfx.ready();
}

export function update(s, dt) {
  if (s.screen !== 'playing') return;
  s.elapsed += dt;
  s.timeLeft = Math.max(0, SHIFT_SECONDS - s.elapsed);

  // grill cooking
  s.grill.forEach((slot, i) => {
    if (!slot) return;
    const before = slot.t;
    slot.t += dt;
    if (before < GRILL_COOK_SECONDS && slot.t >= GRILL_COOK_SECONDS) {
      slot.announced = true;
      sfx.ready();
      setMessage(s, `Patty ${i + 1} is ready — grab it!`, true);
    }
    if (before < GRILL_BURN_SECONDS && slot.t >= GRILL_BURN_SECONDS) {
      sfx.expire();
      setMessage(s, `Patty ${i + 1} burned! Click it to toss it.`, false);
    }
  });

  // orders
  const expired = s.board.update(dt, s.elapsed);
  s.orders = s.board.list;
  for (const o of expired) {
    s.expired++;
    s.score = Math.max(0, s.score - EXPIRED_ORDER_PENALTY);
    s.combo = 0;
    setMessage(s, `${o.customer} walked out! −$${EXPIRED_ORDER_PENALTY}`, false);
    sfx.expire();
  }

  // pops + message + flash decay
  for (const p of s.pops) p.t += dt;
  s.pops = s.pops.filter((p) => p.t < 1.2);
  if (s.message) {
    s.message.t -= dt;
    if (s.message.t <= 0) s.message = null;
  }
  if (s.servingFlash > 0) s.servingFlash = Math.max(0, s.servingFlash - dt * 1.5);

  s.canServe = matchingOrder(s.plate, s.orders) !== null;

  if (s.timeLeft <= 0) endShift(s);
}

function takeCookedPatty(s) {
  const i = s.grill.findIndex((slot) => slot && slot.t >= GRILL_COOK_SECONDS && slot.t < GRILL_BURN_SECONDS);
  if (i === -1) return false;
  s.grill[i] = null;
  s.plate.push('patty');
  sfx.add();
  return true;
}

export function handleAction(s, action) {
  if (!action) return;
  if (action.type === 'mute') {
    s.muted = sfx.toggleMute();
    return;
  }
  if (action.type === 'start') {
    startShift(s);
    return;
  }
  if (s.screen !== 'playing') return;

  if (action.type === 'station') {
    if (action.id === 'patty') {
      const free = s.grill.findIndex((slot) => slot === null);
      if (free === -1) {
        setMessage(s, 'Grill is full!', false);
        sfx.error();
        return;
      }
      s.grill[free] = { t: 0, announced: false };
      sfx.grill();
      return;
    }
    s.plate.push(action.id);
    sfx.add();
    return;
  }

  if (action.type === 'grill') {
    const slot = s.grill[action.slot];
    if (!slot) return;
    if (slot.t >= GRILL_BURN_SECONDS) {
      s.grill[action.slot] = null;
      sfx.click();
      setMessage(s, 'Burnt patty tossed.', true);
      return;
    }
    if (slot.t >= GRILL_COOK_SECONDS) {
      s.grill[action.slot] = null;
      s.plate.push('patty');
      sfx.add();
      return;
    }
    setMessage(s, 'Still cooking…', false);
    sfx.click();
    return;
  }

  if (action.type === 'takePatty') {
    if (!takeCookedPatty(s)) {
      setMessage(s, 'No cooked patty on the grill yet.', false);
      sfx.error();
    }
    return;
  }

  if (action.type === 'undo') {
    if (s.plate.length > 1) {
      s.plate.pop();
      sfx.click();
    }
    return;
  }

  if (action.type === 'serve') {
    const order = matchingOrder(s.plate, s.orders);
    if (!order) {
      s.wrongServes++;
      s.combo = 0;
      s.score = Math.max(0, s.score - WRONG_SERVE_PENALTY);
      s.plate = ['bunBottom'];
      setMessage(s, `Wrong plate! No order matches. −$${WRONG_SERVE_PENALTY}`, false);
      sfx.error();
      return;
    }
    const reward = orderReward(order.recipe, order.patienceLeft, order.patienceMax);
    s.board.serve(order);
    s.score += reward.total;
    s.served++;
    s.combo++;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    s.plate = ['bunBottom'];
    s.servingFlash = 1;
    addPop(s, 640, 300, `+$${reward.total}  ${order.customer}!`, '#2e7d32');
    if (reward.tip > 0) addPop(s, 640, 330, `includes $${reward.tip} tip`, '#7a9a6d');
    setMessage(s, `Served ${order.customer} — ${order.recipe.name} +$${reward.total}`, true);
    sfx.serve();
  }
}

export { plateCounts };
