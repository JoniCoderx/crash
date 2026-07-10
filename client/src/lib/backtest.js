/**
 * Simulation backtester.
 *
 * Runs a betting strategy across many rounds of the SAME crash
 * distribution the live server uses (see server/src/game/crashPoint.js),
 * ported here so a 10k-round backtest runs instantly in the browser.
 *
 * Everything is virtual credits — this is an analysis tool. Because crash
 * rounds are independent and the distribution carries a house edge, the
 * expected balance drifts *down* over time regardless of strategy; the
 * point of the backtester is to make that visible, not to beat it.
 */

/** Deterministic PRNG (mulberry32) so a given seed reproduces a run. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Samples one crash point. Mirrors server/src/game/crashPoint.js exactly:
 *   P(instant bust at 1.00x) = edge
 *   otherwise crash = (1 - edge) / (1 - u), floored to 2 decimals.
 */
function sampleCrashPoint(rng, houseEdge) {
  const u = rng();
  if (u < houseEdge) return 1.0;
  return Math.max(1.0, Math.floor(((1 - houseEdge) / (1 - u)) * 100) / 100);
}

export const STRATEGIES = {
  fixed: {
    label: 'Fixed exit',
    description: 'Bet the base stake every round, always cashing out at the target multiplier.',
    /** stake is constant; the stake state is unused. */
    nextStake: (base) => base,
  },
  martingale: {
    label: 'Martingale',
    description:
      'Double the stake after every loss, reset to base after a win. Chases losses — and busts fast.',
    nextStake: (base, lastStake, lastWon) => (lastWon ? base : lastStake * 2),
  },
};

/**
 * Run a backtest.
 *
 * @param {object} cfg
 * @param {'fixed'|'martingale'} cfg.strategy
 * @param {number} cfg.rounds           number of rounds to simulate
 * @param {number} cfg.startingBalance
 * @param {number} cfg.baseStake
 * @param {number} cfg.target           cash-out multiplier
 * @param {number} cfg.houseEdge        distribution edge (default 0.01)
 * @param {number} [cfg.seed]           PRNG seed; omit for a random run
 * @returns {{ curve: {round:number,balance:number}[], stats: object }}
 */
export function runBacktest(cfg) {
  const {
    strategy = 'fixed',
    rounds = 10000,
    startingBalance = 1000,
    baseStake = 10,
    target = 2.0,
    houseEdge = 0.01,
    seed,
  } = cfg;

  const rng = mulberry32(seed ?? ((Math.random() * 2 ** 32) >>> 0));
  const strat = STRATEGIES[strategy] ?? STRATEGIES.fixed;

  const balances = new Float64Array(rounds + 1);
  balances[0] = startingBalance;

  let balance = startingBalance;
  let stake = baseStake;
  let lastWon = true;
  let wins = 0;
  let losses = 0;
  let peak = startingBalance;
  let maxDrawdown = 0; // largest peak-to-trough drop in credits
  let played = 0;
  let bustedRound = null;

  for (let i = 1; i <= rounds; i += 1) {
    stake = Math.round(strat.nextStake(baseStake, stake, lastWon) * 100) / 100;

    // Ruin: the next required stake is unaffordable — the run ends here.
    if (stake > balance) {
      bustedRound = i;
      for (let j = i; j <= rounds; j += 1) balances[j] = balance;
      break;
    }

    balance -= stake;
    const crash = sampleCrashPoint(rng, houseEdge);
    lastWon = crash >= target;

    if (lastWon) {
      balance += stake * target;
      wins += 1;
    } else {
      losses += 1;
    }

    balance = Math.round(balance * 100) / 100;
    balances[i] = balance;
    played += 1;

    if (balance > peak) peak = balance;
    if (peak - balance > maxDrawdown) maxDrawdown = peak - balance;
  }

  // Expected end balance under flat betting over the full horizon is
  // start - baseStake * edge * rounds, because EV per unit staked is
  // exactly -edge for any target. (Only meaningful for the fixed strategy,
  // where the stake is constant; it ignores the ruin barrier at 0.)
  const expectedFinal =
    strategy === 'fixed'
      ? Math.round((startingBalance - baseStake * houseEdge * rounds) * 100) / 100
      : null;

  return {
    curve: downsample(balances),
    stats: {
      finalBalance: Math.round(balance * 100) / 100,
      startingBalance,
      peak: Math.round(peak * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      wins,
      losses,
      roundsPlayed: played,
      winRate: played ? wins / played : 0,
      busted: bustedRound !== null,
      bustedRound,
      expectedFinal: expectedFinal === null ? null : Math.round(expectedFinal * 100) / 100,
    },
  };
}

/** Reduce an N-point curve to ~600 points for smooth charting. */
function downsample(balances, maxPoints = 600) {
  const n = balances.length;
  if (n <= maxPoints) {
    return Array.from(balances, (balance, round) => ({ round, balance }));
  }
  const step = n / maxPoints;
  const out = [];
  for (let i = 0; i < maxPoints; i += 1) {
    const idx = Math.floor(i * step);
    out.push({ round: idx, balance: balances[idx] });
  }
  out.push({ round: n - 1, balance: balances[n - 1] });
  return out;
}
