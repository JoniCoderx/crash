import { formatCredits, formatSigned } from '../../lib/format.js';

/**
 * Session stat tiles. Values wear ink tokens; color is reserved for the
 * P/L polarity readout, which is never color-alone (sign glyph + label).
 */
export default function StatTiles({ bot }) {
  const { balance, stats } = bot;
  const winRate = stats.rounds > 0 ? Math.round((stats.wins / stats.rounds) * 100) : null;

  const tiles = [
    { label: 'Balance (sim credits)', value: formatCredits(balance) },
    {
      label: 'Session P/L',
      value: formatSigned(stats.pnl),
      tone: stats.pnl > 0 ? 'text-neon-green' : stats.pnl < 0 ? 'text-neon-red' : undefined,
    },
    { label: 'Rounds played', value: String(stats.rounds) },
    { label: 'Win rate', value: winRate === null ? '—' : `${winRate}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-terminal-700 bg-terminal-900 px-4 py-3">
          <div className="text-xs text-ink-500">{t.label}</div>
          <div className={`tabular mt-1 font-mono text-xl font-semibold ${t.tone ?? 'text-ink-100'}`}>
            {t.value}
          </div>
        </div>
      ))}
    </div>
  );
}
