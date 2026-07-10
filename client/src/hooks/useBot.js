import { useCallback, useEffect, useRef, useState } from 'react';
import { PHASES } from './useGameSocket.js';
import { formatMultiplier, formatSigned } from '../lib/format.js';

const STARTING_BALANCE = 1000;

/**
 * The automated demo bot.
 *
 * Runs entirely against the simulated feed: places a simulated stake in
 * each betting window, exits when the multiplier reaches its target, and
 * eats the loss when a round crashes first. With "AI Logic" enabled the
 * exit target comes from the server's analysis-service suggestion;
 * otherwise the manual auto cash-out target is used. A session stop-loss
 * halts the bot when cumulative losses exceed the configured limit.
 *
 * All currency is simulated credits — nothing here touches real money.
 */
export function useBot(game, settings) {
  const [running, setRunning] = useState(false);
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [stats, setStats] = useState({ rounds: 0, wins: 0, losses: 0, pnl: 0 });
  const [log, setLog] = useState([]);
  const [activePosition, setActivePosition] = useState(null);

  // Refs mirror fast-changing values so socket-driven effects never act
  // on stale closures.
  const positionRef = useRef(null); // { roundId, stake, target, ai }
  const settingsRef = useRef(settings);
  const runningRef = useRef(running);
  const statsRef = useRef(stats);
  const balanceRef = useRef(balance);
  const logIdRef = useRef(0);

  settingsRef.current = settings;
  runningRef.current = running;
  statsRef.current = stats;
  balanceRef.current = balance;

  const addLog = useCallback((type, text) => {
    logIdRef.current += 1;
    const entry = { id: logIdRef.current, at: Date.now(), type, text };
    setLog((prev) => [...prev.slice(-99), entry]);
  }, []);

  const syncPosition = useCallback((pos) => {
    positionRef.current = pos;
    setActivePosition(pos);
  }, []);

  // ── Betting window: open a simulated position ─────────────────────────
  useEffect(() => {
    if (game.phase !== PHASES.BETTING || !runningRef.current) return;

    const { stake, target, aiEnabled, stopLoss } = settingsRef.current;

    if (stopLoss > 0 && statsRef.current.pnl <= -stopLoss) {
      setRunning(false);
      addLog('system', `Stop-loss reached (${formatSigned(statsRef.current.pnl)}). Bot halted.`);
      return;
    }
    if (balanceRef.current < stake) {
      setRunning(false);
      addLog('system', 'Insufficient simulated balance. Bot halted.');
      return;
    }

    setBalance((b) => b - stake);
    syncPosition({ roundId: game.roundId, stake, target, ai: aiEnabled });
    addLog('info', `Round #${game.roundId}: staked ${stake.toFixed(2)} credits (simulated).`);
    addLog(
      'info',
      aiEnabled
        ? 'Analyzing last rounds — waiting for AI exit target…'
        : `Manual exit target set at ${formatMultiplier(target)}.`,
    );
  }, [game.phase, game.roundId, addLog, syncPosition]);

  // ── AI suggestion arrives for the round we just entered ───────────────
  useEffect(() => {
    const pos = positionRef.current;
    const s = game.suggestion;
    if (!s || !pos || !pos.ai || s.roundId !== pos.roundId) return;

    syncPosition({ ...pos, target: s.suggestedCashout });
    addLog(
      'ai',
      `AI suggests exiting at ${formatMultiplier(s.suggestedCashout)} ` +
        `(confidence ${(s.confidence * 100).toFixed(0)}%).`,
    );
  }, [game.suggestion, addLog, syncPosition]);

  // ── Curve is running: exit when the target is hit ─────────────────────
  useEffect(() => {
    const pos = positionRef.current;
    if (game.phase !== PHASES.RUNNING || !pos || pos.roundId !== game.roundId) return;
    if (game.multiplier < pos.target) return;

    const payout = pos.stake * game.multiplier;
    const profit = payout - pos.stake;
    setBalance((b) => b + payout);
    setStats((st) => ({
      ...st,
      rounds: st.rounds + 1,
      wins: st.wins + 1,
      pnl: st.pnl + profit,
    }));
    addLog('win', `Pulled out at ${formatMultiplier(game.multiplier)} — ${formatSigned(profit)} credits.`);
    syncPosition(null);
  }, [game.multiplier, game.phase, game.roundId, addLog, syncPosition]);

  // ── Crash: any position still open is lost ─────────────────────────────
  useEffect(() => {
    const pos = positionRef.current;
    if (game.phase !== PHASES.CRASHED || !pos) return;

    setStats((st) => ({
      ...st,
      rounds: st.rounds + 1,
      losses: st.losses + 1,
      pnl: st.pnl - pos.stake,
    }));
    addLog(
      'loss',
      `Crashed at ${formatMultiplier(game.lastCrashPoint)} before the ` +
        `${formatMultiplier(pos.target)} exit — ${formatSigned(-pos.stake)} credits.`,
    );
    syncPosition(null);
  }, [game.phase, game.lastCrashPoint, addLog, syncPosition]);

  const start = useCallback(() => {
    setRunning(true);
    addLog('system', 'Bot engaged. Positions open on the next betting window.');
  }, [addLog]);

  const stop = useCallback(() => {
    setRunning(false);
    addLog('system', 'Bot disengaged. Open positions still resolve.');
  }, [addLog]);

  const reset = useCallback(() => {
    setRunning(false);
    setBalance(STARTING_BALANCE);
    setStats({ rounds: 0, wins: 0, losses: 0, pnl: 0 });
    syncPosition(null);
    setLog([]);
    addLog('system', 'Session reset. Balance restored to 1,000.00 simulated credits.');
  }, [addLog, syncPosition]);

  return { running, balance, stats, log, activePosition, start, stop, reset };
}
