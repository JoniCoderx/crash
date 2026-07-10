import { useEffect, useRef, useState } from 'react';
import { socket } from '../lib/socket.js';

export const PHASES = {
  BETTING: 'BETTING',
  RUNNING: 'RUNNING',
  CRASHED: 'CRASHED',
};

/**
 * Subscribes to the simulated game feed and exposes render-ready state:
 *
 *   phase          current round phase (BETTING / RUNNING / CRASHED)
 *   roundId        id of the current round
 *   multiplier     latest multiplier value
 *   points         [{ t, m }] samples of the current curve, for the chart
 *   history        finished rounds, newest first
 *   suggestion     latest analysis-service output (per betting window)
 *   phaseEndsAt    epoch ms when the betting window closes
 *   lastCrashPoint crash point of the most recent finished round
 *   connected      socket connectivity, for the status pill
 */
export function useGameSocket() {
  const [state, setState] = useState({
    phase: PHASES.BETTING,
    roundId: 0,
    multiplier: 1,
    phaseEndsAt: 0,
    lastCrashPoint: null,
    history: [],
    suggestion: null,
    connected: socket.connected,
  });
  const [points, setPoints] = useState([{ t: 0, m: 1 }]);
  const pointsRef = useRef(points);

  useEffect(() => {
    const setPointsSync = (next) => {
      pointsRef.current = next;
      setPoints(next);
    };

    const onConnect = () => setState((s) => ({ ...s, connected: true }));
    const onDisconnect = () => setState((s) => ({ ...s, connected: false }));

    const onSnapshot = (snap) => {
      setState((s) => ({
        ...s,
        phase: snap.phase,
        roundId: snap.roundId,
        multiplier: snap.multiplier,
        phaseEndsAt: snap.phaseEndsAt,
        lastCrashPoint: snap.lastCrashPoint,
        history: snap.history,
      }));
      setPointsSync([{ t: 0, m: 1 }]);
    };

    const onPhase = ({ phase, roundId, endsAt }) => {
      setState((s) => ({
        ...s,
        phase,
        roundId,
        phaseEndsAt: endsAt ?? 0,
        // Reset the readout for the new round — otherwise the previous
        // crash value lingers until the first tick and can trip the bot's
        // cash-out check.
        multiplier: phase === PHASES.CRASHED ? s.multiplier : 1,
      }));
      if (phase === PHASES.RUNNING) setPointsSync([{ t: 0, m: 1 }]);
    };

    const onTick = ({ multiplier, elapsedMs }) => {
      setState((s) => ({ ...s, multiplier }));
      setPointsSync([...pointsRef.current, { t: elapsedMs / 1000, m: multiplier }]);
    };

    const onCrash = ({ crashPoint, history }) => {
      setState((s) => ({
        ...s,
        phase: PHASES.CRASHED,
        multiplier: crashPoint,
        lastCrashPoint: crashPoint,
        history,
      }));
      const last = pointsRef.current[pointsRef.current.length - 1];
      setPointsSync([...pointsRef.current, { t: (last?.t ?? 0) + 0.1, m: crashPoint }]);
    };

    const onSuggestion = (suggestion) => setState((s) => ({ ...s, suggestion }));

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game:snapshot', onSnapshot);
    socket.on('game:phase', onPhase);
    socket.on('game:tick', onTick);
    socket.on('game:crash', onCrash);
    socket.on('game:suggestion', onSuggestion);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game:snapshot', onSnapshot);
      socket.off('game:phase', onPhase);
      socket.off('game:tick', onTick);
      socket.off('game:crash', onCrash);
      socket.off('game:suggestion', onSuggestion);
    };
  }, []);

  return { ...state, points };
}
