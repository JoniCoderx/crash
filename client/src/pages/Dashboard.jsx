import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { useBot } from '../hooks/useBot.js';
import MultiplierChart from '../components/dashboard/MultiplierChart.jsx';
import BotControls from '../components/dashboard/BotControls.jsx';
import LiveLog from '../components/dashboard/LiveLog.jsx';
import StatTiles from '../components/dashboard/StatTiles.jsx';
import HistoryChips from '../components/dashboard/HistoryChips.jsx';
import Backtest from '../components/dashboard/Backtest.jsx';

const TABS = [
  { id: 'live', label: 'Live simulation' },
  { id: 'backtest', label: 'Backtest' },
];

export default function Dashboard() {
  const game = useGameSocket();
  const [tab, setTab] = useState('live');

  const [settings, setSettings] = useState({
    stake: 10,
    target: 2.0, // manual auto cash-out multiplier
    stopLoss: 100, // halt the bot after this much cumulative session loss
    aiEnabled: true,
  });

  const bot = useBot(game, settings);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-lg font-semibold tracking-wide">
          Terminal <span className="text-ink-500">/</span>{' '}
          <span className="text-neon-blue">{tab === 'live' ? 'live simulation' : 'backtester'}</span>
        </h1>
        {tab === 'live' && (
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs ${
              game.connected
                ? 'border-neon-green/40 text-neon-green'
                : 'border-neon-red/40 text-neon-red'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                game.connected ? 'animate-pulse bg-neon-green' : 'bg-neon-red'
              }`}
            />
            {game.connected ? 'FEED CONNECTED' : 'FEED OFFLINE'}
          </span>
        )}
      </div>

      {/* Tab switcher */}
      <div className="mb-4 flex gap-1 rounded-xl border border-terminal-700 bg-terminal-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'text-terminal-950' : 'text-ink-300 hover:text-ink-100'
            }`}
          >
            {tab === t.id && (
              <motion.span
                layoutId="dash-tab"
                className="absolute inset-0 rounded-lg bg-neon-green"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'live' ? (
        <>
          <StatTiles bot={bot} />

          {/* Main grid: chart dominates; controls + log ride the right rail
              on desktop and stack beneath on mobile/tablet. */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <MultiplierChart game={game} activePosition={bot.activePosition} />
              <HistoryChips history={game.history} />
            </div>

            <div className="space-y-4">
              <BotControls settings={settings} onChange={setSettings} bot={bot} game={game} />
              <LiveLog entries={bot.log} />
            </div>
          </div>
        </>
      ) : (
        <Backtest />
      )}
    </motion.div>
  );
}
