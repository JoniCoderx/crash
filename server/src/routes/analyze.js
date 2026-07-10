import { Router } from 'express';
import { config } from '../config.js';
import { requireApiKey } from '../middleware/auth.js';
import { requestPrediction } from '../services/predictor.js';

/**
 * POST /api/analyze  (authenticated with the API_KEY env var)
 *
 * Body: { "history": [1.42, 3.07, 1.0, ...] }  — last (up to) 10 crash
 * points, newest first. Responds with the prediction-service payload
 * (see services/predictor.js, which is the plug-in point for an external
 * analysis API).
 */
export const analyzeRouter = Router();

analyzeRouter.post('/analyze', requireApiKey, async (req, res) => {
  const { history } = req.body ?? {};

  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({
      error: 'Body must include `history`: a non-empty array of recent crash points.',
    });
  }
  if (history.length > 10) {
    return res.status(400).json({ error: '`history` accepts at most the last 10 crash points.' });
  }
  if (!history.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 1)) {
    return res.status(400).json({ error: '`history` values must be numbers >= 1.' });
  }

  try {
    const analysis = await requestPrediction(history, config.apiKey);
    res.json({ ok: true, analysis });
  } catch (err) {
    console.error('[analyze] prediction service failed:', err);
    res.status(502).json({ error: 'Prediction service unavailable.' });
  }
});
