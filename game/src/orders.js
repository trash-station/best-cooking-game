// Orders: spawning, patience, matching a plate against a recipe, scoring.
// One clear job: everything about the order board's data, nothing about drawing.

import { RECIPES, CUSTOMERS, MAX_ORDERS, orderIntervalSeconds, orderPatienceSeconds, orderReward, EXPIRED_ORDER_PENALTY } from './config.js';
import { pick } from './random.js';

let nextId = 1;

export function makeOrder(rand, elapsed) {
  const recipe = pick(rand, RECIPES);
  const patienceMax = orderPatienceSeconds(elapsed);
  return {
    id: nextId++,
    customer: pick(rand, CUSTOMERS),
    recipe,
    patienceMax,
    patienceLeft: patienceMax,
    reward: orderReward(recipe, patienceMax, patienceMax),
    state: 'waiting',
  };
}

// Counts of each ingredient on the plate, ignoring the bottom bun.
export function plateCounts(plate) {
  const counts = {};
  for (const id of plate) {
    if (id === 'bunBottom') continue;
    counts[id] = (counts[id] || 0) + 1;
  }
  return counts;
}

// Does this plate satisfy the recipe exactly (no missing, no extra)?
export function plateMatches(plate, recipe) {
  const counts = plateCounts(plate);
  const keys = new Set([...Object.keys(counts), ...Object.keys(recipe.needs)]);
  for (const k of keys) {
    if ((counts[k] || 0) !== (recipe.needs[k] || 0)) return false;
  }
  return true;
}

// The first waiting order this plate satisfies, or null.
export function matchingOrder(plate, orders) {
  for (const o of orders) {
    if (o.state === 'waiting' && plateMatches(plate, o.recipe)) return o;
  }
  return null;
}

export function resetOrderIds() { nextId = 1; }

export class OrderBoard {
  constructor(rand) {
    this.rand = rand;
    this.orders = [];
    this.spawnIn = 2; // first order arrives quickly
  }

  reset(rand) {
    this.rand = rand;
    this.orders = [];
    this.spawnIn = 2;
  }

  // Advance timers; returns orders that just expired.
  update(dt, elapsed) {
    const expired = [];
    for (const o of this.orders) {
      if (o.state !== 'waiting') continue;
      o.patienceLeft -= dt;
      if (o.patienceLeft <= 0) {
        o.patienceLeft = 0;
        o.state = 'expired';
        expired.push(o);
      }
    }
    // drop finished orders after they have been seen briefly
    this.orders = this.orders.filter((o) => o.state === 'waiting' || (o.seen ?? 0) < 1.2);
    for (const o of this.orders) {
      if (o.state !== 'waiting') o.seen = (o.seen ?? 0) + dt;
    }
    // spawn new orders while the shift runs
    this.spawnIn -= dt;
    const waiting = this.orders.filter((o) => o.state === 'waiting').length;
    if (this.spawnIn <= 0 && waiting < MAX_ORDERS) {
      this.orders.push(makeOrder(this.rand, elapsed));
      this.spawnIn = orderIntervalSeconds(elapsed);
    }
    return expired;
  }

  serve(order) {
    order.state = 'served';
    order.seen = 0;
    return order;
  }

  get list() { return this.orders; }
}

export { EXPIRED_ORDER_PENALTY };
