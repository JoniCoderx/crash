import { EventEmitter } from 'node:events';
import { sampleCrashPoint } from './crashPoint.js';

/** Round lifecycle phases, broadcast to every client. */
export const PHASES = {
  BETTING: 'BETTING', // countdown — positions may be placed
  RUNNING: 'RUNNING', // multiplier is climbing
  CRASHED: 'CRASHED', // round over — short cooldown before the next
};

/**
 * The simulated game loop.
 *
 * A small state machine that endlessly cycles
 * BETTING → RUNNING → CRASHED → BETTING…, emitting events consumed by the
 * Socket.io layer:
 *
 *   'phase'  { phase, roundId, endsAt?, crashPoint? }
 *   'tick'   { roundId, multiplier, elapsedMs }
 *   'crash'  { roundId, crashPoint, history }
 *
 * The crash point for each round is sampled up-front (server-side only —
 * it is never revealed to clients until the round actually crashes).
 */
export class GameLoop extends EventEmitter {
  constructor(options) {
    super();
    this.opts = options;
    this.phase = PHASES.BETTING;
    this.roundId = 0;
    this.multiplier = 1.0;
    this.history = []; // newest first: { roundId, crashPoint, at }
    this.crashPoint = null;
    this.phaseEndsAt = 0;
    this.roundStartedAt = 0;
    this.timer = null;
  }

  start() {
    this.enterBetting();
  }

  stop() {
    clearTimeout(this.timer);
    clearInterval(this.timer);
  }

  /** Snapshot sent to newly connected clients and the polling endpoint. */
  snapshot() {
    return {
      phase: this.phase,
      roundId: this.roundId,
      multiplier: round2(this.multiplier),
      elapsedMs: this.phase === PHASES.RUNNING ? Date.now() - this.roundStartedAt : 0,
      phaseEndsAt: this.phaseEndsAt,
      lastCrashPoint: this.history[0]?.crashPoint ?? null,
      history: this.history,
    };
  }

  enterBetting() {
    this.phase = PHASES.BETTING;
    this.roundId += 1;
    this.multiplier = 1.0;
    this.crashPoint = sampleCrashPoint(this.opts.houseEdge);
    this.phaseEndsAt = Date.now() + this.opts.bettingWindowMs;

    this.emit('phase', {
      phase: PHASES.BETTING,
      roundId: this.roundId,
      endsAt: this.phaseEndsAt,
    });

    this.timer = setTimeout(() => this.enterRunning(), this.opts.bettingWindowMs);
  }

  enterRunning() {
    this.phase = PHASES.RUNNING;
    this.roundStartedAt = Date.now();
    this.phaseEndsAt = 0;

    this.emit('phase', { phase: PHASES.RUNNING, roundId: this.roundId });

    this.timer = setInterval(() => {
      const elapsedMs = Date.now() - this.roundStartedAt;
      this.multiplier = Math.exp(this.opts.growthRatePerMs * elapsedMs);

      if (this.multiplier >= this.crashPoint) {
        this.enterCrashed();
        return;
      }

      this.emit('tick', {
        roundId: this.roundId,
        multiplier: round2(this.multiplier),
        elapsedMs,
      });
    }, this.opts.tickIntervalMs);
  }

  enterCrashed() {
    clearInterval(this.timer);
    this.phase = PHASES.CRASHED;
    this.multiplier = this.crashPoint;

    this.history.unshift({
      roundId: this.roundId,
      crashPoint: round2(this.crashPoint),
      at: Date.now(),
    });
    if (this.history.length > this.opts.historySize) this.history.pop();

    this.emit('crash', {
      roundId: this.roundId,
      crashPoint: round2(this.crashPoint),
      history: this.history,
    });

    this.timer = setTimeout(() => this.enterBetting(), this.opts.cooldownMs);
  }
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
