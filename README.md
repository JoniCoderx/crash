# QuantumCrash Analytics

A dark, neon-accented "trading terminal" that simulates a crash-style multiplier curve and lets an
automated bot play strategies against it — live chart, bot controls, decision log, and a pluggable
analysis API.

> **This is a simulation.** All stakes and balances are virtual credits. The app connects to no
> gambling services and handles no real money. Crash rounds are independent random draws, so no
> algorithm — including the bundled "AI logic" — can actually predict the next crash point. The
> prediction service exists as an integration seam and demo strategy, not a forecaster.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React (Vite), Tailwind CSS v4, Framer Motion, Recharts, socket.io-client |
| Backend  | Node.js, Express, Socket.io |

## Quick start

```bash
npm install          # root tooling (concurrently)
npm run setup        # installs server/ and client/ dependencies

cp .env.example .env # then set API_KEY

npm run dev          # dev mode: Express on :4000, Vite on :5173 (proxied)
```

Production:

```bash
npm run build        # builds client/dist
npm start            # Express serves the API, the socket feed, AND the built frontend on :4000
```

## How the simulation works

- **Crash distribution** (`server/src/game/crashPoint.js`): each round samples a crash point with
  `P(crash ≥ m) = (1 − edge) / m` at a 1% edge — the standard published crash-game math. Median
  crash ≈ 1.98×; every draw is CSPRNG-fresh and independent of history.
- **Game loop** (`server/src/game/gameLoop.js`): cycles `BETTING (5s) → RUNNING → CRASHED (3s)`.
  While running, the multiplier grows as `e^(0.00012 · ms)` and is broadcast every 100 ms over
  Socket.io (`game:tick`), with `game:phase` / `game:crash` marking transitions. A polling fallback
  lives at `GET /api/state`.
- **The bot** (`client/src/hooks/useBot.js`): stakes virtual credits each betting window, exits at
  its target multiplier, and logs every decision. The exit target is either the manual auto
  cash-out or — with **Enable AI logic** on — the analysis service's per-round suggestion. A
  session stop-loss halts the bot automatically.
- **The backtester** (`client/src/lib/backtest.js`, **Backtest** tab): runs a strategy (fixed exit
  or Martingale) across up to hundreds of thousands of rounds of the *same* crash distribution,
  using a seeded PRNG so runs reproduce. It plots the resulting balance curve with break-even and
  expected-value reference lines, plus final/peak/drawdown/bust stats. Because the rounds are
  independent and carry a house edge, expected balance drifts downward — the backtester exists to
  make that visible, not to find an edge (there isn't one).

## Analysis API

`POST /api/analyze` — authenticated with the `API_KEY` environment variable, presented as an
`x-api-key` (or `Authorization: Bearer`) header:

```bash
curl -X POST http://localhost:4000/api/analyze \
  -H "content-type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"history": [1.42, 3.07, 1.0, 2.51, 1.13, 1.87, 5.2, 1.55, 2.02, 1.31]}'
```

Response:

```json
{
  "ok": true,
  "analysis": {
    "suggestedCashout": 1.55,
    "confidence": 0.68,
    "sampleSize": 10,
    "rationale": "Conservative exit target derived from the crash distribution shape and recent volatility.",
    "disclaimer": "Simulation only. Crash rounds are statistically independent — no algorithm can predict the next crash point."
  }
}
```

**Plugging in your own service:** replace the body of `requestPrediction` in
`server/src/services/predictor.js` — it receives the history array and the `API_KEY` value for the
outbound call, and everything downstream (the `/api/analyze` route and the per-round `game:suggestion`
socket broadcast the bot consumes) picks it up automatically.

## Project structure

```
├── package.json              # root scripts: setup / dev / build / start
├── server/
│   └── src/
│       ├── index.js          # Express + Socket.io + static frontend
│       ├── config.js         # env + game tuning
│       ├── game/             # crash distribution + round state machine
│       ├── services/         # pluggable prediction service (API_KEY seam)
│       ├── middleware/       # API-key auth
│       └── routes/           # POST /api/analyze
└── client/
    └── src/
        ├── hooks/            # useGameSocket (feed), useBot (strategy engine)
        ├── pages/            # Landing, Dashboard
        └── components/       # layout / landing / dashboard UI
```
