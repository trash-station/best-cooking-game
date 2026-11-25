// Deterministic screenshot states: ?shot=start|play|assembly|serve&seed=N
// One clear job: build a frozen, photogenic game state for each screenshot.

import { RECIPES, SHIFT_SECONDS, orderReward } from './config.js';
import { mulberry32 } from './random.js';
import { freshState } from './game.js';

function order(id, customer, recipeIndex, patienceLeft, patienceMax, state = 'waiting') {
  const recipe = RECIPES[recipeIndex];
  return {
    id,
    customer,
    recipe,
    patienceMax,
    patienceLeft,
    reward: orderReward(recipe, patienceLeft, patienceMax),
    state,
    seen: 0,
  };
}

// A busy mid-shift kitchen: orders on the board, a dish mid-assembly,
// a patty cooking and one ready on the grill, timer running. The cover.
function playState(seed) {
  const s = freshState(seed);
  s.screen = 'playing';
  s.elapsed = 47;
  s.timeLeft = SHIFT_SECONDS - 47;
  s.score = 34;
  s.served = 3;
  s.combo = 2;
  s.bestCombo = 2;
  s.orders = [
    order(1, 'Maya', 0, 31, 48),   // Classic
    order(2, 'Rudi', 4, 18, 44),   // Full House
    order(3, 'Sari', 1, 42, 48),   // Cheesy
  ];
  s.grill = [{ t: 3.2, announced: false }, { t: 6.1, announced: true }];
  s.plate = ['bunBottom', 'patty', 'lettuce'];
  s.pops = [{ x: 640, y: 300, text: '+$12  Maya!', color: '#2e7d32', t: 0.4 }];
  s.canServe = false;
  return s;
}

// A plate one topping away from matching the highlighted order.
function assemblyState(seed) {
  const s = freshState(seed);
  s.screen = 'playing';
  s.elapsed = 82;
  s.timeLeft = SHIFT_SECONDS - 82;
  s.score = 58;
  s.served = 5;
  s.combo = 3;
  s.bestCombo = 3;
  s.orders = [
    order(1, 'Lina', 0, 22, 44),   // Classic: patty, lettuce, tomato
    order(2, 'Budi', 3, 35, 46),   // Double Stack
  ];
  s.grill = [null, { t: 7.4, announced: true }];
  // Classic minus its tomato — one click from done.
  s.plate = ['bunBottom', 'patty', 'lettuce'];
  s.canServe = false;
  return s;
}

// A finished plate at the bell, order stamped SERVED, tip popping.
function serveState(seed) {
  const s = freshState(seed);
  s.screen = 'playing';
  s.elapsed = 59;
  s.timeLeft = SHIFT_SECONDS - 59;
  s.score = 71;
  s.served = 6;
  s.combo = 4;
  s.bestCombo = 4;
  s.orders = [
    order(1, 'Dewi', 1, 30, 46, 'served'), // Cheesy, just served
    order(2, 'Joko', 5, 26, 44),           // Saucy
  ];
  s.grill = [{ t: 1.8, announced: false }, null];
  s.plate = ['bunBottom', 'patty', 'cheese', 'sauce'];
  s.servingFlash = 0.85;
  s.pops = [
    { x: 640, y: 290, text: '+$14  Dewi!', color: '#2e7d32', t: 0.3 },
    { x: 640, y: 322, text: 'includes $5 tip', color: '#7a9a6d', t: 0.3 },
  ];
  s.message = { text: 'Served Dewi — Cheesy +$14', good: true, t: 1.6 };
  s.canServe = true;
  return s;
}

function titleState(seed) {
  const s = freshState(seed);
  s.screen = 'title';
  s.orders = [];
  s.plate = ['bunBottom'];
  return s;
}

export function shotState(shot, seed) {
  void mulberry32(seed);
  switch (shot) {
    case 'play': return playState(seed);
    case 'assembly': return assemblyState(seed);
    case 'serve': return serveState(seed);
    case 'start': return titleState(seed);
    default: return playState(seed);
  }
}
