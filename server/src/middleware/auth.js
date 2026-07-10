import { config } from '../config.js';

/**
 * API-key authentication for protected routes.
 *
 * Clients must present the key from the API_KEY environment variable as
 * either an `x-api-key` header or a `Authorization: Bearer <key>` header.
 * If the server was started without API_KEY configured, protected routes
 * respond 503 rather than silently allowing traffic through.
 */
export function requireApiKey(req, res, next) {
  if (!config.apiKey) {
    return res.status(503).json({
      error: 'API_KEY is not configured on the server. Set it in the environment and restart.',
    });
  }

  const headerKey = req.get('x-api-key');
  const bearer = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  const provided = headerKey || bearer;

  if (!provided || !timingSafeEqual(provided, config.apiKey)) {
    return res.status(401).json({ error: 'Invalid or missing API key.' });
  }

  next();
}

/** Constant-time comparison to avoid leaking key length/prefix via timing. */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
