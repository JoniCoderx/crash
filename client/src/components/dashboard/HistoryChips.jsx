import { AnimatePresence, motion } from 'framer-motion';
import { formatMultiplier } from '../../lib/format.js';

/**
 * Recent crash results, newest first. Chips encode magnitude — below 2×
 * (the distribution median) reads red, at/above reads green — and always
 * carry the numeric label, so color never works alone.
 */
export default function HistoryChips({ history }) {
  const recent = history.slice(0, 14);

  return (
    <section className="rounded-2xl border border-terminal-700 bg-terminal-900 p-4">
      <h2 className="mb-3 font-mono text-xs tracking-widest text-ink-500 uppercase">
        Recent crashes
      </h2>
      {recent.length === 0 ? (
        <p className="text-sm text-ink-500">Waiting for the first round to finish…</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {recent.map((h) => {
              const high = h.crashPoint >= 2;
              return (
                <motion.li
                  key={h.roundId}
                  layout
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`tabular rounded-md border px-2.5 py-1 font-mono text-xs ${
                    high
                      ? 'border-neon-green/40 bg-neon-green/10 text-neon-green'
                      : 'border-neon-red/40 bg-neon-red/10 text-neon-red'
                  }`}
                >
                  {formatMultiplier(h.crashPoint)}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
