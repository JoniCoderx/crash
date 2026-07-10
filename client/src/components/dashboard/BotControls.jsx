import { motion } from 'framer-motion';
import { PHASES } from '../../hooks/useGameSocket.js';
import { formatMultiplier } from '../../lib/format.js';

function Field({ label, suffix, ...input }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-500">{label}</span>
      <div className="flex items-center rounded-lg border border-terminal-600 bg-terminal-800 focus-within:border-neon-blue/60">
        <input
          {...input}
          className="tabular w-full bg-transparent px-3 py-2 font-mono text-sm text-ink-100 outline-none disabled:opacity-50"
        />
        {suffix && <span className="pr-3 font-mono text-xs text-ink-500">{suffix}</span>}
      </div>
    </label>
  );
}

/**
 * Bot configuration panel: simulated stake, manual auto cash-out, session
 * stop-loss, AI-logic toggle, and engage/disengage/reset controls.
 * Inputs lock while the bot is running so a round is never reconfigured
 * mid-flight.
 */
export default function BotControls({ settings, onChange, bot, game }) {
  const { running } = bot;

  const set = (key) => (e) => {
    const value = e.target.valueAsNumber;
    if (Number.isFinite(value)) onChange({ ...settings, [key]: value });
  };

  return (
    <section className="rounded-2xl border border-terminal-700 bg-terminal-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs tracking-widest text-ink-500 uppercase">Bot controls</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-widest uppercase ${
            running ? 'bg-neon-green/15 text-neon-green' : 'bg-terminal-800 text-ink-500'
          }`}
        >
          {running ? 'engaged' : 'idle'}
        </span>
      </div>

      <div className="space-y-3">
        <Field
          label="Base stake (simulated credits)"
          type="number"
          min="1"
          step="1"
          value={settings.stake}
          onChange={set('stake')}
          disabled={running}
          suffix="cr"
        />
        <Field
          label="Auto cash-out target"
          type="number"
          min="1.05"
          step="0.05"
          value={settings.target}
          onChange={set('target')}
          disabled={running || settings.aiEnabled}
          suffix="×"
        />
        <Field
          label="Session stop-loss (0 = off)"
          type="number"
          min="0"
          step="10"
          value={settings.stopLoss}
          onChange={set('stopLoss')}
          disabled={running}
          suffix="cr"
        />

        {/* AI-logic toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={settings.aiEnabled}
          disabled={running}
          onClick={() => onChange({ ...settings, aiEnabled: !settings.aiEnabled })}
          className="flex w-full items-center justify-between rounded-lg border border-terminal-600 bg-terminal-800 px-3 py-2.5 text-left disabled:opacity-60"
        >
          <span>
            <span className="block text-sm text-ink-100">Enable AI logic</span>
            <span className="block text-xs text-ink-500">
              Exit target from the analysis service
            </span>
          </span>
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              settings.aiEnabled ? 'bg-neon-blue' : 'bg-terminal-600'
            }`}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink-100 ${
                settings.aiEnabled ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </span>
        </button>

        {settings.aiEnabled && game.suggestion && (
          <p className="rounded-lg border border-neon-blue/30 bg-neon-blue/5 px-3 py-2 text-xs leading-relaxed text-ink-300">
            <span className="font-mono text-neon-blue">AI</span> currently suggests exiting at{' '}
            <span className="tabular font-mono text-ink-100">
              {formatMultiplier(game.suggestion.suggestedCashout)}
            </span>
            . <span className="text-ink-500">{game.suggestion.disclaimer}</span>
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {running ? (
            <button
              type="button"
              onClick={bot.stop}
              className="flex-1 rounded-lg bg-neon-red/90 px-4 py-2.5 text-sm font-semibold text-terminal-950 transition hover:brightness-110"
            >
              Stop bot
            </button>
          ) : (
            <button
              type="button"
              onClick={bot.start}
              disabled={!game.connected}
              className="flex-1 rounded-lg bg-neon-green px-4 py-2.5 text-sm font-semibold text-terminal-950 transition hover:brightness-110 disabled:opacity-40"
            >
              Start bot
            </button>
          )}
          <button
            type="button"
            onClick={bot.reset}
            className="rounded-lg border border-terminal-600 px-4 py-2.5 text-sm font-medium text-ink-300 transition hover:border-neon-red/50 hover:text-neon-red"
          >
            Reset
          </button>
        </div>

        {bot.activePosition && game.phase !== PHASES.CRASHED && (
          <p className="text-center font-mono text-xs text-ink-500">
            Open position: {bot.activePosition.stake.toFixed(2)} cr → exit{' '}
            {formatMultiplier(bot.activePosition.target)}
          </p>
        )}
      </div>
    </section>
  );
}
