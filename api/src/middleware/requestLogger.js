const MAX_ENTRIES = 500;
const logs = [];
let totalRequests = 0;
let totalErrors = 0;
let activeRequests = 0;

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

    if (res.statusCode >= 400) totalErrors++;

    logs.push(entry);
    if (logs.length > MAX_ENTRIES) logs.shift();

    res.removeListener('finish', onFinish);
  };

  res.on('finish', onFinish);
  next();
}

export function getRecentLogs(limit = 50) {
  return logs.slice(-limit).reverse();
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

  // Avg response time
  const avgDuration = recentLogs.length > 0
    ? Math.round(recentLogs.reduce((sum, l) => sum + l.duration, 0) / recentLogs.length)
    : 0;

  return {
    totalRequests,
    totalErrors,
    activeRequests,
    requestsLastMinute: lastMinute.length,
    requestsLast5Min: recentLogs.length,
    avgResponseTime: avgDuration,
    errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(1) : '0.0',
    topEndpoints,
  };
}
