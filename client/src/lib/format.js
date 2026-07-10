/** "2.13×" — the standard multiplier readout. */
export function formatMultiplier(n) {
  return `${Number(n ?? 1).toFixed(2)}×`;
}

/** Simulated credits, always signed-aware: "1,204.50" */
export function formatCredits(n) {
  return Number(n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "+12.40" / "−8.00" for P/L readouts. */
export function formatSigned(n) {
  const v = Number(n ?? 0);
  return `${v >= 0 ? '+' : '−'}${formatCredits(Math.abs(v))}`;
}

/** "14:03:22" timestamps for the live log. */
export function formatTime(ts = Date.now()) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}
