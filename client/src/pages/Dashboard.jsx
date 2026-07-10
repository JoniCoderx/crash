import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { useBot } from '../hooks/useBot.js';
import MultiplierChart from '../components/dashboard/MultiplierChart.jsx';
import BotControls from '../components/dashboard/BotControls.jsx';
import LiveLog from '../components/dashboard/LiveLog.jsx';
import StatTiles from '../components/dashboard/StatTiles.jsx';
import HistoryChips from '../components/dashboard/HistoryChips.jsx';

export default function Dashboard() {
  const game = useGameSocket();

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
          <span className="text-neon-blue">live simulation</span>
        </h1>
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
      </div>

      <StatTiles bot={bot} />

      {/* Main grid: chart dominates; controls + log ride the right rail on
          desktop and stack beneath on mobile/tablet. */}
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
    </motion.div>
  );
}
