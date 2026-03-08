import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { getProcessStats } from '../utils/processStats.js';
import { getRecentLogs, getRequestStats, getErrorLogs, getHourlyHistory, clearLogs } from '../middleware/requestLogger.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

const supabase =
  config.supabaseUrl && config.supabaseServiceKey
    ? createClient(config.supabaseUrl, config.supabaseServiceKey)
    : null;

// ── Service uptime history (in-memory) ──
const serviceHistory = []; // { timestamp, railway, supabase, vercel, portal }
const MAX_SERVICE_HISTORY = 288; // ~24h at 5min intervals

/**
 * GET /api/admin/dashboard
 */
router.get('/dashboard', (req, res) => {
  try {
    const html = readFileSync(join(__dirname, '../admin/dashboard.html'), 'utf-8');
    res.removeHeader('Content-Security-Policy');
    res.type('html').send(html);
  } catch {
    res.status(500).send('Dashboard HTML not found');
  }
});

/**
 * GET /api/admin/health
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
 */
router.get('/services', async (req, res) => {
  const results = {};

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

  // Vercel
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

  // Save to history
  serviceHistory.push({
    timestamp: new Date().toISOString(),
    railway: results.railway.status,
    supabase: results.supabase.status,
    vercel: results.vercel.status,
    portal: results.portal.status,
  });
  if (serviceHistory.length > MAX_SERVICE_HISTORY) serviceHistory.shift();

  res.json(results);
});

/**
 * GET /api/admin/services/history
 */
router.get('/services/history', (req, res) => {
  res.json(serviceHistory);
});

/**
 * GET /api/admin/users
 */
router.get('/users', async (req, res) => {
  if (!supabase) {
    return res.json({ total: 0, active: 0, message: 'Supabase not configured' });
  }

  try {
    const { count: total } = await supabase
      .from('usuarios_autorizados')
      .select('*', { count: 'exact', head: true });

    const { count: active } = await supabase
      .from('usuarios_autorizados')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    const { count: withCurso } = await supabase
      .from('usuarios_autorizados')
      .select('*', { count: 'exact', head: true })
      .not('curso', 'is', null);

    const { data: recentUsers } = await supabase
      .from('usuarios_autorizados')
      .select('id, email, nome, curso, ativo, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

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
 * PATCH /api/admin/users/:id
 * Toggle user active status
 */
router.patch('/users/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const { id } = req.params;
  const { ativo } = req.body;

  if (typeof ativo !== 'boolean') {
    return res.status(400).json({ error: 'Field "ativo" (boolean) required' });
  }

  try {
    const { data, error } = await supabase
      .from('usuarios_autorizados')
      .update({ ativo })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/users
 * Add a new authorized user
 */
router.post('/users', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  const { email, nome } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const { data, error } = await supabase
      .from('usuarios_autorizados')
      .insert({ email: email.toLowerCase().trim(), nome: nome || null, ativo: true })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

  try {
    const { error } = await supabase
      .from('usuarios_autorizados')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/logs
 */
router.get('/logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  res.json(getRecentLogs(limit));
});

/**
 * GET /api/admin/errors
 */
router.get('/errors', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  res.json(getErrorLogs(limit));
});

/**
 * DELETE /api/admin/logs
 * Clear all logs and reset counters
 */
router.delete('/logs', (req, res) => {
  clearLogs();
  res.json({ ok: true, message: 'Logs cleared' });
});

/**
 * GET /api/admin/stats
 */
router.get('/stats', (req, res) => {
  res.json(getRequestStats());
});

/**
 * GET /api/admin/stats/hourly
 */
router.get('/stats/hourly', (req, res) => {
  res.json(getHourlyHistory());
});

/**
 * POST /api/admin/test-portal
 * Quick portal connectivity test (HEAD request only, no scraping)
 */
router.post('/test-portal', async (req, res) => {
  const results = { steps: [] };
  const addStep = (name, status, detail) => results.steps.push({ name, status, detail, time: new Date().toISOString() });

  // Step 1: DNS/connectivity
  try {
    const start = Date.now();
    const resp = await fetch(config.portalBaseUrl, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    addStep('Connectivity', resp.ok || resp.status === 302 ? 'ok' : 'warn', `HTTP ${resp.status} in ${Date.now() - start}ms`);
  } catch (err) {
    addStep('Connectivity', 'fail', err.message);
  }

  // Step 2: Supabase
  try {
    const start = Date.now();
    if (supabase) {
      const { error } = await supabase.from('usuarios_autorizados').select('*', { count: 'exact', head: true });
      addStep('Supabase', error ? 'fail' : 'ok', error ? error.message : `${Date.now() - start}ms`);
    } else {
      addStep('Supabase', 'skip', 'Not configured');
    }
  } catch (err) {
    addStep('Supabase', 'fail', err.message);
  }

  // Step 3: Frontend
  try {
    const start = Date.now();
    const resp = await fetch('https://semestry.com.br', { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    addStep('Frontend', resp.ok ? 'ok' : 'warn', `HTTP ${resp.status} in ${Date.now() - start}ms`);
  } catch (err) {
    addStep('Frontend', 'fail', err.message);
  }

  const allOk = results.steps.every(s => s.status === 'ok');
  results.overall = allOk ? 'ok' : 'issues';
  res.json(results);
});

/**
 * GET /api/admin/env
 * Show environment info (masked values)
 */
router.get('/env', (req, res) => {
  const mask = (val) => {
    if (!val) return '(not set)';
    if (val.length <= 8) return '****';
    return val.slice(0, 4) + '****' + val.slice(-4);
  };

  res.json({
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: config.port,
    PORTAL_BASE_URL: config.portalBaseUrl,
    CORS_ORIGIN: config.corsOrigin,
    SUPABASE_URL: config.supabaseUrl || '(not set)',
    SUPABASE_SERVICE_KEY: mask(config.supabaseServiceKey),
    ADMIN_SECRET: mask(config.adminSecret),
    ANTHROPIC_API_KEY: mask(config.anthropicApiKey),
  });
});

export default router;
