// Sizzle & Serve — configuration: recipes, ingredients, timings, layout.
// One clear job: every number the game tunes lives here.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const SHIFT_SECONDS = 180;

// Ingredients. `key` is the keyboard shortcut, `slot` is the counter position.
export const INGREDIENTS = [
  { id: 'patty',   name: 'Patty',   key: '1', color: '#8a5a33', cooked: '#6e4525', raw: '#c98d6b' },
  { id: 'lettuce', name: 'Lettuce', key: '2', color: '#7bc950', cooked: '#7bc950', raw: '#7bc950' },
  { id: 'tomato',  name: 'Tomato',  key: '3', color: '#e8443a', cooked: '#e8443a', raw: '#e8443a' },
  { id: 'cheese',  name: 'Cheese',  key: '4', color: '#ffc93c', cooked: '#ffc93c', raw: '#ffc93c' },
  { id: 'sauce',   name: 'Sauce',   key: '5', color: '#ff9f2e', cooked: '#ff9f2e', raw: '#ff9f2e' },
];

export const GRILL_COOK_SECONDS = 5;   // patty ready after this long on the grill
export const GRILL_BURN_SECONDS = 9;   // past this it burns and must be tossed
export const GRILL_SLOTS = 2;

// Recipes: a name and the counts of each ingredient the plate must hold.
// The bottom bun is always on the plate; the top bun is added when served.
export const RECIPES = [
  { name: 'Classic',      needs: { patty: 1, lettuce: 1, tomato: 1 } },
  { name: 'Cheesy',       needs: { patty: 1, cheese: 1, sauce: 1 } },
  { name: 'Garden',       needs: { lettuce: 1, tomato: 1, cheese: 1, sauce: 1 } },
  { name: 'Double Stack', needs: { patty: 2, cheese: 1, sauce: 1 } },
  { name: 'Full House',   needs: { patty: 1, lettuce: 1, tomato: 1, cheese: 1, sauce: 1 } },
  { name: 'Saucy',        needs: { patty: 1, sauce: 1 } },
  { name: 'Veggie Melt',  needs: { lettuce: 1, tomato: 1, cheese: 2 } },
];

export const CUSTOMERS = [
  'Maya', 'Rudi', 'Sari', 'Budi', 'Lina', 'Dedi', 'Nina', 'Agus',
  'Putri', 'Joko', 'Rina', 'Fajar', 'Dewi', 'Andi', 'Tari', 'Eko',
];

// Order pacing: seconds between new orders, shrinking as the shift goes on.
export function orderIntervalSeconds(elapsed) {
  const t = elapsed / SHIFT_SECONDS; // 0..1
  return 13 - 5 * t;
}
export function orderPatienceSeconds(elapsed) {
  const t = elapsed / SHIFT_SECONDS;
  return 48 - 16 * t;
}
export const MAX_ORDERS = 4;

// Scoring.
export function orderReward(recipe, patienceLeft, patienceMax) {
  const items = Object.values(recipe.needs).reduce((a, b) => a + b, 0);
  const base = 6 + 2 * items;
  const tip = Math.round(6 * (patienceLeft / patienceMax));
  return { base, tip, total: base + tip };
}
export const WRONG_SERVE_PENALTY = 2;
export const EXPIRED_ORDER_PENALTY = 5;

// Star thresholds for the end-of-shift summary.
export const STAR_SCORES = [40, 90, 150];

// Layout (logical 1280x720 canvas).
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 24, y: 80, w: 1232, h: 118 },
  counter: { x: 24, y: 212, w: 1232, h: 300 },
  grill: { x: 48, y: 240, w: 300, h: 240 },
  plate: { x: 440, y: 230, w: 400, h: 260 },
  bell: { x: 920, y: 250, w: 200, h: 220 },
  stations: { x: 24, y: 548, w: 1232, h: 120 },
};
