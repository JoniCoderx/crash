/**
 * Pluggable analysis / "prediction" service.
 *
 * ── PLUG-IN POINT ────────────────────────────────────────────────────────
 * Replace the body of `requestPrediction` with a call to your external
 * analysis API. `apiKey` is the value of the API_KEY environment variable,
 * ready to use as a bearer token / header for that outbound request, e.g.:
 *
 *   const res = await fetch('https://your-analysis-service.example/v1/suggest', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
 *     body: JSON.stringify({ history }),
 *   });
 *   return await res.json();
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ── HONESTY NOTE (please keep) ──────────────────────────────────────────
 * Crash points are independent random draws (see game/crashPoint.js).
 * Mathematically, NO service — AI or otherwise — can predict the next
 * crash point from previous results; any apparent pattern is the
 * gambler's fallacy. This stub therefore does not "predict" anything: it
 * returns a conservative exit target derived from the distribution's
 * known shape, purely so the demo bot has a plausible strategy to act
 * out. The `disclaimer` field is surfaced in the UI on purpose.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * @param {number[]} history  Last (up to) 10 crash points, newest first.
 * @param {string}   apiKey   Value of process.env.API_KEY for the outbound call.
 */
export async function requestPrediction(history, apiKey) {
  void apiKey; // unused by the stub; consumed by your real external call

  const sample = history.slice(0, 10).filter((n) => Number.isFinite(n) && n >= 1);

  // Heuristic demo strategy: aim just under the distribution's median
  // (~1.98x at a 1% edge). Recent volatility nudges the target slightly —
  // a *style* choice for the bot's behavior, not information about the
  // next round.
  const median = percentile(sample, 0.5) ?? 1.98;
  const volatility = Math.min(1, stdDev(sample) / 3);
  const suggested = clamp(1.35 + (median - 1) * 0.35 - volatility * 0.15, 1.15, 2.4);

  return {
    suggestedCashout: Math.round(suggested * 100) / 100,
    confidence: Math.round((0.55 + (1 - volatility) * 0.2) * 100) / 100,
    sampleSize: sample.length,
    rationale:
      'Conservative exit target derived from the crash distribution shape and recent volatility.',
    disclaimer:
      'Simulation only. Crash rounds are statistically independent — no algorithm can predict the next crash point.',
  };
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}
