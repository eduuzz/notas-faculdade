const MAX_ENTRIES = 500;
const MAX_ERRORS = 100;
const MAX_HOURLY = 72; // 72 hours of history
const logs = [];
const errorLogs = [];
const hourlyHistory = [];
let totalRequests = 0;
let totalErrors = 0;
let activeRequests = 0;
let currentHourBucket = null;

function getHourKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:00`;
}

function ensureHourBucket() {
  const key = getHourKey();
  if (!currentHourBucket || currentHourBucket.hour !== key) {
    currentHourBucket = { hour: key, requests: 0, errors: 0, totalDuration: 0 };
    hourlyHistory.push(currentHourBucket);
    if (hourlyHistory.length > MAX_HOURLY) hourlyHistory.shift();
  }
  return currentHourBucket;
}

export function requestLogger(req, res, next) {
  // Skip admin endpoints to avoid noise
  if (req.path.startsWith('/api/admin')) return next();

  const start = Date.now();
  totalRequests++;
  activeRequests++;

  const onFinish = () => {
    activeRequests--;
    const duration = Date.now() - start;
    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      duration,
      user: req.user?.email || null,
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
    };

    if (res.statusCode >= 400) {
      totalErrors++;
      // Store detailed error entry
      const errEntry = {
        ...entry,
        body: req.method !== 'GET' ? summarizeBody(req.body) : undefined,
        userAgent: req.headers['user-agent'] || null,
      };
      errorLogs.push(errEntry);
      if (errorLogs.length > MAX_ERRORS) errorLogs.shift();
    }

    // Hourly bucket
    const bucket = ensureHourBucket();
    bucket.requests++;
    if (res.statusCode >= 400) bucket.errors++;
    bucket.totalDuration += duration;

    logs.push(entry);
    if (logs.length > MAX_ENTRIES) logs.shift();

    res.removeListener('finish', onFinish);
  };

  res.on('finish', onFinish);
  next();
}

function summarizeBody(body) {
  if (!body) return null;
  try {
    const str = JSON.stringify(body);
    return str.length > 200 ? str.slice(0, 200) + '...' : str;
  } catch { return null; }
}

export function getRecentLogs(limit = 50) {
  return logs.slice(-limit).reverse();
}

export function getErrorLogs(limit = 50) {
  return errorLogs.slice(-limit).reverse();
}

export function getHourlyHistory() {
  return hourlyHistory.map(h => ({
    hour: h.hour,
    requests: h.requests,
    errors: h.errors,
    avgDuration: h.requests > 0 ? Math.round(h.totalDuration / h.requests) : 0,
  }));
}

export function clearLogs() {
  logs.length = 0;
  errorLogs.length = 0;
  totalRequests = 0;
  totalErrors = 0;
}

export function getRequestStats() {
  const now = Date.now();
  const oneMinAgo = now - 60_000;
  const fiveMinAgo = now - 300_000;

  const recentLogs = logs.filter(l => new Date(l.timestamp).getTime() > fiveMinAgo);
  const lastMinute = recentLogs.filter(l => new Date(l.timestamp).getTime() > oneMinAgo);

  // Top endpoints
  const endpointCounts = {};
  for (const l of recentLogs) {
    const key = `${l.method} ${l.path.split('?')[0]}`;
    endpointCounts[key] = (endpointCounts[key] || 0) + 1;
  }
  const topEndpoints = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }));

  // Top users
  const userCounts = {};
  for (const l of logs) {
    const u = l.user || 'anonymous';
    userCounts[u] = (userCounts[u] || 0) + 1;
  }
  const topUsers = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([user, count]) => ({ user, count }));

  // Avg response time
  const avgDuration = recentLogs.length > 0
    ? Math.round(recentLogs.reduce((sum, l) => sum + l.duration, 0) / recentLogs.length)
    : 0;

  // Status code breakdown
  const statusBreakdown = {};
  for (const l of logs) {
    const group = `${String(l.status)[0]}xx`;
    statusBreakdown[group] = (statusBreakdown[group] || 0) + 1;
  }

  return {
    totalRequests,
    totalErrors,
    activeRequests,
    requestsLastMinute: lastMinute.length,
    requestsLast5Min: recentLogs.length,
    avgResponseTime: avgDuration,
    errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(1) : '0.0',
    topEndpoints,
    topUsers,
    statusBreakdown,
  };
}
