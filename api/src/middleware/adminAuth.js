import { config } from '../config/index.js';

/**
 * Admin authentication middleware.
 * Supports two strategies:
 * 1. ADMIN_SECRET token via query param ?token= or Authorization header
 * 2. Falls back to dev mode if no secret configured
 */
export function requireAdmin(req, res, next) {
  const secret = config.adminSecret;

  // Dev mode: no secret configured
  if (!secret) {
    req.admin = true;
    return next();
  }

  // Check query param or Authorization header
  const tokenFromQuery = req.query.token;
  const tokenFromHeader = req.headers.authorization?.replace('Bearer ', '');
  const provided = tokenFromQuery || tokenFromHeader;

  if (!provided || provided !== secret) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  req.admin = true;
  next();
}
