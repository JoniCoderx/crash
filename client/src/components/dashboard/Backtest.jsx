import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import { runBacktest, STRATEGIES } from '../../lib/backtest.js';
import { formatCredits, formatSigned } from '../../lib/format.js';

const GREEN = '#25d377';
const RED = '#f4536b';
const GRID = '#1c2836';
const MUTED = '#64748b';

const DEFAULTS = {
  strategy: 'fixed',
  rounds: 10000,
  startingBalance: 1000,
  baseStake: 10,
  target: 2.0,
};

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  'tabular w-full rounded-lg border border-terminal-600 bg-terminal-800 px-3 py-2 font-mono text-sm text-ink-100 outline-none focus:border-neon-blue/60';

function BacktestTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-terminal-600 bg-terminal-800 px-2.5 py-1.5 font-mono text-xs text-ink-100 shadow-lg">
      <span className="text-ink-500">round {p.round.toLocaleString()}</span>
      <br />
      <span className="tabular">{formatCredits(p.balance)} cr</span>
    </div>
  );
}

export default function Backtest() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const set = (key, isNumber = true) => (e) => {
    const raw = e.target.value;
    const value = isNumber ? Number(raw) : raw;
    setCfg((c) => ({ ...c, [key]: value }));
  };

  const run = () => {
    setRunning(true);
    // Defer so the button's pressed state paints before the (fast) crunch.
    requestAnimationFrame(() => {
      setResult(runBacktest(cfg));
      setRunning(false);
    });
  };

  const curveColor = useMemo(() => {
    if (!result) return GREEN;
    return result.stats.finalBalance >= result.stats.startingBalance ? GREEN : RED;
  }, [result]);

  const stats = result?.stats;
  const netPnl = stats ? stats.finalBalance - stats.startingBalance : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* ── Strategy configuration ─────────────────────────────────── */}
      <section className="space-y-3 rounded-2xl border border-terminal-700 bg-terminal-900 p-4 lg:col-span-1">
        <h2 className="font-mono text-xs tracking-widest text-ink-500 uppercase">Strategy</h2>

        <Field label="Betting strategy" hint={STRATEGIES[cfg.strategy].description}>
          <select value={cfg.strategy} onChange={set('strategy', false)} className={inputClass}>
            {Object.entries(STRATEGIES).map(([key, s]) => (
              <option key={key} value={key}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Exit target (×)">
            <input type="number" min="1.05" step="0.05" value={cfg.target} onChange={set('target')} className={inputClass} />
          </Field>
          <Field label="Base stake (cr)">
            <input type="number" min="1" step="1" value={cfg.baseStake} onChange={set('baseStake')} className={inputClass} />
          </Field>
          <Field label="Starting balance">
            <input type="number" min="1" step="10" value={cfg.startingBalance} onChange={set('startingBalance')} className={inputClass} />
          </Field>
          <Field label="Rounds">
            <input type="number" min="100" max="200000" step="100" value={cfg.rounds} onChange={set('rounds')} className={inputClass} />
          </Field>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="w-full rounded-lg bg-neon-green px-4 py-2.5 text-sm font-semibold text-terminal-950 transition hover:brightness-110 disabled:opacity-50"
        >
          {running ? 'Simulating…' : `Run ${Number(cfg.rounds).toLocaleString()} rounds`}
        </button>

        <p className="rounded-lg border border-neon-amber/30 bg-neon-amber/5 px-3 py-2 text-[11px] leading-relaxed text-ink-300">
          Rounds are independent draws with a house edge, so expected balance trends{' '}
          <span className="text-neon-amber">downward</span> over time. This tool shows what a
          strategy actually does against that math — it doesn't beat it.
        </p>
      </section>

      {/* ── Results ────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-terminal-700 bg-terminal-900 p-4 lg:col-span-2">
        {!result ? (
          <div className="flex h-full min-h-72 items-center justify-center text-center text-sm text-ink-500">
            Configure a strategy and run a backtest to see its balance curve.
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Summary tiles */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Final balance" value={formatCredits(stats.finalBalance)} />
              <StatTile
                label="Net P/L"
                value={formatSigned(netPnl)}
                tone={netPnl > 0 ? 'text-neon-green' : netPnl < 0 ? 'text-neon-red' : undefined}
              />
              <StatTile label="Peak" value={formatCredits(stats.peak)} />
              <StatTile
                label="Max drawdown"
                value={`−${formatCredits(stats.maxDrawdown)}`}
                tone="text-neon-red"
              />
            </div>

            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.curve} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                  <defs>
                    <linearGradient id="bt-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={curveColor} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={curveColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
                  <XAxis
                    dataKey="round"
                    type="number"
                    domain={[0, 'dataMax']}
                    tickFormatter={(r) => (r >= 1000 ? `${(r / 1000).toFixed(0)}k` : r)}
                    stroke={GRID}
                    tick={{ fill: MUTED, fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                    stroke={GRID}
                    tick={{ fill: MUTED, fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip content={<BacktestTooltip />} cursor={{ stroke: MUTED, strokeDasharray: '3 3' }} />
                  <ReferenceLine
                    y={stats.startingBalance}
                    stroke={MUTED}
                    strokeDasharray="4 4"
                    label={{ value: 'break-even', fill: MUTED, fontSize: 11, position: 'insideBottomRight' }}
                  />
                  {stats.expectedFinal !== null && (
                    <ReferenceLine
                      y={stats.expectedFinal}
                      stroke="#38a9f5"
                      strokeDasharray="2 4"
                      label={{
                        value: `expected ${formatCredits(stats.expectedFinal)}`,
                        fill: '#38a9f5',
                        fontSize: 11,
                        position: 'insideTopRight',
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={curveColor}
                    strokeWidth={2}
                    fill="url(#bt-fill)"
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 font-mono text-xs text-ink-500">
              {stats.roundsPlayed.toLocaleString()} rounds played · {stats.wins.toLocaleString()} wins /{' '}
              {stats.losses.toLocaleString()} losses · win rate {(stats.winRate * 100).toFixed(1)}%
              {stats.busted && (
                <span className="text-neon-red">
                  {' '}
                  · busted at round {stats.bustedRound.toLocaleString()}
                </span>
              )}
            </p>
          </motion.div>
        )}
      </section>
    </div>
  );
}

function StatTile({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-terminal-700 bg-terminal-800/60 px-3 py-2.5">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`tabular mt-1 font-mono text-lg font-semibold ${tone ?? 'text-ink-100'}`}>
        {value}
      </div>
    </div>
  );
}
