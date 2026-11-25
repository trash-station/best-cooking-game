# best-cooking-game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/trash-station/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/trash-station/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle & Serve — a lunch-rush cooking game. Orders land on the board, patties
hit the grill, and you build burgers to match: click the counter (or press
1–5), grill the patty, stack the toppings, and ring the bell to serve before
the customer walks out. One 3-minute shift, tips for fast serves, and a
star rating at the end.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no
network requests — every file the game loads sits under `game/`.

To hand the entry in (what the grader runs):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How it plays

- **Order board** (top): up to 4 tickets, each with a recipe and a patience
  bar. Serve the exact plate and you earn the ticket price plus a tip for
  speed; let the bar run out and the customer walks out (−$5).
- **Grill** (left): click the raw-patty station to start one cooking. A patty
  is ready after 5 seconds — grab it before it burns at 9.
- **Plate** (middle): click a topping to add it, click the plate to undo the
  last one. The bottom bun is always there; the top bun lands on serve.
- **Serve bell** (right): ring it when the plate matches an order. A wrong
  plate costs $2 and is cleared.
- **Keys**: 1–5 add ingredients, G takes a cooked patty off the grill,
  Space serves, Backspace undoes, M mutes, Enter starts.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
