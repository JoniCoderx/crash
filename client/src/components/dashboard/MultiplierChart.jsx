import { useEffect, useState } from 'react';
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
import { AnimatePresence, motion } from 'framer-motion';
import { PHASES } from '../../hooks/useGameSocket.js';
import { formatMultiplier } from '../../lib/format.js';

const GREEN = '#25d377';
const RED = '#f4536b';
const GRID = '#1c2836';
const MUTED = '#64748b';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-terminal-600 bg-terminal-800 px-2.5 py-1.5 font-mono text-xs text-ink-100 shadow-lg">
      <span className="text-ink-500">t={p.t.toFixed(1)}s</span>{' '}
      <span className="tabular">{formatMultiplier(p.m)}</span>
    </div>
  );
}

/** Live countdown chip shown during the betting window. */
function Countdown({ endsAt }) {
  const [left, setLeft] = useState(() => Math.max(0, endsAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, endsAt - Date.now())), 100);
    return () => clearInterval(id);
  }, [endsAt]);
  return <span className="tabular">{(left / 1000).toFixed(1)}s</span>;
}

/**
 * The live multiplier curve — a single-series area chart with the current
 * value overlaid as a hero readout. Recharts animation is disabled: at a
 * 100 ms tick rate the stream IS the animation.
 */
export default function MultiplierChart({ game, activePosition }) {
  const { phase, points, multiplier, lastCrashPoint, phaseEndsAt } = game;
  const crashed = phase === PHASES.CRASHED;
  const betting = phase === PHASES.BETTING;

  // Domain covers the curve AND the exit line, so the target marker is
  // visible from the start of the round rather than clipped off-plot.
  const yMax = Math.max(2, activePosition?.target ?? 1, ...points.map((p) => p.m)) * 1.12;
  const color = crashed ? RED : GREEN;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-terminal-700 bg-terminal-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-mono text-xs tracking-widest text-ink-500 uppercase">
          Multiplier curve · round #{game.roundId}
        </h2>
        {betting && phaseEndsAt > 0 && (
          <span className="rounded-full border border-neon-blue/40 px-2.5 py-0.5 font-mono text-xs text-neon-blue">
            Next round in <Countdown endsAt={phaseEndsAt} />
          </span>
        )}
      </div>

      <div className="h-64 sm:h-80 lg:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, 'dataMax']}
              tickFormatter={(t) => `${t < 10 ? t.toFixed(1) : t.toFixed(0)}s`}
              stroke={GRID}
              tick={{ fill: MUTED, fontSize: 11, fontFamily: 'monospace' }}
              tickLine={false}
            />
            <YAxis
              domain={[1, yMax]}
              tickFormatter={(m) => `${m.toFixed(1)}×`}
              stroke={GRID}
              tick={{ fill: MUTED, fontSize: 11, fontFamily: 'monospace' }}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: MUTED, strokeDasharray: '3 3' }} />
            {activePosition && (
              <ReferenceLine
                y={activePosition.target}
                stroke="#38a9f5"
                strokeDasharray="4 4"
                label={{
                  value: `exit ${formatMultiplier(activePosition.target)}`,
                  fill: '#38a9f5',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  position: 'insideTopRight',
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="m"
              stroke={color}
              strokeWidth={2}
              fill="url(#curve-fill)"
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Hero readout overlaid on the plot */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {crashed ? (
            <motion.div
              key={`crash-${game.roundId}`}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="text-center"
            >
              <div className="glow-red font-mono text-5xl font-bold text-neon-red sm:text-6xl">
                {formatMultiplier(lastCrashPoint)}
              </div>
              <div className="mt-1 font-mono text-sm tracking-widest text-neon-red/80 uppercase">
                crashed
              </div>
            </motion.div>
          ) : betting ? (
            <motion.div
              key={`bet-${game.roundId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-sm tracking-widest text-ink-500 uppercase"
            >
              placing positions…
            </motion.div>
          ) : (
            <motion.div
              key={`run-${game.roundId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glow-green tabular font-mono text-5xl font-bold text-neon-green sm:text-6xl"
            >
              {formatMultiplier(multiplier)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
