import 'dotenv/config';

/**
 * Central runtime configuration.
 *
 * API_KEY is read once from the environment. It is required by the
 * authenticated /api/analyze route and forwarded to the pluggable
 * prediction service. It is never sent to the browser.
 */
export const config = {
  port: Number(process.env.PORT) || 4000,
  apiKey: process.env.API_KEY || '',

  game: {
    /** ms between multiplier ticks broadcast to clients */
    tickIntervalMs: 100,
    /** length of the "place your position" window before each round */
    bettingWindowMs: 5000,
    /** pause after a crash before the next betting window opens */
    cooldownMs: 3000,
    /**
     * Continuous growth rate per millisecond.
     * multiplier(t) = e^(rate * t)  →  0.00012/ms doubles roughly every 5.8s,
     * which keeps demo rounds snappy without being unreadable.
     */
    growthRatePerMs: 0.00012,
    /** house-edge parameter of the crash distribution (see crashPoint.js) */
    houseEdge: 0.01,
    /** how many finished rounds we retain and expose to clients */
    historySize: 50,
  },
};
