import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config.js';
import { GameLoop, PHASES } from './game/gameLoop.js';
import { requestPrediction } from './services/predictor.js';
import { analyzeRouter } from './routes/analyze.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

// ── Simulated game loop ────────────────────────────────────────────────
const game = new GameLoop(config.game);

game.on('phase', (payload) => io.emit('game:phase', payload));
game.on('tick', (payload) => io.emit('game:tick', payload));
game.on('crash', (payload) => io.emit('game:crash', payload));

// At the start of every betting window, run the (pluggable) analysis
// service over the last 10 results and broadcast its suggestion so the
// in-browser bot can act on it. The API key never leaves the server.
game.on('phase', async ({ phase, roundId }) => {
  if (phase !== PHASES.BETTING) return;
  try {
    const history = game.history.slice(0, 10).map((h) => h.crashPoint);
    const analysis = await requestPrediction(history, config.apiKey);
    io.emit('game:suggestion', { roundId, ...analysis });
  } catch (err) {
    console.error('[suggestion] prediction service failed:', err);
  }
});

io.on('connection', (socket) => {
  // New clients immediately receive the current round state + history.
  socket.emit('game:snapshot', game.snapshot());
});

// ── HTTP API ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Polling fallback for environments where WebSockets are unavailable.
app.get('/api/state', (_req, res) => res.json(game.snapshot()));

app.get('/api/history', (_req, res) => res.json({ history: game.history }));

// Authenticated analysis endpoint (see routes/analyze.js).
app.use('/api', analyzeRouter);

// ── Static frontend (client/dist, produced by `npm run build`) ────────
app.use(express.static(clientDist));
app.get(/^\/(?!api|socket\.io).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res
        .status(404)
        .send('Frontend build not found. Run `npm run build` from the repo root first.');
    }
  });
});

httpServer.listen(config.port, () => {
  console.log(`QuantumCrash Analytics server listening on http://localhost:${config.port}`);
  if (!config.apiKey) {
    console.warn('⚠  API_KEY is not set — POST /api/analyze will respond 503 until it is.');
  }
  game.start();
});
