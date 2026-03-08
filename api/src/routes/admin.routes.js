import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { getProcessStats } from '../utils/processStats.js';
import { getRecentLogs, getRequestStats } from '../middleware/requestLogger.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

const supabase =
  config.supabaseUrl && config.supabaseServiceKey
    ? createClient(config.supabaseUrl, config.supabaseServiceKey)
    : null;

/**
 * GET /api/admin/dashboard
 * Serve the admin dashboard HTML page
 */
router.get('/dashboard', (req, res) => {
  try {
    const html = readFileSync(join(__dirname, '../admin/dashboard.html'), 'utf-8');
    res.type('html').send(html);
  } catch {
    res.status(500).send('Dashboard HTML not found');
  }
});

/**
 * GET /api/admin/health
 * Extended health check with process stats
 */
router.get('/health', (req, res) => {
  const stats = getProcessStats();
  const reqStats = getRequestStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...stats,
    requests: reqStats,
  });
});

/**
 * GET /api/admin/services
 * Probe external service status
 */
router.get('/services', async (req, res) => {
  const results = {};

  // Railway (self) — the API being up IS the check
  results.railway = {
    status: 'online',
    uptime: getProcessStats().uptimeFormatted,
  };

  // Supabase
  try {
    const start = Date.now();
    if (supabase) {
      const { count, error } = await supabase
        .from('usuarios_autorizados')
        .select('*', { count: 'exact', head: true });
      results.supabase = {
        status: error ? 'error' : 'online',
        responseTime: Date.now() - start,
        error: error?.message || null,
      };
    } else {
      results.supabase = { status: 'not_configured' };
    }
  } catch (err) {
    results.supabase = { status: 'offline', error: err.message };
  }

  // Vercel (frontend)
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch('https://semestry.com.br', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timer);
    results.vercel = {
      status: resp.ok ? 'online' : 'error',
      statusCode: resp.status,
      responseTime: Date.now() - start,
    };
  } catch (err) {
    results.vercel = { status: 'offline', error: err.message };
  }

  // Portal TOTVS
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(config.portalBaseUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timer);
    results.portal = {
      status: resp.ok || resp.status === 302 ? 'online' : 'error',
      statusCode: resp.status,
      responseTime: Date.now() - start,
    };
  } catch (err) {
    results.portal = { status: 'offline', error: err.message };
  }

  res.json(results);
});

/**
 * GET /api/admin/users
 * User statistics from Supabase
 */
router.get('/users', async (req, res) => {
  if (!supabase) {
    return res.json({ total: 0, active: 0, message: 'Supabase not configured' });
  }

  try {
    // Total authorized users
    const { count: total } = await supabase
      .from('usuarios_autorizados')
      .select('*', { count: 'exact', head: true });

    // Active users
    const { count: active } = await supabase
      .from('usuarios_autorizados')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // Users with curso set (completed profile)
    const { count: withCurso } = await supabase
      .from('usuarios_autorizados')
      .select('*', { count: 'exact', head: true })
      .not('curso', 'is', null);

    // Recent users (list)
    const { data: recentUsers } = await supabase
      .from('usuarios_autorizados')
      .select('email, nome, curso, ativo, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({
      total: total || 0,
      active: active || 0,
      withProfile: withCurso || 0,
      recent: recentUsers || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/logs
 * Recent API request logs
 */
router.get('/logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  res.json(getRecentLogs(limit));
});

/**
 * GET /api/admin/stats
 * Aggregated request statistics
 */
router.get('/stats', (req, res) => {
  res.json(getRequestStats());
});

export default router;
