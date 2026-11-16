# makefun-token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/bongekanjing/makefun-token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/bongekanjing/makefun-token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar — every protocol that records no token yet, ranked by what its token would be worth if the protocol's record stayed as it is, with a concrete farm plan for each one. Built for make.fun's "Build the best token launch radar" bounty ($1,325 in USDC).

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

Node 22 or later, standard library only — nothing to install. The program reads a DefiLlama protocol snapshot (`snapshot.json`), writes the ranked board to `out/board.json`, the dashboard's data to `out/data.js`, copies `dashboard/` and `screenshots/` to `out/`, and writes `out/dossier.json`.

## The model

```
implied value = TVL × category multiple × growth multiplier × maturity multiplier × breadth multiplier
```

- **Category multiple** — a token is a claim on the cash its category generates. Perpetuals exchanges (0.38× TVL) monetise TVL harder than bridges (0.10–0.14×). The multiple is a property of the category, never of a name.
- **Growth multiplier** — 1 + clamped 7-day TVL change × 0.6, clamped to −50% … +150%.
- **Maturity multiplier** — 0.55 + up to 0.45 by age, capped at 3 years. A protocol that has run for years with no token has survived more cycles and built a larger base to distribute a token to.
- **Breadth multiplier** — 1 + 0.02 per chain beyond the first, up to 10 chains.

The board covers all 40 protocols on the snapshot's watchlist plus every other rankable pre-token protocol below the $50,000,000 floor (186 early finds, 226 rows in all). Protocols whose token already trades are kept apart in their own view, at the market's own market cap — never a modelled number. An implied value is the radar's own claim, not a prediction that a token will be issued.

## The dashboard

A static page with no network and no framework: a sortable, filterable board (search, category, chain, watchlist vs early finds), a detail view for every protocol showing the model's own arithmetic step by step and its six-step farm plan, the model explained in full, and the already-trading table for contrast.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
