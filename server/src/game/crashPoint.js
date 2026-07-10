import crypto from 'node:crypto';

/**
 * Samples a crash point from the standard "crash game" distribution.
 *
 * With edge e and U ~ Uniform[0, 1):
 *   - probability e of an instant bust at 1.00x
 *   - otherwise crashPoint = (1 - e) / (1 - U)
 *
 * This yields P(crash >= m) = (1 - e) / m — i.e. half of all rounds end
 * below ~1.98x, and long tails (10x, 50x…) are rare but possible. Each
 * draw uses a fresh CSPRNG value and is **statistically independent of
 * every previous round**: past results carry zero information about the
 * next crash point. That independence is the whole reason "predicting"
 * a crash curve is impossible — see services/predictor.js.
 */
export function sampleCrashPoint(houseEdge = 0.01) {
  // randomInt's range caps at 2^48 - 1 → uniform double in [0, 1)
  const u = crypto.randomInt(0, 2 ** 48 - 1) / 2 ** 48;

  if (u < houseEdge) return 1.0;

  const crash = (1 - houseEdge) / (1 - u);
  // Truncate to 2 decimals, matching how the multiplier is displayed.
  return Math.max(1.0, Math.floor(crash * 100) / 100);
}
